#!/bin/bash

echo "🔍 Checking orchestrator prerequisites..."
echo ""

# Check if submodule exists
if [ ! -d "1balancer-near" ]; then
    echo "❌ NEAR submodule not initialized"
    echo ""
    echo "📋 To fix this, run these commands in order:"
    echo "  1. make submodule-init"
    echo "  2. make near-install"
    echo "  3. make near-build"
    echo "  4. make near-deploy"
    echo ""
    echo "⚠️  Note: The orchestrator will still work for BASE <-> Ethereum swaps"
    echo "         NEAR errors are non-critical and only affect NEAR swaps"
    echo ""
else
    echo "✅ NEAR submodule found"
fi

# Check environment variables (try loading from .env first)
if [ -f ".env" ]; then
    # Load NEAR variables
    export $(grep -E '^NEAR_' .env 2>/dev/null | grep -v '^#' | xargs)
fi

if [ -z "$NEAR_MASTER_ACCOUNT" ] || [ -z "$NEAR_PRIVATE_KEY" ]; then
    echo "⚠️  NEAR credentials not configured"
    echo ""
    echo "📋 You have two options for NEAR functionality:"
    echo ""
    echo "Option 1: Native NEAR (Recommended)"
    echo "  1. Create account at https://wallet.testnet.near.org"
    echo "  2. Export credentials:"
    echo "     export NEAR_MASTER_ACCOUNT=your-account.testnet"
    echo "     export NEAR_PRIVATE_KEY=ed25519:your-private-key"
    echo ""
    echo "Option 2: Aurora EVM (MetaMask compatible)"
    echo "  - No NEAR account needed"
    echo "  - Use MetaMask with Aurora Testnet"
    echo "  - Deploy EVM contracts instead"
    echo ""
    echo "⚠️  Note: The orchestrator works without these, but NEAR swaps will be disabled"
    echo ""
else
    echo "✅ NEAR credentials found"
    echo "   Account: $NEAR_MASTER_ACCOUNT"
    echo "   Private Key: ${NEAR_PRIVATE_KEY:0:20}..."
fi

# Check for NEAR deployment
if [ -f "1balancer-near/.near-credentials/testnet/deploy.json" ]; then
    echo ""
    echo "✅ NEAR contract deployment found"
    echo "   The orchestrator will read from: 1balancer-near/.near-credentials/testnet/deploy.json"
fi

echo ""
echo "✅ Orchestrator can run now. NEAR errors are expected if not fully configured."