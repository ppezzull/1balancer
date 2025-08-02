#!/usr/bin/env node

const { default: chalk } = require('chalk');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(chalk.blue.bold('\n📋 Service Logs\n'));

// Check if we're using Docker or direct processes
const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
const useDocker = fs.existsSync(dockerComposePath);

if (useDocker) {
  console.log(chalk.yellow('Docker deployment detected. Showing Docker logs...\n'));
  
  const dockerLogs = spawn('docker-compose', ['logs', '-f', '--tail=50'], {
    stdio: 'inherit',
    shell: true
  });

  dockerLogs.on('error', (error) => {
    console.error(chalk.red('Failed to show Docker logs:'), error.message);
    console.log(chalk.yellow('\nMake sure Docker is running and docker-compose is installed.\n'));
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    dockerLogs.kill();
    process.exit(0);
  });
} else {
  console.log(chalk.yellow('Direct process deployment detected.\n'));
  console.log(chalk.white('Log locations:'));
  console.log(chalk.gray('  • Frontend logs:     Check the terminal running "yarn dev:all"'));
  console.log(chalk.gray('  • Hardhat logs:      Check the terminal or hardhat.log'));
  console.log(chalk.gray('  • Orchestrator logs: Check the terminal or backend.log'));
  console.log(chalk.gray('  • NEAR logs:         Check 1balancer-near/neardev/\n'));
  
  // Try to show recent PM2 logs if available
  try {
    const pm2Check = require('child_process').execSync('pm2 --version', { stdio: 'pipe' });
    console.log(chalk.cyan('PM2 detected. Showing PM2 logs...\n'));
    
    const pm2Logs = spawn('pm2', ['logs', '--lines', '50'], {
      stdio: 'inherit',
      shell: true
    });
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      pm2Logs.kill();
      process.exit(0);
    });
  } catch {
    console.log(chalk.gray('💡 Tip: Install PM2 for better process management:'));
    console.log(chalk.cyan('   npm install -g pm2\n'));
    
    console.log(chalk.white('To view logs in real-time:'));
    console.log(chalk.cyan('   1. Run services with: yarn dev:all'));
    console.log(chalk.cyan('   2. Logs will appear in that terminal\n'));
  }
}