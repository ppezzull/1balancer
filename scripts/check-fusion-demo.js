#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔍 Checking Fusion+ Demo Dependencies...\n');

const checks = [
  {
    name: 'Node.js',
    check: () => {
      const version = process.version;
      const major = parseInt(version.split('.')[0].substring(1));
      return { 
        success: major >= 18, 
        message: `Version ${version} (${major >= 18 ? 'OK' : 'Need v18+'})`
      };
    }
  },
  {
    name: 'Dependencies',
    check: () => {
      const hasNodeModules = fs.existsSync('node_modules');
      const hasYarnInstalled = fs.existsSync('.yarn-installed');
      return {
        success: hasNodeModules || hasYarnInstalled,
        message: hasNodeModules ? 'Installed' : 'Run: make setup'
      };
    }
  },
  {
    name: 'Demo Scripts',
    check: () => {
      const demoScript = path.join(__dirname, 'fusion-plus-demo.js');
      const testScript = path.join(__dirname, 'fusion-integration-tests.js');
      const hasDemo = fs.existsSync(demoScript);
      const hasTests = fs.existsSync(testScript);
      return {
        success: hasDemo && hasTests,
        message: hasDemo && hasTests ? 'Found' : 'Missing scripts'
      };
    }
  },
  {
    name: 'BASE Contracts',
    check: () => {
      const hubPath = 'packages/hardhat/deployments/baseSepolia/FusionPlusHub.json';
      const hasHub = fs.existsSync(hubPath);
      return {
        success: true, // Not critical
        message: hasHub ? 'Deployed' : 'Not deployed (run: make deploy-base)'
      };
    }
  },
  {
    name: 'NEAR Contracts',
    check: () => {
      const deployPath = '1balancer-near/.near-credentials/testnet/deploy.json';
      const hasNear = fs.existsSync(deployPath);
      return {
        success: true, // Not critical
        message: hasNear ? 'Deployed' : 'Not deployed (run: make near-deploy)'
      };
    }
  },
  {
    name: 'Orchestrator',
    check: async () => {
      try {
        execSync('curl -s http://localhost:8080/health', { stdio: 'pipe' });
        return { success: true, message: 'Running' };
      } catch {
        return { 
          success: true, // Not critical
          message: 'Not running (start with: make orchestrator-dev)' 
        };
      }
    }
  }
];

async function runChecks() {
  let allGood = true;
  
  for (const check of checks) {
    process.stdout.write(`Checking ${check.name}... `);
    
    try {
      const result = await check.check();
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`❌ ${result.message}`);
        allGood = false;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      allGood = false;
    }
  }
  
  console.log('\n' + '─'.repeat(50) + '\n');
  
  if (allGood) {
    console.log('✅ Ready for Fusion+ Demo!\n');
    console.log('Run: make fusion+\n');
  } else {
    console.log('⚠️  Some dependencies need attention.\n');
    console.log('Quick fix: make fusion+-setup\n');
  }
}

runChecks().catch(console.error);