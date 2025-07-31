#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk').default;
const ora = require('ora').default;
const dotenv = require('dotenv');

console.log(chalk.blue.bold('\n📄 Setting up environment configuration...\n'));

// Check for force flag
const forceUpdate = process.argv.includes('--force') || process.argv.includes('-f');
if (forceUpdate) {
  console.log(chalk.yellow('⚠️  Force update mode - will overwrite existing files\n'));
}

// First, check if .env.example exists
const envExamplePath = path.join(process.cwd(), '.env.example');
if (!fs.existsSync(envExamplePath)) {
  console.error(chalk.red('❌ .env.example not found in project root!'));
  console.log(chalk.yellow('Please ensure .env.example exists before running this script.'));
  process.exit(1);
}

// Create main .env from .env.example if it doesn't exist
const mainEnvPath = path.join(process.cwd(), '.env');
const mainEnvSpinner = ora('Creating main .env file...').start();

if (fs.existsSync(mainEnvPath)) {
  mainEnvSpinner.warn(chalk.yellow('.env already exists, skipping'));
} else {
  try {
    fs.copyFileSync(envExamplePath, mainEnvPath);
    mainEnvSpinner.succeed(chalk.green('.env created from .env.example'));
    console.log(chalk.cyan('   → Please update .env with your actual values'));
  } catch (error) {
    mainEnvSpinner.fail(chalk.red('Failed to create .env'));
    console.error(error);
    process.exit(1);
  }
}

// Load the main .env file
const envConfig = dotenv.config({ path: mainEnvPath });
if (envConfig.error) {
  console.error(chalk.red('❌ Failed to load .env file:'), envConfig.error);
  process.exit(1);
}

const env = envConfig.parsed || {};

// Define package-specific env files that inherit from main .env
const packageEnvConfigs = [
  {
    path: 'packages/nextjs/.env.local',
    description: 'Next.js local overrides only',
    getContent: (env) => `# Next.js Local Environment Overrides
# This file is for local overrides only
# All values are inherited from root .env automatically via env.config.js
# Only add values here if you need to override the root configuration

# Example override (uncomment to use):
# NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
`
  },
  {
    path: 'packages/hardhat/.env',
    description: 'Hardhat smart contract configuration',
    getContent: (env) => `# Hardhat Environment Variables
# This file inherits from root .env
# Only override values here if needed for local development

# Deployment Configuration
DEPLOYER_PRIVATE_KEY=${env.DEPLOYER_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'}

# Network RPC URLs
BASE_RPC_URL=${env.BASE_RPC_URL || 'https://mainnet.base.org'}
BASE_SEPOLIA_RPC_URL=${env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'}
LOCALHOST_RPC_URL=${env.LOCALHOST_RPC_URL || 'http://localhost:8545'}

# API Keys
ALCHEMY_API_KEY=${env.ALCHEMY_API_KEY || ''}
INFURA_API_KEY=${env.INFURA_API_KEY || ''}
ETHERSCAN_API_KEY=${env.ETHERSCAN_API_KEY || ''}
ETHERSCAN_V2_API_KEY=${env.ETHERSCAN_V2_API_KEY || env.ETHERSCAN_API_KEY || ''}
BASESCAN_API_KEY=${env.BASESCAN_API_KEY || ''}
ONEINCH_API_KEY=${env.ONEINCH_API_KEY || ''}

# Deployment Configuration
DEPLOYER_PRIVATE_KEY_ENCRYPTED=${env.DEPLOYER_PRIVATE_KEY_ENCRYPTED || ''}

# Development Settings
REPORT_GAS=${env.REPORT_GAS || 'true'}
HARDHAT_PORT=${env.HARDHAT_PORT || '8545'}
`
  },
  {
    path: '1balancer-near/.env',
    description: 'NEAR Protocol configuration',
    getContent: (env) => `# NEAR Environment Variables
# This file inherits from root .env
# Only override values here if needed for local development

# NEAR Configuration
NEAR_ENV=${env.NEAR_ENV || 'localnet'}
NEAR_NETWORK_ID=${env.NEAR_NETWORK_ID || 'localnet'}

# Contract Names
CONTRACT_NAME=${env.NEAR_HTLC_CONTRACT_NAME || 'fusion-plus-htlc.test.near'}
SOLVER_CONTRACT_NAME=${env.NEAR_SOLVER_CONTRACT_NAME || 'solver-registry.test.near'}
MASTER_ACCOUNT_ID=${env.NEAR_MASTER_ACCOUNT_ID || 'test.near'}

# Service Ports
BRIDGE_PORT=${env.NEAR_BRIDGE_PORT || '8090'}
SOLVER_PORT=${env.SOLVER_PORT || '8091'}
NEAR_LOCAL_PORT=${env.NEAR_LOCAL_PORT || '3030'}

# MPC Configuration
MPC_CONTRACT_ID=${env.NEAR_MPC_CONTRACT_ID || 'v1.signer.testnet'}
`
  }
];

// Create package-specific env files
console.log(chalk.cyan('\n📦 Creating package-specific environment files...\n'));

let createdCount = 0;
let skippedCount = 0;

for (const config of packageEnvConfigs) {
  const spinner = ora(`Creating ${config.path}...`).start();
  const fullPath = path.join(process.cwd(), config.path);
  const dir = path.dirname(fullPath);

  try {
    // Check if file already exists
    if (fs.existsSync(fullPath) && !forceUpdate) {
      spinner.warn(chalk.yellow(`${config.path} already exists, skipping (use --force to overwrite)`));
      skippedCount++;
      continue;
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Generate content using values from main .env
    const content = config.getContent(env);
    
    // Write the file
    fs.writeFileSync(fullPath, content);
    spinner.succeed(chalk.green(`${config.path} created - ${config.description}`));
    createdCount++;
  } catch (error) {
    spinner.fail(chalk.red(`Failed to create ${config.path}`));
    console.error(chalk.red(`  Error: ${error.message}`));
  }
}

console.log(chalk.green.bold(`\n✅ Environment setup complete!`));
console.log(chalk.gray(`   Created: ${createdCount + (mainEnvPath ? 1 : 0)} files`));
console.log(chalk.gray(`   Skipped: ${skippedCount + (mainEnvPath ? 0 : 1)} files (already exist)\n`));

// Check for missing required values
console.log(chalk.yellow('⚠️  Important next steps:\n'));

const requiredKeys = [
  { key: 'ONEINCH_API_KEY', description: 'Get from ETHGlobal hackathon process or 1inch team' },
  { key: 'ALCHEMY_API_KEY', description: 'Get from https://www.alchemy.com/ (required for production)' },
  { key: 'NEXT_PUBLIC_PRIVY_APP_ID', description: 'Get from https://console.privy.io and enable Ethereum wallets' },
  { key: 'NEXT_PUBLIC_PROXY_URL', description: 'Deploy proxy from github.com/Tanz0rz/1inch-vercel-proxy' }
];

let missingKeys = false;
for (const { key, description } of requiredKeys) {
  if (!env[key] || env[key].includes('your-') || env[key].includes('here')) {
    console.log(chalk.white(`   • Update ${chalk.cyan(key)} in .env`));
    console.log(chalk.gray(`     ${description}\n`));
    missingKeys = true;
  }
}

if (!missingKeys) {
  console.log(chalk.green('   All required keys are configured! 🎉\n'));
} else {
  console.log(chalk.white('After updating .env, run this script again to regenerate package configs.\n'));
}