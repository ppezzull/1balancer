#!/bin/bash

echo "🔍 Testing environment variable loading..."
echo ""

# First, show current environment
echo "1. Current environment NEAR variables:"
env | grep NEAR_ || echo "   (none found)"
echo ""

# Load from .env file
if [ -f ".env" ]; then
    echo "2. Loading from .env file..."
    export $(grep -E '^NEAR_' .env 2>/dev/null | grep -v '^#' | xargs)
    
    echo "3. After loading:"
    echo "   NEAR_MASTER_ACCOUNT: ${NEAR_MASTER_ACCOUNT}"
    echo "   NEAR_PRIVATE_KEY: ${NEAR_PRIVATE_KEY:0:20}..."
    echo ""
    
    echo "4. Full environment check:"
    env | grep NEAR_ || echo "   (none found)"
else
    echo "❌ .env file not found!"
fi