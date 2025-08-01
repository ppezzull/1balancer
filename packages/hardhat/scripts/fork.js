#!/usr/bin/env node

const { spawn } = require('child_process');

const network = process.argv[2];

if (!network) {
  console.error('Error: Please specify a network to fork');
  console.log('Usage: yarn fork <network>');
  console.log('Available networks: mainnet, sepolia, base, arbitrum, optimism, polygon');
  process.exit(1);
}

// Load environment variables
require('dotenv').config({ path: '../../.env' });

const apiKey = process.env.ALCHEMY_API_KEY;

if (!apiKey && network !== 'base') {
  console.error('Error: ALCHEMY_API_KEY is required for this network');
  console.log('Please set ALCHEMY_API_KEY in your .env file');
  process.exit(1);
}

// Map network names to fork URLs
const networkUrls = {
  mainnet: `https://eth-mainnet.alchemyapi.io/v2/${apiKey}`,
  sepolia: `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`,
  base: 'https://mainnet.base.org',
  arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${apiKey}`,
  optimism: `https://opt-mainnet.g.alchemy.com/v2/${apiKey}`,
  polygon: `https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`
};

const forkUrl = networkUrls[network];

if (!forkUrl) {
  console.error(`Error: Unknown network '${network}'`);
  console.log('Available networks: mainnet, sepolia, base, arbitrum, optimism, polygon');
  process.exit(1);
}

console.log(`Starting Hardhat fork for ${network}...`);

const args = ['hardhat', 'node', '--network', 'hardhat', '--fork', forkUrl];

const hardhatProcess = spawn('npx', args, {
  stdio: 'inherit'
});

hardhatProcess.on('error', (error) => {
  console.error(`Failed to start Hardhat node: ${error.message}`);
  process.exit(1);
});

hardhatProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Hardhat node exited with code ${code}`);
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down Hardhat node...');
  hardhatProcess.kill('SIGINT');
  process.exit(0);
});