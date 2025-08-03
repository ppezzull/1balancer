import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

interface Config {
  env: string;
  port: number;
  wsPort: number;
  logLevel: string;
  
  chains: {
    base: {
      rpcUrl: string;
      chainId: number;
      confirmationBlocks: number;
    };
    near: {
      rpcUrl: string;
      networkId: string;
      accountId: string;
      privateKey?: string;
      contracts?: {
        htlc: string;
        solverRegistry: string;
      };
    };
    ethereum: {
      rpcUrl: string;
      chainId: number;
    };
  };
  
  contracts: {
    escrowFactory: string;
    fusionPlusHub: string;
    fusionPlusResolver: string;
    limitOrderProtocol: string;
  };
  
  security: {
    apiKeySecret: string;
    jwtSecret: string;
    corsOrigin: string[];
    helmet: Record<string, any>;
  };
  
  cors: {
    origin: string | string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  
  externalServices: {
    oneInch: {
      apiKey: string;
      apiUrl: string;
    };
    // Redis configuration removed - using in-memory storage
    // Uncomment below if Redis is needed in the future
    // redis?: {
    //   url: string;
    // };
  };
  
  monitoring: {
    metricsEnabled: boolean;
    metricsPort: number;
    sentryDsn?: string;
  };
  
  session: {
    timeoutSeconds: number;
    maxActiveSessions: number;
    cleanupInterval: number;
  };
  
  dutchAuction: {
    durationSeconds: number;
    startPremium: number;
    endDiscount: number;
  };
  
  eventMonitoring: {
    pollingInterval: number;
    maxReorgDepth: number;
  };
}

// Helper function to read NEAR contract address from deployment file
function getNearContractAddress(): string {
  // First check environment variable
  if (process.env.NEAR_HTLC_CONTRACT) {
    return process.env.NEAR_HTLC_CONTRACT;
  }
  
  // Then check deployment file
  try {
    const deployPath = path.join(__dirname, '../../../../1balancer-near/.near-credentials/testnet/deploy.json');
    if (fs.existsSync(deployPath)) {
      const deployData = JSON.parse(fs.readFileSync(deployPath, 'utf8'));
      if (deployData.contractId) {
        return deployData.contractId;
      }
    }
  } catch (error) {
    // Ignore errors, fall back to default
  }
  
  // Default fallback - using the account's subaccount
  const account = process.env.NEAR_ORCHESTRATOR_ACCOUNT_ID || 'rog_eth.testnet';
  return `fusion-htlc.${account}`;
}

function getConfig(): Config {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  
  return {
    env,
    port: parseInt(process.env.PORT || '8080', 10),
    wsPort: parseInt(process.env.WS_PORT || '8081', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    
    chains: {
      base: {
        rpcUrl: process.env.BASE_RPC_URL || 'https://sepolia.base.org',
        chainId: 84532, // BASE Sepolia
        confirmationBlocks: parseInt(process.env.EVENT_CONFIRMATION_BLOCKS || '3', 10),
      },
      near: {
        rpcUrl: process.env.NEAR_RPC_URL || 'https://rpc.testnet.near.org',
        networkId: process.env.NEAR_NETWORK_ID || 'testnet',
        accountId: process.env.NEAR_ORCHESTRATOR_ACCOUNT_ID || process.env.NEAR_MASTER_ACCOUNT || '',
        privateKey: process.env.NEAR_PRIVATE_KEY || '',
        contracts: {
          htlc: getNearContractAddress(),
          solverRegistry: process.env.NEAR_SOLVER_REGISTRY || 'solver-registry.testnet',
        },
      },
      ethereum: {
        rpcUrl: process.env.ETHEREUM_RPC_URL || '',
        chainId: 11155111, // Sepolia
      },
    },
    
    contracts: {
      escrowFactory: process.env.ESCROW_FACTORY_ADDRESS || ethers.ZeroAddress,
      fusionPlusHub: process.env.FUSION_PLUS_HUB_ADDRESS || ethers.ZeroAddress,
      fusionPlusResolver: process.env.FUSION_PLUS_RESOLVER_ADDRESS || ethers.ZeroAddress,
      limitOrderProtocol: process.env.LIMIT_ORDER_PROTOCOL_ADDRESS || '0x111111125421ca6dc452d289314280a0f8842a65',
    },
    
    security: {
      apiKeySecret: process.env.API_KEY_SECRET || 'demo-secret-key',
      jwtSecret: process.env.JWT_SECRET || 'demo-jwt-secret',
      corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      helmet: {
        contentSecurityPolicy: isDevelopment ? false : undefined,
        crossOriginEmbedderPolicy: false,
      },
    },
    
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    },
    
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
    
    externalServices: {
      oneInch: {
        apiKey: process.env.ONEINCH_API_KEY || '',
        apiUrl: process.env.ONEINCH_API_URL || 'https://api.1inch.dev',
      },
      // Redis configuration removed - using in-memory storage
      // Uncomment below if Redis is needed in the future
      // redis: process.env.REDIS_URL ? {
      //   url: process.env.REDIS_URL,
      // } : undefined,
    },
    
    monitoring: {
      metricsEnabled: process.env.METRICS_ENABLED === 'true',
      metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
      sentryDsn: process.env.SENTRY_DSN,
    },
    
    session: {
      timeoutSeconds: parseInt(process.env.SESSION_TIMEOUT_SECONDS || '7200', 10), // 2 hours
      maxActiveSessions: parseInt(process.env.MAX_ACTIVE_SESSIONS || '1000', 10),
      cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '300000', 10), // 5 minutes
    },
    
    dutchAuction: {
      durationSeconds: parseInt(process.env.DUTCH_AUCTION_DURATION_SECONDS || '300', 10), // 5 minutes
      startPremium: parseFloat(process.env.DUTCH_AUCTION_START_PREMIUM || '0.005'), // 0.5%
      endDiscount: parseFloat(process.env.DUTCH_AUCTION_END_DISCOUNT || '0.005'), // 0.5%
    },
    
    eventMonitoring: {
      pollingInterval: parseInt(process.env.BLOCK_POLLING_INTERVAL || '5000', 10), // 5 seconds
      maxReorgDepth: parseInt(process.env.MAX_REORG_DEPTH || '10', 10),
    },
  };
}

export const config = getConfig();

// Validate critical configuration
export function validateConfig(): void {
  const errors: string[] = [];
  
  if (!config.security.apiKeySecret || config.security.apiKeySecret === 'demo-secret-key') {
    errors.push('API_KEY_SECRET must be set to a secure value');
  }
  
  if (!config.security.jwtSecret || config.security.jwtSecret === 'demo-jwt-secret') {
    errors.push('JWT_SECRET must be set to a secure value');
  }
  
  if (config.contracts.escrowFactory === ethers.ZeroAddress) {
    errors.push('ESCROW_FACTORY_ADDRESS must be set');
  }
  
  if (config.contracts.fusionPlusHub === ethers.ZeroAddress) {
    errors.push('FUSION_PLUS_HUB_ADDRESS must be set');
  }
  
  if (!config.chains.near.accountId) {
    errors.push('NEAR_ORCHESTRATOR_ACCOUNT_ID must be set');
  }
  
  if (!config.externalServices.oneInch.apiKey) {
    errors.push('ONEINCH_API_KEY must be set');
  }
  
  if (errors.length > 0 && config.env === 'production') {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  } else if (errors.length > 0) {
    console.warn('Configuration warnings:', errors);
  }
}