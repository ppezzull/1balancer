#!/usr/bin/env node

/**
 * Fork Testing for 1Balancer Orchestrator Service
 * 
 * Tests the orchestrator against a forked mainnet to ensure
 * real-world compatibility without spending real funds.
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const path = require('path');

const CONFIG = {
  FORK_URL: process.env.ALCHEMY_API_KEY ? 
    `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : null,
  ORCHESTRATOR_ROOT: path.resolve(__dirname, '../..'),
  HARDHAT_ROOT: path.resolve(__dirname, '../../../hardhat'),
  FORK_BLOCK: 15000000, // Recent BASE mainnet block
};

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  header: (msg) => console.log(`\n${'='.repeat(60)}\n${msg}\n${'='.repeat(60)}`),
};

async function checkDependencies() {
  log.header('CHECKING DEPENDENCIES');
  
  if (!process.env.ALCHEMY_API_KEY) {
    log.error('ALCHEMY_API_KEY not set in environment');
    log.info('Fork testing requires an Alchemy API key for mainnet forking');
    log.info('Please set ALCHEMY_API_KEY in your .env file');
    return false;
  }
  
  // Check if hardhat is available
  try {
    await execAsync('npx hardhat --version', { cwd: CONFIG.HARDHAT_ROOT });
    log.success('Hardhat is available');
  } catch (error) {
    log.error('Hardhat not found. Please install dependencies.');
    return false;
  }
  
  return true;
}

async function startFork() {
  log.header('STARTING MAINNET FORK');
  log.info(`Forking BASE mainnet at block ${CONFIG.FORK_BLOCK}...`);
  
  const forkProcess = spawn('npx', [
    'hardhat', 'node',
    '--fork', CONFIG.FORK_URL,
    '--fork-block-number', CONFIG.FORK_BLOCK
  ], {
    cwd: CONFIG.HARDHAT_ROOT,
    stdio: 'pipe'
  });
  
  return new Promise((resolve, reject) => {
    let forkReady = false;
    
    forkProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Started HTTP and WebSocket JSON-RPC server')) {
        forkReady = true;
        log.success('Fork ready on http://localhost:8545');
        resolve(forkProcess);
      }
    });
    
    forkProcess.stderr.on('data', (data) => {
      log.error(`Fork error: ${data}`);
    });
    
    forkProcess.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!forkReady) {
        forkProcess.kill();
        reject(new Error('Fork startup timeout'));
      }
    }, 30000);
  });
}

async function runForkTests(forkProcess) {
  log.header('RUNNING FORK TESTS');
  
  try {
    // Test 1: Deploy contracts on fork
    log.info('Testing contract deployment on fork...');
    const deployResult = await execAsync(
      'npx hardhat run scripts/deploy-fork.ts --network localhost',
      { cwd: CONFIG.HARDHAT_ROOT }
    );
    log.success('Contracts deployed successfully on fork');
    
    // Test 2: Start orchestrator with fork configuration
    log.info('Starting orchestrator with fork configuration...');
    
    // Create fork-specific env
    const forkEnv = {
      ...process.env,
      PROVIDER_URLS_BASE: 'http://localhost:8545',
      NETWORK_TYPE: 'fork',
      FORK_MODE: 'true'
    };
    
    const orchestratorProcess = spawn('npm', ['start'], {
      cwd: CONFIG.ORCHESTRATOR_ROOT,
      env: forkEnv,
      stdio: 'pipe'
    });
    
    // Wait for orchestrator to start
    await new Promise((resolve) => {
      orchestratorProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Orchestration service running')) {
          log.success('Orchestrator started on fork network');
          resolve();
        }
      });
      
      setTimeout(() => resolve(), 10000); // Timeout after 10s
    });
    
    // Test 3: Run integration tests against fork
    log.info('Running integration tests against fork...');
    
    // Import and run specific fork tests
    const { runForkIntegrationTests } = require('./fork-integration');
    const testResults = await runForkIntegrationTests();
    
    if (testResults.passed === testResults.total) {
      log.success(`All ${testResults.total} fork tests passed!`);
    } else {
      log.error(`${testResults.failed} out of ${testResults.total} tests failed`);
    }
    
    // Cleanup
    orchestratorProcess.kill();
    
    return testResults;
    
  } catch (error) {
    log.error(`Fork test failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    // Check dependencies
    if (!await checkDependencies()) {
      process.exit(1);
    }
    
    // Start fork
    const forkProcess = await startFork();
    
    // Give fork time to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run tests
    const results = await runForkTests(forkProcess);
    
    // Cleanup
    log.header('CLEANUP');
    forkProcess.kill();
    log.success('Fork stopped');
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  log.info('\nTest interrupted by user');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };