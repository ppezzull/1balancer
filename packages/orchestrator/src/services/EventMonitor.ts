import { ethers } from 'ethers';
import { createLogger } from '../utils/logger';
import { config } from '../config';
import { CrossChainCoordinator } from '../core/CrossChainCoordinator';

const logger = createLogger('EventMonitor');

interface MonitoredContract {
  address: string;
  abi: any[];
  events: string[];
}

interface ChainMonitor {
  provider: ethers.JsonRpcProvider;
  contracts: Map<string, ethers.Contract>;
  lastBlock: number;
  polling: boolean;
  pollInterval?: NodeJS.Timeout;
}

export class EventMonitor {
  private chainMonitors: Map<string, ChainMonitor> = new Map();
  private nearPollInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(private coordinator: CrossChainCoordinator) {
    // Initialization will happen in start() method
  }

  private async initializeMonitors(): Promise<void> {
    try {
      // Initialize BASE chain monitor
      logger.info('Initializing BASE provider', { url: config.chains.base.rpcUrl });
      const baseProvider = await this.createProviderWithFallback('base', [
        config.chains.base.rpcUrl,
        'https://base-sepolia-rpc.publicnode.com',
        'https://sepolia.base.org',
      ]);
      this.chainMonitors.set('base', {
        provider: baseProvider,
        contracts: new Map(),
        lastBlock: 0,
        polling: false,
      });

      // Initialize Ethereum monitor if configured
      if (config.chains.ethereum.rpcUrl && config.chains.ethereum.rpcUrl.trim() !== '') {
        logger.info('Initializing Ethereum provider', { url: config.chains.ethereum.rpcUrl });
        try {
          const ethProvider = await this.createProviderWithFallback('ethereum', [
            config.chains.ethereum.rpcUrl,
            'https://ethereum-sepolia-rpc.publicnode.com',
            'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
          ]);
          this.chainMonitors.set('ethereum', {
            provider: ethProvider,
            contracts: new Map(),
            lastBlock: 0,
            polling: false,
          });
        } catch (error) {
          logger.warn('Failed to initialize Ethereum provider, continuing without it', { 
            error: (error as Error).message,
            url: config.chains.ethereum.rpcUrl 
          });
        }
      } else {
        logger.info('Ethereum RPC URL not configured, skipping Ethereum monitoring');
      }
    } catch (error) {
      logger.error('Failed to initialize monitors', { error: (error as Error).message });
      throw error;
    }
  }

  private async createProviderWithFallback(chain: string, urls: string[]): Promise<ethers.JsonRpcProvider> {
    const errors: string[] = [];
    
    // Define static network configurations to avoid network detection issues
    const networkConfigs: Record<string, ethers.Network> = {
      base: new ethers.Network('base-sepolia', 84532),
      ethereum: new ethers.Network('sepolia', 11155111),
    };
    
    for (const url of urls) {
      try {
        logger.debug(`Trying provider for ${chain}`, { url });
        
        let provider: ethers.JsonRpcProvider;
        
        // Check if it's an Alchemy URL and extract API key
        const ethAlchemyMatch = url.match(/https:\/\/eth-sepolia\.g\.alchemy\.com\/v2\/(.+)/);
        const baseAlchemyMatch = url.match(/https:\/\/base-sepolia\.g\.alchemy\.com\/v2\/(.+)/);
        
        if (ethAlchemyMatch && ethAlchemyMatch[1]) {
          // Use AlchemyProvider for Ethereum Sepolia
          try {
            provider = new ethers.AlchemyProvider('sepolia', ethAlchemyMatch[1]);
            logger.debug(`Using AlchemyProvider for ${chain} (Ethereum Sepolia)`);
          } catch (error) {
            logger.debug(`AlchemyProvider failed, falling back to JsonRpcProvider`);
            provider = new ethers.JsonRpcProvider(url, networkConfigs[chain], {
              staticNetwork: networkConfigs[chain],
              batchMaxCount: 1,
            });
          }
        } else if (baseAlchemyMatch && baseAlchemyMatch[1]) {
          // Use JsonRpcProvider for Base Sepolia (AlchemyProvider doesn't support Base)
          provider = new ethers.JsonRpcProvider(url, networkConfigs[chain], {
            staticNetwork: networkConfigs[chain],
            batchMaxCount: 1,
          });
          logger.debug(`Using JsonRpcProvider for ${chain} (Base Sepolia via Alchemy)`);
        } else {
          // Use regular JsonRpcProvider for other URLs
          provider = new ethers.JsonRpcProvider(url, networkConfigs[chain], {
            staticNetwork: networkConfigs[chain],
            batchMaxCount: 1, // Disable batching for better error handling
          });
        }
        
        // Test the connection with a simple call
        const testConnection = async () => {
          try {
            await provider.getBlockNumber();
            return true;
          } catch (error: any) {
            if (error.code === 'SERVER_ERROR' && error.info?.responseStatus === '401 Unauthorized') {
              logger.debug(`Auth failed for ${url}, trying next...`);
              return false;
            }
            // For other errors, also try next provider
            logger.debug(`Connection test failed for ${url}: ${error.message}`);
            return false;
          }
        };
        
        // Test with timeout
        const connected = await Promise.race([
          testConnection(),
          new Promise<boolean>(resolve => setTimeout(() => resolve(false), 5000))
        ]);
        
        if (connected) {
          logger.info(`Successfully connected to ${chain} provider`, { url });
          return provider;
        } else {
          throw new Error(`Connection test failed for ${url}`);
        }
      } catch (error) {
        const errorMsg = (error as Error).message;
        errors.push(`${url}: ${errorMsg}`);
        logger.debug(`Failed to create provider for ${chain}`, { url, error: errorMsg });
      }
    }
    
    throw new Error(`Failed to create provider for ${chain}. Tried URLs: ${errors.join(', ')}`);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Event monitor already running');
      return;
    }

