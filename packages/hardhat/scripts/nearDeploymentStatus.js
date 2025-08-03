require('../env.config');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log('\n📍 Network: NEAR Testnet');
  console.log('📅 Status as of:', new Date().toLocaleString());
  console.log('═'.repeat(70));
  
  // Check NEAR account from env
  const nearAccount = process.env.NEAR_MASTER_ACCOUNT;
  if (nearAccount) {
    console.log('\n👤 NEAR Master Account:');
    console.log(`   Account: ${nearAccount}`);
    console.log(`   Explorer: https://testnet.nearblocks.io/address/${nearAccount}`);
  } else {
    console.log('\n⚠️  NEAR_MASTER_ACCOUNT not set in .env');
  }
  
  console.log('\n📄 DEPLOYED CONTRACTS:');
  console.log('─'.repeat(70));
  
  // Check if NEAR CLI is installed
  let nearCliInstalled = false;
  try {
    execSync('which near', { stdio: 'pipe' });
    nearCliInstalled = true;
  } catch (e) {
    // NEAR CLI not installed
  }
  
  // 1. HTLC Contract
  console.log('\n1️⃣ Fusion+ HTLC Contract (Hash Time Locked Contract)');
  if (nearAccount) {
    const htlcAccount = `fusion-htlc.${nearAccount}`;
    console.log('   ├─ Account ID: ' + htlcAccount);
    console.log('   ├─ Explorer: https://testnet.nearblocks.io/address/' + htlcAccount);
    
    if (nearCliInstalled) {
      try {
        execSync(`near state ${htlcAccount}`, { stdio: 'pipe' });
        console.log('   ├─ Status: ✅ Deployed');
      } catch (e) {
        console.log('   ├─ Status: ❌ Not deployed');
      }
    } else {
      console.log('   ├─ Status: ⚠️  Check manually (NEAR CLI not installed)');
    }
    
    console.log('   ├─ Purpose: Atomic swaps with SHA-256 hashlocks');
    console.log('   └─ Key Functions:');
    console.log('      ├─ create_swap() - Create new atomic swap');
    console.log('      ├─ claim() - Claim funds with secret');
    console.log('      ├─ refund() - Refund after timeout');
    console.log('      ├─ get_swap() - Query swap details');
    console.log('      └─ verify_hashlock() - Verify SHA-256 preimage');
  } else {
    console.log('   └─ Status: ❓ Cannot check (NEAR_MASTER_ACCOUNT not set)');
  }
  
  // 2. Solver Registry Contract
  console.log('\n2️⃣ Solver Registry Contract (Optional)');
  if (nearAccount) {
    const solverAccount = `solver-registry.${nearAccount}`;
    console.log('   ├─ Account ID: ' + solverAccount);
    console.log('   ├─ Explorer: https://testnet.nearblocks.io/address/' + solverAccount);
    
    if (nearCliInstalled) {
      try {
        execSync(`near state ${solverAccount}`, { stdio: 'pipe' });
        console.log('   ├─ Status: ✅ Deployed');
      } catch (e) {
        console.log('   ├─ Status: ❌ Not deployed (optional)');
      }
    } else {
      console.log('   ├─ Status: ⚠️  Check manually (NEAR CLI not installed)');
    }
    
    console.log('   ├─ Purpose: Register and manage solver nodes');
    console.log('   └─ Key Functions:');
    console.log('      ├─ register_solver() - Register new solver');
    console.log('      ├─ update_solver() - Update solver info');
    console.log('      ├─ get_active_solvers() - List active solvers');
    console.log('      └─ stake() - Stake tokens as solver');
  } else {
    console.log('   └─ Status: ❓ Cannot check (NEAR_MASTER_ACCOUNT not set)');
  }
  
  // Check NEAR contract source
  const nearContractPath = path.join(process.cwd(), '..', '..', '1balancer-near');
  console.log('\n📁 NEAR CONTRACT SOURCE:');
  console.log('─'.repeat(70));
  if (fs.existsSync(nearContractPath)) {
    console.log('✅ Found at: 1balancer-near/');
    
    // Check if built
    const wasmPath = path.join(nearContractPath, 'target/wasm32-unknown-unknown/release/fusion_plus_htlc.wasm');
    if (fs.existsSync(wasmPath)) {
      const stats = fs.statSync(wasmPath);
      console.log('✅ WASM built: ' + (stats.size / 1024).toFixed(2) + ' KB');
      console.log('   Last build: ' + stats.mtime.toLocaleString());
    } else {
      console.log('❌ WASM not built - run: make near-build');
    }
  } else {
    console.log('❌ Not found - run: make submodule-init');
  }
  
  console.log('\n🔗 CROSS-CHAIN INTEGRATION:');
  console.log('─'.repeat(70));
  console.log('• Protocol: SHA-256 Hashlocks (compatible with ETH)');
  console.log('• Timeout: Configurable (default 24 hours)');
  console.log('• Fees: Minimal NEAR gas fees');
  console.log('• Bridge: Via orchestration service');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('─'.repeat(70));
  
  let steps = [];
  if (!nearAccount) {
    steps.push('1. Set NEAR_MASTER_ACCOUNT in .env');
    steps.push('2. Login: near login');
  }
  
  if (!nearCliInstalled) {
    steps.push('• Install NEAR CLI: npm install -g near-cli');
  }
  
  steps.push('• Deploy contracts: make deploy-near-all');
  steps.push('• Check BASE status: make deploy-base-status');
  steps.push('• Start orchestrator: make orchestrator-dev');
  steps.push('• Run integration test: make fusion-plus-test');
  
  steps.forEach(step => console.log(step));
  
  console.log('\n💡 USEFUL COMMANDS:');
  console.log('─'.repeat(70));
  console.log('• Build contracts: make near-build');
  console.log('• Run tests: make near-test');
  console.log('• Deploy HTLC: make deploy-near-htlc');
  console.log('• Check gas costs: make near-gas-estimate');
  console.log('• Delete contracts: make near-delete');
  
  console.log('\n📚 DOCUMENTATION:');
  console.log('─'.repeat(70));
  console.log('• NEAR Integration: packages/hardhat/contracts/ethereum-hub/docs/09-near-integration.md');
  console.log('• HTLC Implementation: 1balancer-near/src/htlc.rs');
  console.log('• Cross-chain Guide: docs/solution/bidirectional-swaps-revert-architecture.md');
  
  console.log('\n⚡ QUICK TEST:');
  console.log('─'.repeat(70));
  if (nearAccount) {
    console.log(`near call fusion-htlc.${nearAccount} get_swap_count '' --accountId ${nearAccount}`);
  } else {
    console.log('Set NEAR_MASTER_ACCOUNT first, then:');
    console.log('near call fusion-htlc.YOUR_ACCOUNT get_swap_count \'\' --accountId YOUR_ACCOUNT');
  }
  
  console.log('\n');
}

main().catch(console.error);