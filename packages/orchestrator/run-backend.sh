#!/bin/bash
# Script to run backend with proper termination

# Kill any existing process on port 8080
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start the backend
cd "$(dirname "$0")"
exec yarn dev