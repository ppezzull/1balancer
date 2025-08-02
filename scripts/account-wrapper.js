#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

// Command passed as first argument
const command = process.argv[2] || 'account';

// Filter out the verbose loading messages
const filterPatterns = [
  /Loading environment variables/,
  /Root \.env loaded/,
  /Loading local overrides/,
  /^\s*$/  // Empty lines
];

function shouldFilter(line) {
  return filterPatterns.some(pattern => pattern.test(line));
}

// Change to hardhat directory
process.chdir('packages/hardhat');

// Spawn the yarn command
const child = spawn('yarn', [command], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// Create readline interfaces for stdout and stderr
const rlOut = readline.createInterface({
  input: child.stdout,
  crlfDelay: Infinity
});

const rlErr = readline.createInterface({
  input: child.stderr,
  crlfDelay: Infinity
});

// Filter stdout
rlOut.on('line', (line) => {
  if (!shouldFilter(line)) {
    console.log(line);
  }
});

// Filter stderr
rlErr.on('line', (line) => {
  if (!shouldFilter(line)) {
    console.error(line);
  }
});

// Handle process exit
child.on('exit', (code) => {
  process.exit(code);
});

// Handle errors
child.on('error', (err) => {
  console.error('Failed to start process:', err);
  process.exit(1);
});