#!/usr/bin/env node

const { execSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

console.log(chalk.blue.bold('\n🔍 Checking system dependencies...\n'));

const dependencies = [
  {
    name: 'Node.js',
    command: 'node --version',
    minVersion: '20.18.3',
    installGuide: 'Visit https://nodejs.org/ to install Node.js',
    parseVersion: (output) => output.trim().replace('v', '')
  },
  {
    name: 'Yarn',
    command: 'yarn --version',
    minVersion: '3.2.3',
    installGuide: 'Run: npm install -g yarn',
    parseVersion: (output) => output.trim()
  },
  {
    name: 'Git',
    command: 'git --version',
    minVersion: '2.0.0',
    installGuide: 'Visit https://git-scm.com/downloads',
    parseVersion: (output) => {
      const match = output.match(/(\d+\.\d+\.\d+)/);
      return match ? match[1] : '0.0.0';
    }
  },
  {
    name: 'Curl',
    command: 'curl --version',
    minVersion: null,
    installGuide: 'Usually pre-installed. On macOS: brew install curl',
    parseVersion: (output) => output.split('\n')[0]
  },
  {
    name: 'Rust',
    command: 'rustc --version',
    minVersion: '1.86.0',
    installGuide: 'Will be installed during setup:rust phase',
    optional: true,
    parseVersion: (output) => {
      const match = output.match(/(\d+\.\d+\.\d+)/);
      return match ? match[1] : '0.0.0';
    }
  }
];

let allGood = true;

function compareVersions(current, required) {
  if (!required) return true;
  
  const currentParts = current.split('.').map(Number);
  const requiredParts = required.split('.').map(Number);
  
  for (let i = 0; i < requiredParts.length; i++) {
    if (currentParts[i] > requiredParts[i]) return true;
    if (currentParts[i] < requiredParts[i]) return false;
  }
  return true;
}

for (const dep of dependencies) {
  const spinner = ora(`Checking ${dep.name}...`).start();
  
  try {
    const output = execSync(dep.command, { encoding: 'utf8' });
    const version = dep.parseVersion(output);
    
    if (dep.minVersion && !compareVersions(version, dep.minVersion)) {
      spinner.fail(chalk.red(`${dep.name} version ${version} is below minimum ${dep.minVersion}`));
      console.log(chalk.yellow(`  → ${dep.installGuide}\n`));
      if (!dep.optional) allGood = false;
    } else {
      spinner.succeed(chalk.green(`${dep.name} ${version} ✓`));
    }
  } catch (error) {
    if (dep.optional) {
      spinner.warn(chalk.yellow(`${dep.name} not found (optional)`));
      console.log(chalk.yellow(`  → ${dep.installGuide}\n`));
    } else {
      spinner.fail(chalk.red(`${dep.name} not found`));
      console.log(chalk.yellow(`  → ${dep.installGuide}\n`));
      allGood = false;
    }
  }
}

if (allGood) {
  console.log(chalk.green.bold('\n✅ All required dependencies are installed!\n'));
  process.exit(0);
} else {
  console.log(chalk.red.bold('\n❌ Some dependencies are missing. Please install them before continuing.\n'));
  process.exit(1);
}