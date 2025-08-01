import { ethers } from 'ethers';
import { createLogger } from '../utils/logger';
import { config } from '../config';
import { CrossChainCoordinator } from '../core/CrossChainCoordinator';
import retry from 'retry';

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
    this.initializeMonitors();
  }

  private initializeMonitors(): void {
    // Initialize BASE chain monitor
    const baseProvider = new ethers.JsonRpcProvider(config.chains.base.rpcUrl);
    this.chainMonitors.set('base', {
      provider: baseProvider,
      contracts: new Map(),
      lastBlock: 0,
      polling: false,
    });

    // Initialize Ethereum monitor if configured
    if (config.chains.ethereum.rpcUrl && config.chains.ethereum.rpcUrl.trim() !== '') {
      const ethProvider = new ethers.JsonRpcProvider(config.chains.ethereum.rpcUrl);
      this.chainMonitors.set('ethereum', {
        provider: ethProvider,
        contracts: new Map(),
        lastBlock: 0,
        polling: false,
      });
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Event monitor already running');
      return;
    }

    logger.info('Starting event monitor');
    this.isRunning = true;

    try {
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
      // Get current block
      const currentBlock = await monitor.provider.getBlockNumber();
      monitor.lastBlock = currentBlock - config.eventMonitoring.maxReorgDepth;

      // Setup event listeners
      for (const [_address, contract] of monitor.contracts) {
        this.setupEventListeners(chain, contract);
      }

      // Start polling for new blocks
      monitor.polling = true;
      monitor.pollInterval = setInterval(
        () => this.pollChain(chain, monitor),
        config.eventMonitoring.pollingInterval
      );

      logger.info('Chain monitoring started', { chain, startBlock: monitor.lastBlock });
    } catch (error) {
      logger.error('Failed to start chain monitoring', { chain, error });
      throw error;
    }
  }

  private setupEventListeners(chain: string, contract: ethers.Contract): void {
    // Listen for EscrowFactory events
    contract.on('SrcEscrowCreated', async (escrow, orderHash, maker, event) => {
      logger.info('SrcEscrowCreated event', {
        chain,
        escrow,
        orderHash,
        maker,
        blockNumber: event.blockNumber,
      });

      await this.handleWithRetry(() => 
        this.coordinator.handleEscrowCreated({
          orderHash,
          escrow,
          maker,
        })
      );
    });

    contract.on('SecretRevealed', async (secret, event) => {
      logger.info('SecretRevealed event', {
        chain,
        escrow: event.address,
        blockNumber: event.blockNumber,
      });

      await this.handleWithRetry(() =>
        this.coordinator.handleSecretRevealed({
          secret,
          escrow: event.address,
        })
      );
    });

    // Generic error handler
    contract.on('error', (error) => {
      logger.error('Contract event error', {
        chain,
        address: contract.address,
        error,
      });
    });
  }

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
            orderHash: parsedLog.args.orderHash,
            escrow: parsedLog.args.escrow,
            maker: parsedLog.args.maker,
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

  private async handleWithRetry(fn: () => Promise<void>): Promise<void> {
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
  }

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