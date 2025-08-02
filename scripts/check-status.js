#!/usr/bin/env node

const http = require('http');
const { default: chalk } = require('chalk');
const { default: ora } = require('ora');

console.log(chalk.blue.bold('\n📊 Checking service status...\n'));

const services = [
  {
    name: 'Frontend (Next.js)',
    url: 'http://localhost:3000',
    description: 'Main application UI',
    startCommand: 'yarn start',
    makeCommand: 'make frontend'
  },
  {
    name: 'Hardhat Node',
    url: 'http://localhost:8545',
    description: 'Local EVM blockchain',
    isRPC: true,
    startCommand: 'yarn chain',
    makeCommand: 'make chain'
  },
  {
    name: 'Orchestrator Service',
    url: 'http://localhost:8080',
    description: 'REST API, WebSocket & Cross-chain coordination',
    startCommand: 'yarn orchestrator:dev',
    makeCommand: 'make backend'
  },
  {
    name: 'API Proxy',
    url: 'http://localhost:3001',
    description: '1inch API proxy service',
    startCommand: 'yarn proxy:dev',
    makeCommand: 'make proxy'
  },
];

async function checkService(service) {
  return new Promise((resolve) => {
    const url = new URL(service.url);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: service.isRPC ? 'POST' : 'GET',
      timeout: 2000,
      headers: service.isRPC ? {
        'Content-Type': 'application/json'
      } : {}
    };

    const req = http.request(options, (res) => {
      resolve({ success: true, status: res.statusCode });
    });

    req.on('error', () => {
      resolve({ success: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false });
    });

    if (service.isRPC) {
      req.write(JSON.stringify({ jsonrpc: '2.0', method: 'net_version', params: [], id: 1 }));
    }

    req.end();
  });
}

async function checkAllServices() {
  let allRunning = true;
  let runningCount = 0;
  let totalRequired = services.filter(s => !s.optional).length;
  const notRunningServices = [];

  for (const service of services) {
    const spinner = ora(`Checking ${service.name}...`).start();
    const result = await checkService(service);

    if (result.success) {
      spinner.succeed(chalk.green(`✓ ${service.name}: ${service.url}`));
      console.log(chalk.gray(`  ${service.description}`));
      runningCount++;
    } else {
      if (service.optional) {
        spinner.warn(chalk.yellow(`○ ${service.name}: Not running (optional)`));
      } else {
        spinner.fail(chalk.red(`✗ ${service.name}: Not running`));
        allRunning = false;
      }
      console.log(chalk.gray(`  ${service.description}`));
      
      // Add start command suggestion
      if (service.startCommand !== 'Coming soon') {
        console.log(chalk.cyan(`  ▸ Start with: ${chalk.white(service.makeCommand)} or ${chalk.white(service.startCommand)}`));
      } else {
        console.log(chalk.gray(`  ▸ ${service.startCommand}`));
      }
      
      if (!result.success && !service.optional) {
        notRunningServices.push(service);
      }
    }
  }

  console.log(chalk.white.bold(`\n📈 Status Summary:`));
  console.log(chalk.gray(`   Running: ${runningCount}/${services.length} services`));
  console.log(chalk.gray(`   Required: ${services.filter(s => !s.optional && s).length} services`));
  console.log(chalk.gray(`   NEAR: Uses testnet (no local service)\n`));

  if (allRunning) {
    console.log(chalk.green.bold('✅ All required services are running!\n'));
    
    console.log(chalk.cyan('🌐 Quick Links:'));
    console.log(chalk.white('   Frontend:       http://localhost:3000'));
    console.log(chalk.white('   Orchestrator:   http://localhost:8080'));
    console.log(chalk.white('   API Docs:       http://localhost:8080/api-docs'));
    console.log(chalk.white('   WebSocket:      ws://localhost:8080/ws'));
    console.log(chalk.white('   API Proxy:      http://localhost:3001\n'));
  } else {
    console.log(chalk.yellow.bold('⚠️  Some required services are not running.\n'));
    console.log(chalk.white('To start all services at once:'));
    console.log(chalk.cyan('   make dev') + chalk.gray(' or ') + chalk.cyan('yarn dev:all\n'));
    
    if (notRunningServices.length > 0) {
      console.log(chalk.white('To start missing required services individually:'));
      notRunningServices.forEach(service => {
        console.log(chalk.cyan(`   ${service.makeCommand}`) + chalk.gray(` (${service.name})`));
      });
      console.log('');
    }
  }
}

checkAllServices().catch(error => {
  console.error(chalk.red('\n❌ Status check failed:'), error);
  process.exit(1);
});