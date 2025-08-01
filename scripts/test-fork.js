const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const testConfig = require('../packages/hardhat/test/test-config.json');
const chalk = require('chalk');

async function runForkTests() {
  console.log(chalk.blue('🔄 Starting Hardhat fork...'));
  
  const forkUrl = `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  const blockNumber = process.env.FORK_BLOCK_NUMBER || testConfig.chains.base.blockNumber;
  
  if (!process.env.ALCHEMY_API_KEY) {
    console.error(chalk.red('❌ ALCHEMY_API_KEY not set in environment'));
    console.log(chalk.yellow('Please set ALCHEMY_API_KEY in your .env file'));
    process.exit(1);
  }
  
  // Start fork
  console.log(chalk.gray(`Forking BASE mainnet at block ${blockNumber}...`));
  const forkProcess = exec(
    `npx hardhat node --fork ${forkUrl} --fork-block-number ${blockNumber}`,
    { cwd: 'packages/hardhat' }
  );
  
  let forkReady = false;
  
  forkProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Started HTTP and WebSocket JSON-RPC server')) {
      forkReady = true;
      console.log(chalk.green('✅ Fork ready on http://localhost:8545'));
    }
    if (output.includes('Account #')) {
      console.log(chalk.gray(output.trim()));
    }
  });

  forkProcess.stderr.on('data', (data) => {
    console.error(chalk.red(`Fork error: ${data}`));
  });

  // Wait for fork to be ready
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (forkReady) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 500);
  });
  
  // Give it a bit more time to stabilize
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Run fork tests
    console.log(chalk.blue('\n🧪 Running fork tests...'));
    const { stdout, stderr } = await execAsync(
      'npx hardhat test test/ethereum-hub/fork/*.test.ts --network localhost',
      { cwd: 'packages/hardhat' }
    );
    
    console.log(stdout);
    if (stderr && !stderr.includes('Warning')) {
      console.error(chalk.red(stderr));
    }
    
    console.log(chalk.green('\n✅ Fork tests completed successfully'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Fork tests failed:'));
    console.error(error.stdout || error.message);
    process.exit(1);
  } finally {
    // Clean up
    console.log(chalk.blue('\n🧹 Cleaning up...'));
    forkProcess.kill();
    process.exit(0);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⚠️  Test interrupted by user'));
  process.exit(0);
});

runForkTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});