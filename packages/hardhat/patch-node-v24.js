// Patch for Node.js v24 compatibility with proper-lockfile
// This must be loaded before any module that uses signal-exit

// Patch Module.prototype.require to intercept signal-exit
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'signal-exit') {
    // Return a patched version that works with Node v24
    return function onExit(callback, options) {
      process.on('exit', callback);
      process.on('SIGINT', () => {
        callback();
        process.exit();
      });
      process.on('SIGTERM', () => {
        callback();
        process.exit();
      });
      // Return a dummy remove function
      return function() {};
    };
  }
  return originalRequire.apply(this, arguments);
};