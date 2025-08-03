#!/usr/bin/env node

// Patch signal-exit for Node.js v24 compatibility
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'signal-exit') {
    // Return a simple implementation that works with Node v24
    return function onExit(callback) {
      process.on('exit', callback);
      process.on('SIGINT', () => {
        callback();
        process.exit();
      });
      process.on('SIGTERM', () => {
        callback();
        process.exit();
      });
    };
  }
  return originalRequire.apply(this, arguments);
};

// Now run hardhat
const { spawn } = require('child_process');
const child = spawn('npx', ['hardhat', 'node', '--network', 'hardhat', '--no-deploy'], {
  stdio: 'inherit'
});

child.on('error', (error) => {
  console.error('Failed to start hardhat:', error);
  process.exit(1);
});