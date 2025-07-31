# Scripts and Automation Documentation

## Table of Contents
1. [Package.json Scripts](#packagejson-scripts)
2. [Makefile Commands](#makefile-commands)
3. [Shell Scripts](#shell-scripts)
4. [Development Scripts](#development-scripts)
5. [Build and Deployment Scripts](#build-and-deployment-scripts)
6. [Testing Scripts](#testing-scripts)
7. [Utility Scripts](#utility-scripts)

## Package.json Scripts

### Core Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  }
}
```

### Script Descriptions

#### `yarn dev`
- **Purpose**: Start development server with hot reload
- **Uses**: nodemon for file watching, ts-node for TypeScript execution
- **Environment**: Development mode with debug logging
- **Usage**: Primary development command

```bash
# Start development server
yarn dev

# What it does:
# 1. Watches all .ts files in src/
# 2. Restarts server on file changes
# 3. Runs TypeScript directly without compilation
# 4. Enables source maps for debugging
```

#### `yarn build`
- **Purpose**: Compile TypeScript to JavaScript
- **Output**: Creates `dist/` directory with compiled code
- **Configuration**: Uses tsconfig.json settings
- **Usage**: Pre-production build

```bash
# Build for production
yarn build

# Output structure:
dist/
├── index.js
├── index.js.map
├── index.d.ts
├── config/
├── core/
├── services/
└── api/
```

#### `yarn start`
- **Purpose**: Run production server
- **Requires**: Built files in `dist/`
- **Environment**: Production optimizations
- **Usage**: Production deployment

```bash
# Must build first
yarn build

# Then start production server
yarn start
```

#### `yarn test`
- **Purpose**: Run test suite
- **Framework**: Jest with ts-jest
- **Coverage**: Generates coverage reports
- **Usage**: CI/CD and pre-commit

```bash
# Run all tests
yarn test

# Run with coverage
yarn test --coverage

# Run specific test file
yarn test SessionManager.test.ts

# Run tests matching pattern
yarn test --testNamePattern="should create session"
```

#### `yarn test:watch`
- **Purpose**: Run tests in watch mode
- **Features**: Re-runs tests on file changes
- **Usage**: TDD development

```bash
# Start test watcher
yarn test:watch

# Interactive commands:
# Press 'p' to filter by filename
# Press 't' to filter by test name
# Press 'q' to quit
```

#### `yarn lint`
- **Purpose**: Run ESLint on TypeScript files
- **Configuration**: Uses .eslintrc settings
- **Usage**: Code quality enforcement

```bash
# Run linter
yarn lint

# Auto-fix issues
yarn lint --fix

# Lint specific directory
yarn lint src/core
```

#### `yarn typecheck`
- **Purpose**: Type check without building
- **Fast**: No emit, only type validation
- **Usage**: Pre-commit validation

```bash
# Check types
yarn typecheck

# What it checks:
# - Type errors
# - Missing types
# - Incorrect interfaces
# - Import issues
```

## Makefile Commands

### Complete Makefile Reference

```makefile
# Development Commands
make dev          # Start development server
make test         # Run test suite
make lint         # Run linter
make typecheck    # Type checking
make format       # Format code

# Production Commands
make build        # Build for production
make start        # Start production server
make check-env    # Validate environment

# Docker Commands
make docker-build # Build Docker image
make docker-run   # Run Docker container

# Utility Commands
make clean        # Clean build artifacts
make logs         # Tail logs
make setup        # Initial setup
make health       # Health check
make metrics      # Monitor metrics
```

### Detailed Command Documentation

#### Development Commands

##### `make dev`
```bash
make dev
# Equivalent to: yarn dev
# Starts development server with hot reload
```

##### `make test`
```bash
make test
# Runs full test suite
# Includes unit and integration tests

# Run specific test
make test-file FILE=SessionManager.test.ts
```

##### `make format`
```bash
make format
# Formats all TypeScript files using Prettier
# Enforces consistent code style

make format-check
# Checks formatting without changing files
```

#### Production Commands

##### `make build`
```bash
make build
# Compiles TypeScript to JavaScript
# Outputs to dist/ directory
# Includes source maps and type definitions
```

##### `make check-env`
```bash
make check-env
# Validates environment configuration
# Checks for required variables
# Warns about insecure defaults
```

#### Docker Commands

##### `make docker-build`
```bash
make docker-build
# Builds Docker image with tag 1balancer/orchestrator:latest
# Uses multi-stage build for optimization
# Includes only production dependencies
```

##### `make docker-run`
```bash
make docker-run
# Runs Docker container
# Maps port 8080
# Uses .env file for configuration
# Runs in detached mode
```

#### Utility Commands

##### `make clean`
```bash
make clean
# Removes:
# - dist/ directory
# - node_modules/
# - logs/
# - coverage/
```

##### `make setup`
```bash
make setup
# One-time setup command
# - Installs dependencies
# - Creates .env from template
# - Sets up directories
# - Checks prerequisites
```

##### `make health`
```bash
make health
# Performs health check
# Exits with code 0 if healthy
# Useful for monitoring scripts
```

##### `make metrics`
```bash
make metrics
# Monitors Prometheus metrics
# Updates every 5 seconds
# Shows key performance indicators
```

## Shell Scripts

### setup.sh

Located at: `scripts/setup.sh`

```bash
#!/bin/bash
# Development environment setup script

# Features:
# - Node.js version check (requires 18+)
# - Dependency installation
# - Environment file creation
# - Directory structure setup
# - Optional dependency checks

# Usage:
./scripts/setup.sh

# What it does:
# 1. Validates Node.js version
# 2. Installs yarn if missing
# 3. Runs yarn install
# 4. Creates .env from template
# 5. Creates required directories
# 6. Checks Redis availability
```

### Advanced Setup Options

```bash
# Skip dependency installation
SKIP_INSTALL=1 ./scripts/setup.sh

# Force recreation of .env
FORCE_ENV=1 ./scripts/setup.sh

# Quiet mode
QUIET=1 ./scripts/setup.sh
```

## Development Scripts

### Hot Reload Configuration

```json
// nodemon.json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts"],
  "exec": "ts-node -r dotenv/config",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Debug Scripts

```json
// package.json debug scripts
{
  "scripts": {
    "debug": "node --inspect -r ts-node/register -r dotenv/config src/index.ts",
    "debug:break": "node --inspect-brk -r ts-node/register -r dotenv/config src/index.ts"
  }
}
```

Usage:
```bash
# Start with debugger
yarn debug

# Start with breakpoint
yarn debug:break

# Attach VS Code debugger
# Use launch.json configuration
```

### Watch Scripts

```bash
# Watch and rebuild on changes
tsc --watch

# Watch and run tests
yarn test:watch

# Watch logs
tail -f logs/development.log | grep ERROR
```

## Build and Deployment Scripts

### Production Build Script

```bash
#!/bin/bash
# build-prod.sh

# Clean previous build
rm -rf dist/

# Type check
yarn typecheck || exit 1

# Run tests
yarn test || exit 1

# Build
yarn build

# Verify build
if [ ! -d "dist" ]; then
  echo "Build failed: dist directory not created"
  exit 1
fi

echo "Build successful!"
```

### Docker Build Script

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN yarn install
COPY src ./src
RUN yarn build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --production
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

### Deployment Script

```bash
#!/bin/bash
# deploy.sh

# Build and tag
docker build -t 1balancer/orchestrator:$VERSION .
docker tag 1balancer/orchestrator:$VERSION 1balancer/orchestrator:latest

# Push to registry
docker push 1balancer/orchestrator:$VERSION
docker push 1balancer/orchestrator:latest

# Deploy to server
ssh $DEPLOY_SERVER << EOF
  docker pull 1balancer/orchestrator:latest
  docker stop orchestrator || true
  docker rm orchestrator || true
  docker run -d \
    --name orchestrator \
    -p 8080:8080 \
    --env-file /etc/1balancer/orchestrator.env \
    --restart unless-stopped \
    1balancer/orchestrator:latest
EOF
```

## Testing Scripts

### Test Coverage Script

```bash
# coverage.sh
#!/bin/bash

# Run tests with coverage
yarn test --coverage --coverageReporters=text-lcov > coverage.lcov

# Check coverage thresholds
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
THRESHOLD=80

if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
  echo "Coverage $COVERAGE% is below threshold $THRESHOLD%"
  exit 1
fi

echo "Coverage $COVERAGE% meets threshold"
```

### Integration Test Script

```bash
# test-integration.sh
#!/bin/bash

# Start test dependencies
docker-compose -f docker-compose.test.yml up -d

# Wait for services
sleep 5

# Run integration tests
yarn test --testPathPattern=integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

### E2E Test Script

```bash
# test-e2e.sh
#!/bin/bash

# Start all services
yarn build
pm2 start dist/index.js --name orchestrator-test

# Wait for service
until curl -f http://localhost:8080/health; do
  sleep 1
done

# Run E2E tests
yarn test:e2e

# Cleanup
pm2 delete orchestrator-test
```

## Utility Scripts

### Log Analysis Script

```bash
#!/bin/bash
# analyze-logs.sh

# Error frequency
echo "=== Error Frequency ==="
grep ERROR logs/*.log | awk '{print $5}' | sort | uniq -c | sort -nr | head -10

# Response times
echo "=== API Response Times ==="
grep "API latency" logs/*.log | awk '{print $NF}' | sort -n | awk '
  BEGIN {count=0; sum=0;}
  {count++; sum+=$1; values[count]=$1;}
  END {
    print "Count:", count;
    print "Average:", sum/count, "ms";
    print "P50:", values[int(count*0.5)], "ms";
    print "P95:", values[int(count*0.95)], "ms";
  }'

# Active sessions over time
echo "=== Active Sessions ==="
grep "active_swaps" logs/*.log | tail -100 | awk '{print $1, $NF}'
```

### Database Migration Script

```bash
#!/bin/bash
# migrate.sh

# For Redis state migration
echo "Backing up Redis..."
redis-cli --rdb backup.rdb

echo "Running migrations..."
node scripts/migrations/v1-to-v2.js

echo "Verifying migration..."
node scripts/migrations/verify.js
```

### Performance Profiling Script

```bash
#!/bin/bash
# profile.sh

# Start with profiling
node --prof dist/index.js &
PID=$!

# Run load test
artillery quick -d 60 -r 10 http://localhost:8080/api/v1/health

# Stop server
kill $PID

# Process profile
node --prof-process isolate-*.log > profile.txt
echo "Profile saved to profile.txt"
```

### Health Check Script

```bash
#!/bin/bash
# healthcheck.sh

# Function to check service
check_service() {
  local url=$1
  local name=$2
  
  if curl -f -s "$url" > /dev/null; then
    echo "✅ $name is healthy"
    return 0
  else
    echo "❌ $name is unhealthy"
    return 1
  fi
}

# Check all services
check_service "http://localhost:8080/health" "Orchestrator"
check_service "http://localhost:3000" "Frontend"
check_service "http://localhost:8545" "Hardhat"

# Check connections
HEALTH=$(curl -s http://localhost:8080/health | jq -r '.connections')
echo "Connections: $HEALTH"
```

### Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup logs
tar -czf $BACKUP_DIR/logs.tar.gz logs/

# Backup Redis state (if used)
if [ -n "$REDIS_URL" ]; then
  redis-cli --rdb $BACKUP_DIR/redis.rdb
fi

# Backup configuration
cp .env $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR"
```

## Script Best Practices

### Error Handling

```bash
#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Trap errors
trap 'echo "Error on line $LINENO"' ERR

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
```

### Logging

```bash
# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a script.log
}

log "Starting deployment..."
```

### Environment Variables

```bash
# Load environment
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Validate required vars
: ${BASE_RPC_URL:?Variable not set}
: ${NEAR_RPC_URL:?Variable not set}
```

### Idempotency

```bash
# Make scripts idempotent
mkdir -p logs 2>/dev/null || true
rm -f dist/* 2>/dev/null || true

# Check if already running
if pgrep -f "orchestrator" > /dev/null; then
  echo "Orchestrator already running"
  exit 0
fi
```