    logger.info('Starting event monitor');
    this.isRunning = true;

    try {
      // Initialize monitors first
      await this.initializeMonitors();

      // Setup contract monitoring
      await this.setupContractMonitoring();

      // Start EVM chain monitoring
      for (const [chain, monitor] of this.chainMonitors) {
        await this.startChainMonitoring(chain, monitor);
      }

      // Start NEAR monitoring
      await this.startNearMonitoring();

      logger.info('Event monitor started successfully');
    } catch (error) {
      logger.error('Failed to start event monitor', { error });
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping event monitor');
    this.isRunning = false;

    // Stop chain monitoring
    for (const [_chain, monitor] of this.chainMonitors) {
      if (monitor.pollInterval) {
        clearInterval(monitor.pollInterval);
      }
      monitor.polling = false;
    }

    // Stop NEAR monitoring
    if (this.nearPollInterval) {
      clearInterval(this.nearPollInterval);
    }

    logger.info('Event monitor stopped');
  }

  isConnected(chain: string): boolean {
    if (chain === 'near') {
      return !!this.nearPollInterval;
    }

    const monitor = this.chainMonitors.get(chain);
    return monitor ? monitor.polling : false;
  }

  private async setupContractMonitoring(): Promise<void> {
    // Monitor EscrowFactory
    if (config.contracts.escrowFactory !== ethers.ZeroAddress) {
      const escrowFactoryAbi = [
        'event SrcEscrowCreated(address indexed escrow, bytes32 indexed orderHash, address indexed maker)',
        'event DstEscrowCreated(address indexed escrow, bytes32 indexed orderHash, address indexed taker)',
      ];

      this.addContract('base', {
        address: config.contracts.escrowFactory,
        abi: escrowFactoryAbi,
        events: ['SrcEscrowCreated', 'DstEscrowCreated'],
      });
    }

    // Monitor FusionPlusResolver
    if (config.contracts.fusionPlusResolver !== ethers.ZeroAddress) {
      const resolverAbi = [
        'event SwapInitiated(bytes32 indexed sessionId, address indexed srcEscrow, bytes32 orderHash)',
        'event SwapCompleted(bytes32 indexed sessionId, bytes32 secret)',
      ];

      this.addContract('base', {
        address: config.contracts.fusionPlusResolver,
        abi: resolverAbi,
        events: ['SwapInitiated', 'SwapCompleted'],
      });
    }
  }

  private addContract(chain: string, contract: MonitoredContract): void {
    const monitor = this.chainMonitors.get(chain);
    if (!monitor) {
      logger.warn('Chain monitor not found', { chain });
      return;
    }

    const contractInstance = new ethers.Contract(
      contract.address,
      contract.abi,
      monitor.provider
    );

    monitor.contracts.set(contract.address, contractInstance);

    logger.info('Added contract for monitoring', {
      chain,
      address: contract.address,
      events: contract.events,
    });
  }

