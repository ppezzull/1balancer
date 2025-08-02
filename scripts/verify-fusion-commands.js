#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue.bold('\n🔍 Verifying Fusion+ Commands\n'));

const commands = [
  { name: 'fusion-plus', description: 'Main demo command' },
  { name: 'fusion-plus-test', description: 'Integration tests' },
  { name: 'fusion-plus-setup', description: 'Quick setup' },
  { name: 'fusion-plus-arch', description: 'Architecture display' },
  { name: 'fusion-plus-status', description: 'Deployment status' }
];

// Check if each command exists in Makefile
commands.forEach(cmd => {
  try {
    // Check if command exists
    const makefileContent = execSync('cat Makefile', { encoding: 'utf8' });
    if (makefileContent.includes(`${cmd}:`)) {
      console.log(chalk.green(`✅ ${cmd.name}: ${cmd.description}`));
    } else {
      console.log(chalk.red(`❌ ${cmd.name}: Not found in Makefile`));
    }
  } catch (error) {
    console.log(chalk.red(`❌ ${cmd.name}: Error checking command`));
  }
});

// Check script files
console.log(chalk.blue('\n📄 Checking Script Files:\n'));

const scripts = [
  'scripts/fusion-plus-demo.js',
  'scripts/fusion-integration-tests.js',
  'scripts/check-fusion-demo.js'
];

scripts.forEach(script => {
  try {
    execSync(`test -f ${script}`, { stdio: 'ignore' });
    console.log(chalk.green(`✅ ${script} exists`));
    
    // Check if executable
    execSync(`test -x ${script}`, { stdio: 'ignore' });
    console.log(chalk.gray(`   └─ Executable`));
  } catch {
    console.log(chalk.red(`❌ ${script} missing or not executable`));
  }
});

// Check dependencies
console.log(chalk.blue('\n📦 Checking Dependencies:\n'));

const deps = ['chalk', 'ora', 'inquirer', 'axios', 'ethers', 'near-api-js'];

deps.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(chalk.green(`✅ ${dep} installed`));
  } catch {
    console.log(chalk.red(`❌ ${dep} not installed`));
  }
});

console.log(chalk.green.bold('\n✨ Verification Complete!\n'));
console.log(chalk.white('To run the demo: make fusion-plus'));
console.log(chalk.white('To check status: make fusion-plus-status\n'));