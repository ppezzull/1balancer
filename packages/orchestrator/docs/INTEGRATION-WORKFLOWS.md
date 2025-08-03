# Integration Workflows Documentation

## Table of Contents
1. [Service Integration Overview](#service-integration-overview)
2. [Frontend-Orchestrator Integration](#frontend-orchestrator-integration)
3. [Orchestrator-Blockchain Integration](#orchestrator-blockchain-integration)
4. [Cross-Chain Integration](#cross-chain-integration)
5. [Proxy Service Integration](#proxy-service-integration)
6. [Development Workflow Integration](#development-workflow-integration)
7. [Testing Integration](#testing-integration)
8. [Deployment Integration](#deployment-integration)

## Service Integration Overview

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Service Integration Map                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend (Next.js)                                                      │
│      ├── REST API ──────────► Orchestrator                             │
│      ├── WebSocket ─────────► Orchestrator                             │
│      └── HTTP ──────────────► Proxy ──────► 1inch APIs                 │
│                                                                          │
│  Orchestrator (Node.js)                                                  │
│      ├── Events ────────────► BASE Chain                               │
│      ├── RPC ───────────────► NEAR Chain                               │
│      └── State ─────────────► Redis  (no!)                                  │
│                                                                          │
│  Smart Contracts                                                         │
│      ├── BASE (Hardhat) ────► Deploy Scripts                           │
│      └── NEAR (Rust) ───────► Cargo Build                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Frontend-Orchestrator Integration

### Connection Setup

```typescript
// frontend/lib/orchestratorClient.ts
import { io, Socket } from 'socket.io-client';

export class OrchestrationClient {
  private apiUrl: string;
  private wsUrl: string;
  private apiKey: string;
  private socket: Socket | null = null;

  constructor(config: {
    apiUrl: string;
    wsUrl: string;
    apiKey: string;
  }) {
    this.apiUrl = config.apiUrl;
    this.wsUrl = config.wsUrl;
    this.apiKey = config.apiKey;
  }

  // REST API Integration
  async createSwapSession(params: SwapParams): Promise<SwapSession> {
    const response = await fetch(`${this.apiUrl}/api/v1/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // WebSocket Integration
  connectWebSocket(): void {
    this.socket = io(this.wsUrl, {
      transports: ['websocket'],
      auth: {
        apiKey: this.apiKey
      }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('authenticated', (data) => {
      if (data.success) {
        console.log('WebSocket authenticated');
      }
    });
  }

  // Subscribe to session updates
  subscribeToSession(sessionId: string, callback: (update: any) => void): void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    // Subscribe
    this.socket.emit('subscribe', {
      channel: 'session',
      sessionId
    });

    // Listen for updates
    this.socket.on('session_update', (data) => {
      if (data.sessionId === sessionId) {
        callback(data);
      }
    });
  }
}
```

### React Hook Integration

```typescript
// frontend/hooks/useOrchestrator.ts
import { useEffect, useState, useCallback } from 'react';
import { OrchestrationClient } from '../lib/orchestratorClient';

export function useOrchestrator() {
  const [client, setClient] = useState<OrchestrationClient | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const orchestratorClient = new OrchestrationClient({
      apiUrl: process.env.NEXT_PUBLIC_ORCHESTRATOR_URL!,
      wsUrl: process.env.NEXT_PUBLIC_ORCHESTRATOR_WS_URL!,
      apiKey: process.env.NEXT_PUBLIC_API_KEY!
    });

    orchestratorClient.connectWebSocket();
    setClient(orchestratorClient);
    setConnected(true);

    return () => {
      orchestratorClient.disconnect();
    };
  }, []);

  const createSwap = useCallback(async (params: SwapParams) => {
    if (!client) throw new Error('Client not initialized');
    return client.createSwapSession(params);
  }, [client]);

  const subscribeToSwap = useCallback((sessionId: string, callback: (update: any) => void) => {
    if (!client) throw new Error('Client not initialized');
    return client.subscribeToSession(sessionId, callback);
  }, [client]);

  return {
    connected,
    createSwap,
    subscribeToSwap
  };
}
```

### Component Integration

```typescript
// frontend/components/SwapInterface.tsx
import { useState } from 'react';
import { useOrchestrator } from '../hooks/useOrchestrator';
import { useAccount } from 'wagmi';

export function SwapInterface() {
  const { address } = useAccount();
  const { createSwap, subscribeToSwap } = useOrchestrator();
  const [session, setSession] = useState<SwapSession | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleSwap = async () => {
    try {
      // Create swap session
      const newSession = await createSwap({
        sourceChain: 'base',
        destinationChain: 'near',
        sourceToken: USDC_ADDRESS,
        destinationToken: 'usdt.near',
        sourceAmount: parseUnits('100', 6).toString(),
        destinationAmount: parseUnits('99', 6).toString(),
        maker: address!,
        taker: 'alice.near',
        slippageTolerance: 100
      });

      setSession(newSession);

      // Subscribe to updates
      subscribeToSwap(newSession.sessionId, (update) => {
        setStatus(update.status);
        
        // Update UI based on status
        switch(update.status) {
          case 'source_locked':
            showNotification('Tokens locked on BASE');
            break;
          case 'both_locked':
            showNotification('Tokens locked on both chains');
            break;
          case 'completed':
            showNotification('Swap completed successfully!');
            break;
          case 'failed':
            showNotification('Swap failed', 'error');
            break;
        }
      });

    } catch (error) {
      console.error('Swap failed:', error);
      showNotification('Failed to create swap', 'error');
    }
  };

  return (
    <div>
      <button onClick={handleSwap}>
        Swap USDC → USDT
      </button>
      
      {session && (
        <div>
          <p>Session ID: {session.sessionId}</p>
          <p>Status: {status}</p>
          <p>Hashlock: {session.hashlockHash}</p>
        </div>
      )}
    </div>
  );
}
```

## Orchestrator-Blockchain Integration

### BASE Chain Integration

```typescript
// orchestrator/src/integrations/baseChain.ts
import { ethers } from 'ethers';
import { config } from '../config';

export class BaseChainIntegration {
  private provider: ethers.JsonRpcProvider;
  private escrowFactory: ethers.Contract;
  private resolver: ethers.Contract;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(config.chains.base.rpcUrl);
    
    // Initialize contracts
    this.escrowFactory = new ethers.Contract(
      config.contracts.escrowFactory,
      escrowFactoryAbi,
      this.provider
    );

    this.resolver = new ethers.Contract(
      config.contracts.fusionPlusResolver,
      resolverAbi,
      this.provider
    );
  }

  // Monitor events
  async startEventMonitoring() {
    // Escrow creation events
    this.escrowFactory.on('SrcEscrowCreated', async (escrow, orderHash, maker, event) => {
      console.log('Escrow created:', {
        escrow,
        orderHash,
        maker,
        blockNumber: event.blockNumber
      });

      // Process event
      await this.processEscrowCreated({
        escrow,
        orderHash,
        maker,
        txHash: event.transactionHash
      });
    });

    // Secret revelation events
    this.escrowFactory.on('SecretRevealed', async (escrow, secret, event) => {
      console.log('Secret revealed:', {
        escrow,
        secret: secret.slice(0, 10) + '...',
        blockNumber: event.blockNumber
      });

      // Process revelation
      await this.processSecretRevealed({
        escrow,
        secret
      });
    });
  }

  // Deploy escrow
  async deployEscrow(params: EscrowParams): Promise<string> {
    const wallet = new ethers.Wallet(
      process.env.ORCHESTRATOR_PRIVATE_KEY!,
      this.provider
    );

    const resolverWithSigner = this.resolver.connect(wallet);

    // Build immutables
    const immutables = {
      maker: params.maker,
      taker: params.taker,
      token: params.token,
      amount: params.amount,
      safetyDeposit: ethers.parseEther('0.01'),
      hashlockHash: params.hashlockHash,
      timelocks: this.calculateTimelocks(),
      orderHash: params.orderHash,
      chainId: config.chains.base.chainId
    };

    // Deploy through resolver
    const tx = await resolverWithSigner.deploySrc(
      immutables,
      params.limitOrder,
      params.signature,
      {
        value: immutables.safetyDeposit,
        gasLimit: 500000
      }
    );

    const receipt = await tx.wait();
    
    // Extract escrow address from logs
    const escrowAddress = this.parseEscrowAddress(receipt.logs);
    
    return escrowAddress;
  }

  private calculateTimelocks() {
    const now = Math.floor(Date.now() / 1000);
    
    return {
      srcWithdrawal: now + 300,      // 5 minutes
      srcPublicWithdrawal: now + 600, // 10 minutes
      srcCancellation: now + 900,     // 15 minutes
      srcDeployedAt: now,
      dstWithdrawal: now + 240,      // 4 minutes
      dstCancellation: now + 840,     // 14 minutes
      dstDeployedAt: now
    };
  }
}
```

### NEAR Chain Integration

```typescript
// orchestrator/src/integrations/nearChain.ts
import { connect, keyStores, utils } from 'near-api-js';
import { config } from '../config';

export class NearChainIntegration {
  private near: any;
  private account: any;
  private htlcContract: any;

  async initialize() {
    // Configure NEAR connection
    const nearConfig = {
      networkId: config.chains.near.networkId,
      keyStore: new keyStores.InMemoryKeyStore(),
      nodeUrl: config.chains.near.rpcUrl,
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org'
    };

    // Connect to NEAR
    this.near = await connect(nearConfig);
    
    // Initialize account
    this.account = await this.near.account(config.chains.near.accountId);
    
    // Initialize contract
    this.htlcContract = new this.near.Contract(
      this.account,
      'htlc.1balancer.testnet',
      {
        viewMethods: ['get_htlc', 'get_active_htlcs'],
        changeMethods: ['create_htlc', 'withdraw', 'refund']
      }
    );
  }

  // Create HTLC on NEAR
  async createHTLC(params: {
    receiver: string;
    hashlock: string;
    timelock: number;
    tokenId: string;
    amount: string;
  }): Promise<string> {
    const result = await this.account.functionCall({
      contractId: 'htlc.1balancer.testnet',
      methodName: 'create_htlc',
      args: {
        receiver_id: params.receiver,
        hashlock: params.hashlock,
        timelock: params.timelock.toString(),
        token_id: params.tokenId,
        amount: params.amount
      },
      gas: '100000000000000', // 100 TGas
      attachedDeposit: utils.format.parseNearAmount('0.1') // Storage deposit
    });

    // Parse HTLC ID from result
    const htlcId = this.parseHTLCId(result);
    return htlcId;
  }

  // Monitor NEAR state
  async monitorHTLCState(htlcId: string): Promise<HTLCState> {
    const state = await this.htlcContract.get_htlc({ htlc_id: htlcId });
    
    return {
      id: htlcId,
      sender: state.sender,
      receiver: state.receiver,
      amount: state.amount,
      hashlock: state.hashlock,
      timelock: parseInt(state.timelock),
      withdrawn: state.withdrawn,
      refunded: state.refunded,
      preimage: state.preimage
    };
  }

  // Poll for state changes
  async startPolling(callback: (changes: StateChange[]) => void) {
    setInterval(async () => {
      try {
        const activeHTLCs = await this.htlcContract.get_active_htlcs({
          from_index: 0,
          limit: 100
        });

        // Detect changes
        const changes = this.detectChanges(activeHTLCs);
        
        if (changes.length > 0) {
          callback(changes);
        }
      } catch (error) {
        console.error('NEAR polling error:', error);
      }
    }, 10000); // Poll every 10 seconds
  }
}
```

## Cross-Chain Integration

### Atomic Swap Coordination

```typescript
// orchestrator/src/integrations/crossChainCoordinator.ts
export class CrossChainCoordinator {
  private baseChain: BaseChainIntegration;
  private nearChain: NearChainIntegration;
  private sessionManager: SessionManager;

  async executeAtomicSwap(session: SwapSession): Promise<void> {
    try {
      // Phase 1: Lock on BASE
      console.log('Phase 1: Locking on BASE chain');
      const escrowAddress = await this.baseChain.deployEscrow({
        maker: session.maker,
        taker: session.taker,
        token: session.sourceToken,
        amount: session.sourceAmount,
        hashlockHash: session.hashlockHash,
        orderHash: session.orderHash,
        limitOrder: session.limitOrder,
        signature: session.signature
      });

      await this.sessionManager.updateSession(session.sessionId, {
        srcEscrowAddress: escrowAddress,
        status: 'source_locked'
      });

      // Phase 2: Lock on NEAR
      console.log('Phase 2: Creating HTLC on NEAR');
      const htlcId = await this.nearChain.createHTLC({
        receiver: session.taker,
        hashlock: session.hashlockHash,
        timelock: this.calculateNearTimelock(),
        tokenId: session.destinationToken,
        amount: session.destinationAmount
      });

      await this.sessionManager.updateSession(session.sessionId, {
        dstHTLCId: htlcId,
        status: 'both_locked'
      });

      // Phase 3: Monitor for completion
      console.log('Phase 3: Monitoring for secret revelation');
      this.monitorCompletion(session);

    } catch (error) {
      console.error('Atomic swap failed:', error);
      await this.handleFailure(session, error);
    }
  }

  private async monitorCompletion(session: SwapSession) {
    // Monitor BASE for secret revelation
    const secretWatcher = setInterval(async () => {
      const escrowState = await this.baseChain.getEscrowState(
        session.srcEscrowAddress!
      );

      if (escrowState.withdrawn && escrowState.preimage) {
        clearInterval(secretWatcher);
        
        // Secret revealed on BASE, withdraw on NEAR
        await this.completeNearWithdrawal(
          session.dstHTLCId!,
          escrowState.preimage
        );

        await this.sessionManager.updateSession(session.sessionId, {
          status: 'completed',
          completedAt: Date.now()
        });
      }
    }, 5000); // Check every 5 seconds

    // Set timeout handler
    setTimeout(async () => {
      clearInterval(secretWatcher);
      
      const finalState = await this.sessionManager.getSession(session.sessionId);
      if (finalState?.status !== 'completed') {
        await this.handleTimeout(session);
      }
    }, 900000); // 15 minute timeout
  }
}
```

### State Synchronization

```typescript
// orchestrator/src/integrations/stateSynchronizer.ts
export class StateSynchronizer {
  private baseState: Map<string, ChainState> = new Map();
  private nearState: Map<string, ChainState> = new Map();

  // Sync state between chains
  async syncStates(sessionId: string): Promise<SyncResult> {
    const baseData = await this.fetchBaseState(sessionId);
    const nearData = await this.fetchNearState(sessionId);

    // Compare states
    const discrepancies = this.findDiscrepancies(baseData, nearData);

    if (discrepancies.length > 0) {
      // Handle discrepancies
      for (const issue of discrepancies) {
        await this.resolveDiscrepancy(issue);
      }
    }

    return {
      synchronized: discrepancies.length === 0,
      baseState: baseData,
      nearState: nearData,
      issues: discrepancies
    };
  }

  private findDiscrepancies(base: ChainState, near: ChainState): Discrepancy[] {
    const issues: Discrepancy[] = [];

    // Check lock status
    if (base.locked && !near.locked) {
      issues.push({
        type: 'LOCK_MISMATCH',
        description: 'BASE locked but NEAR not locked',
        severity: 'HIGH'
      });
    }

    // Check amounts
    if (base.amount !== this.convertAmount(near.amount, near.decimals)) {
      issues.push({
        type: 'AMOUNT_MISMATCH',
        description: 'Amount discrepancy between chains',
        severity: 'CRITICAL'
      });
    }

    // Check timeouts
    if (near.timeout >= base.timeout) {
      issues.push({
        type: 'TIMEOUT_VIOLATION',
        description: 'NEAR timeout must be less than BASE timeout',
        severity: 'CRITICAL'
      });
    }

    return issues;
  }
}
```

## Proxy Service Integration

### 1inch API Integration

```typescript
// proxy/src/integrations/oneInchProxy.ts
import axios from 'axios';
import { cache } from '../utils/cache';

export class OneInchProxy {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ONEINCH_API_KEY!;
    this.baseUrl = process.env.ONEINCH_API_URL || 'https://api.1inch.dev';
  }

  // Proxy quote requests
  async getQuote(params: QuoteParams): Promise<Quote> {
    // Check cache first
    const cacheKey = this.buildCacheKey(params);
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Make API request
    const response = await axios.get(`${this.baseUrl}/swap/v5.2/1/quote`, {
      params: {
        src: params.fromToken,
        dst: params.toToken,
        amount: params.amount,
        includeTokensInfo: true,
        includeProtocols: true
      },
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      }
    });

    const quote = response.data;

    // Cache for 30 seconds
    await cache.set(cacheKey, JSON.stringify(quote), 30);

    return quote;
  }

  // Proxy swap requests
  async getSwapData(params: SwapParams): Promise<SwapData> {
    const response = await axios.get(`${this.baseUrl}/swap/v5.2/1/swap`, {
      params: {
        src: params.fromToken,
        dst: params.toToken,
        amount: params.amount,
        from: params.userAddress,
        slippage: params.slippage,
        disableEstimate: true
      },
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      }
    });

    return response.data;
  }

  private buildCacheKey(params: any): string {
    return `quote:${params.fromToken}:${params.toToken}:${params.amount}`;
  }
}
```

### Frontend Proxy Usage

```typescript
// frontend/lib/oneInchClient.ts
export class OneInchClient {
  private proxyUrl: string;

  constructor() {
    this.proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:3001';
  }

  async getQuote(params: {
    fromToken: string;
    toToken: string;
    amount: string;
  }): Promise<Quote> {
    const response = await fetch(`${this.proxyUrl}/api/1inch/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Failed to get quote');
    }

    return response.json();
  }

  async getTokenList(chainId: number): Promise<Token[]> {
    const response = await fetch(
      `${this.proxyUrl}/api/1inch/tokens/${chainId}`
    );

    if (!response.ok) {
      throw new Error('Failed to get token list');
    }

    const data = await response.json();
    return Object.values(data.tokens);
  }
}
```

## Development Workflow Integration

### Local Development Setup

```bash
#!/bin/bash
# dev-setup.sh

# Start all services for local development
echo "Starting 1Balancer development environment..."

# 1. Start Hardhat node
echo "Starting Hardhat node..."
cd packages/hardhat
yarn chain &
HARDHAT_PID=$!

# Wait for Hardhat to start
sleep 5

# 2. Deploy contracts
echo "Deploying contracts..."
yarn deploy --network localhost

# 3. Start proxy service
echo "Starting proxy service..."
cd ../proxy
yarn dev &
PROXY_PID=$!

# 4. Start orchestrator
echo "Starting orchestrator..."
cd ../orchestrator
yarn dev &
ORCHESTRATOR_PID=$!

# 5. Start frontend
echo "Starting frontend..."
cd ../nextjs
yarn dev &
FRONTEND_PID=$!

echo "All services started!"
echo "Frontend: http://localhost:3000"
echo "Orchestrator: http://localhost:8080"
echo "Proxy: http://localhost:3001"
echo "Hardhat: http://localhost:8545"

# Wait for user to stop
echo "Press Ctrl+C to stop all services"
wait
```

### Git Workflow Integration

```yaml
# .github/workflows/integration-test.yml
name: Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-integration:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      
      - name: Install dependencies
        run: |
          yarn install --frozen-lockfile
          
      - name: Start Hardhat node
        run: |
          cd packages/hardhat
          yarn chain &
          sleep 5
          
      - name: Deploy contracts
        run: |
          cd packages/hardhat
          yarn deploy --network localhost
          
      - name: Run integration tests
        run: |
          cd packages/orchestrator
          yarn test:integration
        env:
          BASE_RPC_URL: http://localhost:8545
          NEAR_RPC_URL: ${{ secrets.NEAR_TESTNET_RPC }}
          REDIS_URL: redis://localhost:6379
```

## Testing Integration

### End-to-End Test Setup

```typescript
// e2e/tests/fullSwapFlow.test.ts
import { test, expect } from '@playwright/test';
import { setupTestEnvironment, teardownTestEnvironment } from '../utils/testHelpers';

test.describe('Full Swap Flow', () => {
  test.beforeAll(async () => {
    await setupTestEnvironment();
  });

  test.afterAll(async () => {
    await teardownTestEnvironment();
  });

  test('should complete cross-chain swap', async ({ page }) => {
    // 1. Navigate to app
    await page.goto('http://localhost:3000');
    
    // 2. Connect wallet
    await page.click('button:has-text("Connect Wallet")');
    await page.click('button:has-text("MetaMask")');
    
    // 3. Setup swap
    await page.fill('input[name="amount"]', '100');
    await page.selectOption('select[name="fromToken"]', 'USDC');
    await page.selectOption('select[name="toToken"]', 'USDT');
    
    // 4. Get quote
    await page.click('button:has-text("Get Quote")');
    await expect(page.locator('.quote-display')).toBeVisible();
    
    // 5. Execute swap
    await page.click('button:has-text("Swap")');
    
    // 6. Monitor progress
    await expect(page.locator('.status:has-text("source_locked")')).toBeVisible({
      timeout: 30000
    });
    
    await expect(page.locator('.status:has-text("both_locked")')).toBeVisible({
      timeout: 60000
    });
    
    await expect(page.locator('.status:has-text("completed")')).toBeVisible({
      timeout: 120000
    });
    
    // 7. Verify completion
    const successMessage = page.locator('.success-message');
    await expect(successMessage).toContainText('Swap completed successfully');
  });
});
```

### Integration Test Utilities

```typescript
// tests/utils/integrationHelpers.ts
export class IntegrationTestHelper {
  private orchestratorUrl: string;
  private contracts: DeployedContracts;

  constructor() {
    this.orchestratorUrl = 'http://localhost:8080';
    this.contracts = loadDeployedContracts();
  }

  // Setup test swap
  async setupTestSwap(): Promise<TestSwapContext> {
    // Deploy test tokens
    const testTokens = await this.deployTestTokens();
    
    // Mint tokens
    await this.mintTokens(testTokens.usdc, TEST_USER, parseUnits('1000', 6));
    
    // Approve contracts
    await this.approveContracts(testTokens.usdc, this.contracts.escrowFactory);
    
    // Create session
    const session = await this.createTestSession({
      sourceToken: testTokens.usdc.address,
      destinationToken: 'test.near',
      amount: parseUnits('100', 6)
    });
    
    return {
      tokens: testTokens,
      session,
      contracts: this.contracts
    };
  }

  // Mock blockchain responses
  setupMockResponses() {
    // Mock contract calls
    MockContract.setup(this.contracts.escrowFactory, {
      'createSrcEscrow': async () => '0x1234567890abcdef'
    });
    
    // Mock events
    MockEventEmitter.setup(this.contracts.escrowFactory, {
      'SrcEscrowCreated': {
        escrow: '0x1234567890abcdef',
        orderHash: '0xabcdef1234567890',
        maker: TEST_USER
      }
    });
  }
}
```

## Deployment Integration

### Docker Compose Integration

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./packages/nextjs
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_ORCHESTRATOR_URL=http://orchestrator:8080
      - NEXT_PUBLIC_PROXY_URL=http://proxy:3001
    depends_on:
      - orchestrator
      - proxy
    networks:
      - 1balancer-network

  # Orchestrator
  orchestrator:
    build:
      context: ./packages/orchestrator
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - BASE_RPC_URL=${BASE_RPC_URL}
      - NEAR_RPC_URL=${NEAR_RPC_URL}
    depends_on:
      - redis
    networks:
      - 1balancer-network

  # Proxy
  proxy:
    build:
      context: ./packages/proxy
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - ONEINCH_API_KEY=${ONEINCH_API_KEY}
    networks:
      - 1balancer-network

  # Redis
  redis:
    image: redis:alpine
    volumes:
      - redis-data:/data
    networks:
      - 1balancer-network

  # Nginx (Production)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - frontend
      - orchestrator
      - proxy
    networks:
      - 1balancer-network

networks:
  1balancer-network:
    driver: bridge

volumes:
  redis-data:
```

### Kubernetes Integration

```yaml
# k8s/1balancer-deployment.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: 1balancer
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orchestrator
  namespace: 1balancer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orchestrator
  template:
    metadata:
      labels:
        app: orchestrator
    spec:
      containers:
      - name: orchestrator
        image: 1balancer/orchestrator:latest
        ports:
        - containerPort: 8080
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: orchestrator-secrets
              key: redis-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: orchestrator-service
  namespace: 1balancer
spec:
  selector:
    app: orchestrator
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: 1balancer-ingress
  namespace: 1balancer
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.1balancer.com
    secretName: 1balancer-tls
  rules:
  - host: api.1balancer.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: orchestrator-service
            port:
              number: 8080
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push Docker images
        run: |
          docker build -t 1balancer/orchestrator:${{ github.ref_name }} ./packages/orchestrator
          docker build -t 1balancer/frontend:${{ github.ref_name }} ./packages/nextjs
          docker build -t 1balancer/proxy:${{ github.ref_name }} ./packages/proxy
          
          docker push 1balancer/orchestrator:${{ github.ref_name }}
          docker push 1balancer/frontend:${{ github.ref_name }}
          docker push 1balancer/proxy:${{ github.ref_name }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/orchestrator \
            orchestrator=1balancer/orchestrator:${{ github.ref_name }} \
            -n 1balancer
            
          kubectl set image deployment/frontend \
            frontend=1balancer/frontend:${{ github.ref_name }} \
            -n 1balancer
            
          kubectl set image deployment/proxy \
            proxy=1balancer/proxy:${{ github.ref_name }} \
            -n 1balancer
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/orchestrator -n 1balancer
          kubectl rollout status deployment/frontend -n 1balancer
          kubectl rollout status deployment/proxy -n 1balancer
      
      - name: Run smoke tests
        run: |
          curl -f https://api.1balancer.com/health
          curl -f https://1balancer.com
```