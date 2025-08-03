#!/bin/bash

# Set a lower file watcher limit for this session
echo 8192 > /proc/sys/fs/inotify/max_user_watches 2>/dev/null || true

# Run hardhat node with fork
echo "Starting Hardhat node with Base mainnet fork..."
npx hardhat node --network hardhat --fork https://mainnet.base.org 