#!/bin/bash

# Load NEAR credentials from root .env file
if [ -f ".env" ]; then
    # Export all NEAR variables
    export $(grep -E '^NEAR_' .env 2>/dev/null | grep -v '^#' | xargs)
    
    echo "🔍 Loaded NEAR credentials:"
    echo "   NEAR_MASTER_ACCOUNT: ${NEAR_MASTER_ACCOUNT}"
    echo "   NEAR_PRIVATE_KEY: ${NEAR_PRIVATE_KEY:0:20}..." # Show only first 20 chars for security
fi

# Change to orchestrator directory
cd packages/orchestrator

# Run the orchestrator with environment variables
exec yarn dev