#!/bin/bash

echo "🔍 Debugging orchestrator environment check..."
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    
    # Show NEAR variables in .env
    echo ""
    echo "📄 NEAR variables in .env:"
    grep -E '^NEAR_MASTER_ACCOUNT|^NEAR_PRIVATE_KEY' .env | grep -v '^#' || echo "   (none found)"
    
    # Export them
    echo ""
    echo "🔄 Exporting NEAR variables..."
    export $(grep -E '^NEAR_' .env 2>/dev/null | grep -v '^#' | xargs)
    
    # Check if they're set
    echo ""
    echo "📊 Environment check:"
    if [ -n "$NEAR_MASTER_ACCOUNT" ]; then
        echo "   ✅ NEAR_MASTER_ACCOUNT is set: $NEAR_MASTER_ACCOUNT"
    else
        echo "   ❌ NEAR_MASTER_ACCOUNT is NOT set"
    fi
    
    if [ -n "$NEAR_PRIVATE_KEY" ]; then
        echo "   ✅ NEAR_PRIVATE_KEY is set: ${NEAR_PRIVATE_KEY:0:20}..."
    else
        echo "   ❌ NEAR_PRIVATE_KEY is NOT set"
    fi
else
    echo "❌ .env file not found"
fi