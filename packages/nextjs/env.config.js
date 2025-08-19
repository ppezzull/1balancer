/**
 * Environment Variable Loader
 * Automatically loads environment variables from the root .env file
 * This ensures inheritance without manual copying
 */

const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Function to load root .env file
function loadRootEnv() {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  
  if (fs.existsSync(rootEnvPath)) {
    console.log('Loading environment variables from root .env...');
    const result = dotenv.config({ path: rootEnvPath });
    
    if (result.error) {
      console.error('Error loading root .env:', result.error);
    } else {
      console.log('Root .env loaded successfully');
    }
  } else {
    console.warn('Root .env file not found at:', rootEnvPath);
  }
}

// Load root env first
loadRootEnv();

// Then load local overrides if they exist
const localEnvPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(localEnvPath)) {
  console.log('Loading local overrides from .env.local...');
  dotenv.config({ path: localEnvPath });
}

module.exports = {};