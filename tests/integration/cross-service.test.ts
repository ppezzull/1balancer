import { ethers } from 'hardhat';
import axios from 'axios';
import io from 'socket.io-client';
import testConfig from '../../packages/hardhat/test/test-config.json';

describe('Cross-Service Integration', () => {
  let provider: ethers.Provider;
  let signer: ethers.Signer;
  let atomicSwap: any;
  let orchestratorClient: any;
  let socket: any;

  before(async () => {
    // Setup Hardhat fork
    provider = new ethers.JsonRpcProvider('http://localhost:8545');
    signer = new ethers.Wallet(testConfig.testAccounts.ethereum[0].privateKey, provider);
    
    // Deploy contracts
    const AtomicSwapERC20 = await ethers.getContractFactory('AtomicSwapERC20');
    atomicSwap = await AtomicSwapERC20.connect(signer).deploy();
    await atomicSwap.waitForDeployment();
    
    // Initialize contract
    await atomicSwap.initialize(testConfig.testAccounts.ethereum[1].address);
    
    // Setup orchestrator client
    orchestratorClient = axios.create({
      baseURL: 'http://localhost:3001',
      headers: { 'x-api-key': process.env.API_KEY || 'test-api-key' }
    });
    
    // Setup WebSocket
    socket = io('http://localhost:3002');
    await new Promise(resolve => socket.on('connect', resolve));
  });

  after(() => {
    if (socket) socket.disconnect();
  });

  it('Complete cross-chain swap flow', async () => {
    // 1. Create session via orchestrator
    const sessionResponse = await orchestratorClient.post('/api/sessions', {
      sourceChain: testConfig.chains.base.chainId.toString(),
      destinationChain: 'near',
      sourceToken: testConfig.chains.base.tokens.USDC,
      destinationToken: testConfig.chains.near.tokens.USDC,
      sourceAmount: '1000000', // 1 USDC
      slippageTolerance: testConfig.testConstants.defaultSlippage,
      userAddress: signer.address,
      nearAccountId: testConfig.testAccounts.near[0].accountId
    });

    const { sessionId, secretHash } = sessionResponse.data.session;
    console.log(`Created session ${sessionId} with hash ${secretHash}`);

    // 2. Subscribe to updates
    socket.emit('subscribe', sessionId);
    
    const updatePromise = new Promise((resolve) => {
      socket.on('session:updated', (data) => {
        if (data.sessionId === sessionId && data.status === 'source_locked') {
          resolve(data);
        }
      });
    });

    // 3. Create on-chain lock
    const usdc = await ethers.getContractAt('IERC20', testConfig.chains.base.tokens.USDC);
    
    // For testing, mint mock USDC if using local deployment
    try {
      const MockERC20 = await ethers.getContractFactory('MockERC20');
      const mockUsdc = await MockERC20.deploy('Mock USDC', 'USDC', 6);
      await mockUsdc.waitForDeployment();
      await mockUsdc.mint(signer.address, '1000000');
      
      // Use mock for testing
      await mockUsdc.connect(signer).approve(await atomicSwap.getAddress(), '1000000');
      
      const timeout = Math.floor(Date.now() / 1000) + testConfig.testConstants.defaultTimeout;
      const tx = await atomicSwap.connect(signer).createSwap(
        secretHash,
        '0x' + '00'.repeat(20), // Counterparty placeholder
        await mockUsdc.getAddress(),
        '1000000',
        timeout
      );
      
      const receipt = await tx.wait();
      const swapCreatedEvent = receipt.logs.find(
        log => log.topics[0] === atomicSwap.interface.getEvent('SwapCreated').topicHash
      );
      const decodedEvent = atomicSwap.interface.decodeEventLog(
        'SwapCreated',
        swapCreatedEvent.data,
        swapCreatedEvent.topics
      );
      const swapId = decodedEvent.secretHash;

      // 4. Update orchestrator with lock info
      await orchestratorClient.patch(`/api/sessions/${sessionId}/locks`, {
        chain: 'source',
        lockId: swapId,
        txHash: receipt.hash,
        timeout: timeout
      });

      // 5. Wait for update
      await updatePromise;

      // 6. Verify session state
      const statusResponse = await orchestratorClient.get(`/api/sessions/${sessionId}`);
      expect(statusResponse.data).toMatchObject({
        status: 'source_locked',
        locks: {
          source: {
            lockId: swapId,
            txHash: receipt.hash
          }
        }
      });
      
      console.log('Cross-chain swap session successfully initialized and locked on source chain');
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  it('Handle timeout and refund scenario', async () => {
    // Create session with short timeout
    const sessionResponse = await orchestratorClient.post('/api/sessions', {
      sourceChain: testConfig.chains.base.chainId.toString(),
      destinationChain: 'near',
      sourceToken: testConfig.chains.base.tokens.USDC,
      destinationToken: testConfig.chains.near.tokens.USDC,
      sourceAmount: '500000', // 0.5 USDC
      slippageTolerance: testConfig.testConstants.defaultSlippage,
      userAddress: signer.address,
      nearAccountId: testConfig.testAccounts.near[0].accountId
    });

    const { sessionId, secretHash } = sessionResponse.data.session;

    // Create lock with minimal timeout
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const mockUsdc = await MockERC20.deploy('Mock USDC', 'USDC', 6);
    await mockUsdc.waitForDeployment();
    await mockUsdc.mint(signer.address, '500000');
    await mockUsdc.connect(signer).approve(await atomicSwap.getAddress(), '500000');
    
    const shortTimeout = Math.floor(Date.now() / 1000) + testConfig.testConstants.minTimeout;
    const tx = await atomicSwap.connect(signer).createSwap(
      secretHash,
      '0x' + '00'.repeat(20),
      await mockUsdc.getAddress(),
      '500000',
      shortTimeout
    );
    
    const receipt = await tx.wait();

    // Update orchestrator
    await orchestratorClient.patch(`/api/sessions/${sessionId}/locks`, {
      chain: 'source',
      lockId: secretHash,
      txHash: receipt.hash,
      timeout: shortTimeout
    });

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, (testConfig.testConstants.minTimeout + 1) * 1000));

    // Trigger timeout check
    await orchestratorClient.post(`/api/sessions/${sessionId}/check-timeout`);

    // Verify refund status
    const statusResponse = await orchestratorClient.get(`/api/sessions/${sessionId}`);
    expect(statusResponse.data.status).toBe('refunded');
  });

  it('Test event monitoring integration', async () => {
    // Deploy and setup contracts
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    const mockToken = await MockERC20.deploy('Mock Token', 'MTK', 18);
    await mockToken.waitForDeployment();

    // Create session
    const sessionResponse = await orchestratorClient.post('/api/sessions', {
      sourceChain: testConfig.chains.base.chainId.toString(),
      destinationChain: 'near',
      sourceToken: await mockToken.getAddress(),
      destinationToken: testConfig.chains.near.tokens.wNEAR,
      sourceAmount: ethers.parseEther('1').toString(),
      slippageTolerance: testConfig.testConstants.defaultSlippage,
      userAddress: signer.address,
      nearAccountId: testConfig.testAccounts.near[0].accountId
    });

    const { sessionId, secretHash } = sessionResponse.data.session;

    // Setup event listener
    const eventPromise = new Promise((resolve) => {
      socket.on('blockchain:event', (data) => {
        if (data.event === 'SwapCreated' && data.sessionId === sessionId) {
          resolve(data);
        }
      });
    });

    // Subscribe to blockchain events
    socket.emit('subscribe:events', {
      sessionId,
      chain: testConfig.chains.base.chainId.toString()
    });

    // Create swap to trigger event
    await mockToken.mint(signer.address, ethers.parseEther('1'));
    await mockToken.connect(signer).approve(await atomicSwap.getAddress(), ethers.parseEther('1'));
    
    const timeout = Math.floor(Date.now() / 1000) + testConfig.testConstants.defaultTimeout;
    await atomicSwap.connect(signer).createSwap(
      secretHash,
      testConfig.testAccounts.ethereum[1].address,
      await mockToken.getAddress(),
      ethers.parseEther('1'),
      timeout
    );

    // Wait for event to be captured
    const eventData = await Promise.race([
      eventPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Event timeout')), 10000))
    ]);

    expect(eventData).toBeDefined();
    expect(eventData.event).toBe('SwapCreated');
  });

  it('Test quote generation with real token prices', async () => {
    // Get quote from orchestrator
    const quoteResponse = await orchestratorClient.post('/api/quotes', {
      sourceChain: testConfig.chains.base.chainId.toString(),
      destinationChain: 'near',
      sourceToken: testConfig.chains.base.tokens.USDC,
      destinationToken: testConfig.chains.near.tokens.USDC,
      sourceAmount: '1000000000', // 1000 USDC
      urgency: 'normal'
    });

    expect(quoteResponse.data).toMatchObject({
      sourceAmount: '1000000000',
      destinationAmount: expect.any(String),
      rate: expect.any(String),
      dutchAuction: {
        startPrice: expect.any(String),
        endPrice: expect.any(String),
        duration: expect.any(Number)
      },
      fees: {
        protocolFee: expect.any(String),
        networkFee: expect.any(String),
        total: expect.any(String)
      },
      validUntil: expect.any(Number)
    });

    // Verify amounts are reasonable
    const destAmount = BigInt(quoteResponse.data.destinationAmount);
    const sourceAmount = BigInt(quoteResponse.data.sourceAmount);
    const ratio = Number(destAmount * 10000n / sourceAmount) / 10000;
    
    expect(ratio).toBeGreaterThan(0.9); // At least 90% (accounting for fees)
    expect(ratio).toBeLessThan(1.1); // At most 110% (reasonable range)
  });

  it('Test full swap execution simulation', async () => {
    // This test simulates the full flow without actual NEAR execution
    const fullFlowSession = await orchestratorClient.post('/api/sessions', {
      sourceChain: testConfig.chains.base.chainId.toString(),
      destinationChain: 'near',
      sourceToken: testConfig.chains.base.tokens.WETH,
      destinationToken: testConfig.chains.near.tokens.wNEAR,
      sourceAmount: ethers.parseEther('0.1').toString(),
      slippageTolerance: testConfig.testConstants.defaultSlippage,
      userAddress: signer.address,
      nearAccountId: testConfig.testAccounts.near[0].accountId
    });

    const { sessionId, secretHash } = fullFlowSession.data.session;

    // Mock source chain lock
    const lockData = {
      chain: 'source',
      lockId: '0x' + '1234'.repeat(16),
      txHash: '0x' + 'abcd'.repeat(16),
      timeout: Math.floor(Date.now() / 1000) + 3600
    };
    
    await orchestratorClient.patch(`/api/sessions/${sessionId}/locks`, lockData);

    // Simulate NEAR lock
    const nearLockData = {
      chain: 'destination',
      lockId: `lock_${Date.now()}.testnet`,
      txHash: `near_tx_${Date.now()}`,
      timeout: Math.floor(Date.now() / 1000) + 3600
    };
    
    await orchestratorClient.patch(`/api/sessions/${sessionId}/locks`, nearLockData);

    // Verify both locks are recorded
    const lockedSession = await orchestratorClient.get(`/api/sessions/${sessionId}`);
    expect(lockedSession.data.status).toBe('destination_locked');
    expect(lockedSession.data.locks.source).toBeDefined();
    expect(lockedSession.data.locks.destination).toBeDefined();

    // Simulate completion
    await orchestratorClient.patch(`/api/sessions/${sessionId}/complete`, {
      secret: '0x' + 'secret'.repeat(10).substring(0, 64),
      sourceTxHash: '0x' + 'complete'.repeat(8),
      destinationTxHash: 'near_complete_tx'
    });

    // Verify completion
    const completedSession = await orchestratorClient.get(`/api/sessions/${sessionId}`);
    expect(completedSession.data.status).toBe('completed');
    expect(completedSession.data.completedAt).toBeDefined();
  });
});