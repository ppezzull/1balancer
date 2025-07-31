#!/usr/bin/env node

const http = require('http');
const chalk = require('chalk').default;
const ora = require('ora').default;

console.log(chalk.blue.bold('\n📊 Checking service status...\n'));

const services = [
  {
    name: 'Frontend (Next.js)',
    url: 'http://localhost:3000',
    description: 'Main application UI'
  },
  {
    name: 'Hardhat Node',
    url: 'http://localhost:8545',
    description: 'Local EVM blockchain',
    isRPC: true
  },
  {
    name: 'Orchestrator API',
    url: 'http://localhost:8080',
    description: 'Backend coordination service'
  },
  {
    name: 'NEAR Bridge',
    url: 'http://localhost:8090',
    description: 'Cross-chain communication'
  },
  {
    name: 'NEAR Local',
    url: 'http://localhost:3030',
    description: 'NEAR local development',
    optional: true
  },
  {
    name: 'Solver Service',
    url: 'http://localhost:8091',
    description: 'TEE Solver agent',
    optional: true
  }
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
    }
  }

  console.log(chalk.white.bold(`\n📈 Status Summary:`));
  console.log(chalk.gray(`   Running: ${runningCount}/${services.length} services`));
  console.log(chalk.gray(`   Required: ${services.filter(s => !s.optional && s).length} services\n`));

  if (allRunning) {
    console.log(chalk.green.bold('✅ All required services are running!\n'));
    
    console.log(chalk.cyan('🌐 Quick Links:'));
    console.log(chalk.white('   Frontend:     http://localhost:3000'));
    console.log(chalk.white('   Orchestrator: http://localhost:8080'));
    console.log(chalk.white('   NEAR Bridge:  http://localhost:8090\n'));
  } else {
    console.log(chalk.yellow.bold('⚠️  Some required services are not running.\n'));
    console.log(chalk.white('To start all services, run:'));
    console.log(chalk.cyan('   yarn dev:all\n'));
  }
}

checkAllServices().catch(error => {
  console.error(chalk.red('\n❌ Status check failed:'), error);
  process.exit(1);
});