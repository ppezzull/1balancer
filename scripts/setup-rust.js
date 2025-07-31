#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const chalk = require('chalk').default;
const ora = require('ora').default;
const fs = require('fs');
const path = require('path');

console.log(chalk.blue.bold('\n🦀 Setting up Rust for NEAR development...\n'));

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      ...options,
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function setupRust() {
  // Check if rustup is installed
  let rustupInstalled = false;
  const rustupSpinner = ora('Checking for rustup...').start();
  
  try {
    execSync('rustup --version', { stdio: 'pipe' });
    rustupInstalled = true;
    rustupSpinner.succeed(chalk.green('rustup is already installed'));
  } catch {
    rustupSpinner.warn(chalk.yellow('rustup not found, installing...'));
  }

  // Install rustup if not present
  if (!rustupInstalled) {
    const installSpinner = ora('Installing rustup...').start();
    try {
      // Download and run rustup installer
      await runCommand('curl', ['--proto', "'=https'", '--tlsv1.2', '-sSf', 'https://sh.rustup.rs', '|', 'sh', '-s', '--', '-y']);
      
      // Source cargo env
      const cargoEnv = path.join(process.env.HOME, '.cargo', 'env');
      if (fs.existsSync(cargoEnv)) {
        process.env.PATH = `${path.join(process.env.HOME, '.cargo', 'bin')}:${process.env.PATH}`;
      }
      
      installSpinner.succeed(chalk.green('rustup installed successfully'));
    } catch (error) {
      installSpinner.fail(chalk.red('Failed to install rustup'));
      console.error(error);
      process.exit(1);
    }
  }

  // Install Rust 1.86.0
  const versionSpinner = ora('Installing Rust 1.86.0...').start();
  try {
    execSync('rustup default 1.86.0', { stdio: 'pipe' });
    versionSpinner.succeed(chalk.green('Rust 1.86.0 installed'));
  } catch (error) {
    versionSpinner.fail(chalk.red('Failed to install Rust 1.86.0'));
    console.error(error);
    process.exit(1);
  }

  // Add wasm target
  const wasmSpinner = ora('Adding wasm32-unknown-unknown target...').start();
  try {
    execSync('rustup target add wasm32-unknown-unknown', { stdio: 'pipe' });
    wasmSpinner.succeed(chalk.green('WASM target added'));
  } catch (error) {
    wasmSpinner.fail(chalk.red('Failed to add WASM target'));
    console.error(error);
    process.exit(1);
  }

  // Install cargo-near
  const cargoNearSpinner = ora('Installing cargo-near...').start();
  try {
    execSync('cargo install cargo-near --locked', { stdio: 'pipe' });
    cargoNearSpinner.succeed(chalk.green('cargo-near installed'));
  } catch (error) {
    // Try without --locked flag if it fails
    try {
      execSync('cargo install cargo-near', { stdio: 'pipe' });
      cargoNearSpinner.succeed(chalk.green('cargo-near installed'));
    } catch {
      cargoNearSpinner.warn(chalk.yellow('cargo-near might already be installed'));
    }
  }

  // Install near-cli
  const nearCliSpinner = ora('Installing near-cli...').start();
  try {
    execSync('npm install -g near-cli', { stdio: 'pipe' });
    nearCliSpinner.succeed(chalk.green('near-cli installed'));
  } catch (error) {
    nearCliSpinner.warn(chalk.yellow('near-cli might already be installed or npm permissions issue'));
  }

  console.log(chalk.green.bold('\n✅ Rust setup completed successfully!\n'));
  console.log(chalk.gray('You may need to restart your terminal or run:'));
  console.log(chalk.cyan('source $HOME/.cargo/env\n'));
}

// Run setup
setupRust().catch(error => {
  console.error(chalk.red('\n❌ Rust setup failed:'), error);
  process.exit(1);
});