  private async startChainMonitoring(chain: string, monitor: ChainMonitor): Promise<void> {
    logger.info('Starting chain monitoring', { chain });

    try {
      // Get current block with timeout
      const currentBlock = await Promise.race([
        monitor.provider.getBlockNumber(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout connecting to ${chain} RPC`)), 10000)
        )
      ]);
      monitor.lastBlock = currentBlock - config.eventMonitoring.maxReorgDepth;

      // Skip event listeners for HTTP providers - we'll use polling instead
      logger.info('Using polling mechanism for event monitoring (HTTP provider)');

      // Start polling for new blocks
      monitor.polling = true;
      monitor.pollInterval = setInterval(
        () => this.pollChain(chain, monitor).catch(error => {
          logger.error('Error polling chain', { chain, error: (error as Error).message });
        }),
        config.eventMonitoring.pollingInterval
      );

      logger.info('Chain monitoring started', { chain, startBlock: monitor.lastBlock });
    } catch (error) {
      logger.error('Failed to start chain monitoring', { 
        chain, 
        error: (error as Error).message,
        rpcUrl: chain === 'ethereum' ? config.chains.ethereum.rpcUrl : config.chains.base.rpcUrl
      });
      // Don't throw, just continue without this chain
      monitor.polling = false;
    }
  }

  // Removed setupEventListeners - using polling instead for HTTP providers
  // Event listeners with contract.on() don't work reliably with public HTTP endpoints
  // The polling mechanism in pollChain() handles event detection

  private async pollChain(chain: string, monitor: ChainMonitor): Promise<void> {
    if (!monitor.polling) {
      return;
    }

    try {
      const currentBlock = await monitor.provider.getBlockNumber();
      
      if (currentBlock > monitor.lastBlock) {
        // Process new blocks
        const fromBlock = monitor.lastBlock + 1;
        const toBlock = Math.min(
          currentBlock,
          monitor.lastBlock + 100 // Process max 100 blocks at a time
        );

        await this.processBlockRange(chain, monitor, fromBlock, toBlock);
        monitor.lastBlock = toBlock;
      }
    } catch (error) {
      logger.error('Chain polling error', { chain, error });
    }
  }

  private async processBlockRange(
    chain: string,
    monitor: ChainMonitor,
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    logger.debug('Processing block range', { chain, fromBlock, toBlock });

    for (const [address, contract] of monitor.contracts) {
      try {
        // Query past events
        const filter = {
          address,
          fromBlock,
          toBlock,
        };

        const logs = await monitor.provider.getLogs(filter);
        
        for (const log of logs) {
          await this.processLog(chain, contract, log);
        }
      } catch (error) {
        logger.error('Failed to process block range', {
          chain,
          address,
          fromBlock,
          toBlock,
          error,
        });
      }
    }
  }

  private async processLog(
    chain: string,
    contract: ethers.Contract,
    log: ethers.Log
  ): Promise<void> {
    try {
      const parsedLog = contract.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });

      if (!parsedLog) {
        return;
      }

      logger.debug('Processing log', {
        chain,
        event: parsedLog.name,
        blockNumber: log.blockNumber,
      });

      // Route to appropriate handler
      switch (parsedLog.name) {
        case 'SrcEscrowCreated':
          await this.coordinator.handleEscrowCreated({
            orderHash: parsedLog.args.hashlockHash || parsedLog.args.orderHash,
            escrow: parsedLog.args.escrow,
            maker: parsedLog.args.maker,
            chain,
            isSource: true,
          });
          break;

        case 'DstEscrowCreated':
          await this.coordinator.handleEscrowCreated({
            orderHash: parsedLog.args.hashlockHash || parsedLog.args.orderHash,
            escrow: parsedLog.args.escrow,
            maker: parsedLog.args.maker,
            chain,
            isSource: false,
          });
          break;

        case 'SecretRevealed':
          await this.coordinator.handleSecretRevealed({
            secret: parsedLog.args.secret,
            escrow: log.address,
          });
          break;
      }
    } catch (error) {
      logger.error('Failed to process log', {
        chain,
        transactionHash: log.transactionHash,
        error,
      });
    }
  }

  private async startNearMonitoring(): Promise<void> {
    logger.info('Starting NEAR monitoring');

    // Use the CrossChainCoordinator's NEAR monitoring
    await this.coordinator.startNEARMonitoring();
    
    // Mark as running for status checks
    this.nearPollInterval = setInterval(() => {
      // Just a heartbeat to indicate NEAR monitoring is active
      logger.debug('NEAR monitoring heartbeat');
    }, 30000); // Every 30 seconds
  }

  // Removed handleWithRetry - was only used with event listeners
  /*private async handleWithRetry(fn: () => Promise<void>): Promise<void> {
    const operation = retry.operation({
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 5000,
    });

    return new Promise((resolve, reject) => {
      operation.attempt(async (currentAttempt: number) => {
        try {
          await fn();
          resolve();
        } catch (error) {
          logger.warn(`Attempt ${currentAttempt} failed`, { error });
          
          if (!operation.retry(error as Error)) {
            reject(operation.mainError());
          }
        }
      });
    });
  }*/

  // Admin methods
  async getMonitoringStatus(): Promise<{
    chains: {
      [chain: string]: {
        connected: boolean;
        lastBlock: number;
        contracts: number;
      };
    };
    near: {
      connected: boolean;
    };
  }> {
    const chains: any = {};

    for (const [chain, monitor] of this.chainMonitors) {
      chains[chain] = {
        connected: monitor.polling,
        lastBlock: monitor.lastBlock,
        contracts: monitor.contracts.size,
      };
    }

    return {
      chains,
      near: {
        connected: !!this.nearPollInterval,
      },
    };
  }
}