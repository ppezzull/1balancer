# Test Environment Configuration

## Overview

The orchestrator service uses an automated `.env.test` generation system that inherits values from the root `.env` file while providing test-specific overrides.

## Automated .env.test Generation

### How it Works

1. **Source**: The root project's `.env` file serves as the source of truth
2. **Generation**: The `scripts/create-env-files.js` script automatically creates `.env.test` with test-appropriate values
3. **Loading**: Test setup (`tests/setup.ts`) loads `.env.test` before running tests

### Generation Process

```bash
# Automatic generation (runs before tests)
npm test                    # Triggers pretest script
npm run setup:env           # Manual generation

# From project root
node scripts/create-env-files.js
```

### Configuration Differences

The `.env.test` file differs from production `.env` in these ways:

| Setting | Production | Test | Reason |
|---------|------------|------|---------|
| `NODE_ENV` | `development` | `test` | Test environment |
| `LOG_LEVEL` | `debug` | `error` | Reduce noise |
| `API_KEY_SECRET` | Secure value | `test-api-key-secret` | Predictable for tests |
| `SESSION_TIMEOUT_SECONDS` | `7200` | `300` | Faster test execution |
| `BLOCK_POLLING_INTERVAL` | `5000` | `1000` | Faster polling |
| `METRICS_ENABLED` | `true` | `false` | No metrics collection |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | `1000` | Relaxed for tests |

## Test Environment Variables

### Service Configuration
```bash
NODE_ENV=test
PORT=8080
WS_PORT=8081
LOG_LEVEL=error
```

### Network Configuration
- Uses testnets (BASE Sepolia, NEAR testnet)
- Inherits RPC URLs from root `.env`
- Falls back to public endpoints if not configured

### Security
- Test-specific API keys and secrets
- Predictable values for test assertions
- No real authentication required

### Timeouts & Performance
- Shorter session timeouts (5 minutes vs 2 hours)
- Faster blockchain polling (1s vs 5s)
- Relaxed rate limits for test execution

## File Structure

```
packages/orchestrator/
├── .env.test              # Auto-generated test config
├── tests/
│   ├── setup.ts          # Loads .env.test
│   └── integration/
│       └── *.test.js     # Integration tests
└── package.json          # pretest script
```

## Usage

### Running Tests

From the project root using yarn workspaces:

```bash
# Unit tests (auto-generates .env.test)
yarn workspace @1balancer/orchestrator test

# Integration tests
yarn workspace @1balancer/orchestrator test:integration

# All tests
yarn workspace @1balancer/orchestrator test:all

# Watch mode
yarn workspace @1balancer/orchestrator test:watch
```

Or from the orchestrator package directory:

```bash
cd packages/orchestrator

# Unit tests (auto-generates .env.test)
yarn test

# Integration tests
yarn test:integration

# All tests
yarn test:all

# Watch mode 
yarn test:watch
```

### Manual Environment Setup

```bash
# From project root
yarn workspace @1balancer/orchestrator setup:env

# Or from orchestrator directory
cd packages/orchestrator && yarn setup:env

# Force regeneration from project root
node scripts/create-env-files.js --force
```

### Test Configuration Override

If you need to override specific test values, you can:

1. **Modify the generation script** (`scripts/create-env-files.js`)
2. **Set environment variables** before running tests:
   ```bash
   REDIS_URL=redis://test-redis:6379 npm test
   ```

## Troubleshooting

### .env.test Not Found
```bash
# Generate it manually
yarn setup:env
```

### Test Values Not Loading
1. Check that `tests/setup.ts` loads `.env.test`
2. Verify `.env.test` exists in the orchestrator package
3. Run with debug logging: `LOG_LEVEL=debug yarn test`

### Wrong Environment Values
1. Update root `.env` with correct values
2. Regenerate test config: `yarn setup:env`
3. Or use `--force` flag to overwrite existing

## Benefits

1. **Consistency**: All environments derive from single source
2. **Automation**: No manual test configuration maintenance
3. **Isolation**: Test values don't interfere with development
4. **Speed**: Optimized timeouts and polling for fast test execution
5. **Reliability**: Predictable values for stable test assertions

## Integration with CI/CD

The automated generation ensures tests work in any environment:

```yaml
# GitHub Actions example
- name: Run tests
  run: yarn workspace @1balancer/orchestrator test  # Automatically generates .env.test
  env:
    ALCHEMY_API_KEY: ${{ secrets.ALCHEMY_API_KEY }}
```

The system inherits production secrets from CI environment variables while maintaining test-specific optimizations.


---


  1. ✅ Extended the existing .env copying mechanism from scripts/create-env-files.js
  2. ✅ Added orchestrator .env.test generation with test-specific optimizations
  3. ✅ Updated package.json to use yarn instead of npm
  4. ✅ Added pretest script that automatically generates .env.test before running tests
  5. ✅ Updated test setup to load .env.test automatically
  6. ✅ Documented the complete system in docs/TESTING-ENV.md

Key Features:

  1. Dynamic Configuration: All values from config files
  2. Real Token Testing: Fork tests with actual BASE mainnet
  3. Complete Coverage: Unit, integration, and E2E tests
  4. Performance Testing: Load tests and concurrent operations
  5. Health Monitoring: Coverage tracking and recommendations

  Test Commands:

  # Run all tests
  yarn test:all

  # Specific test suites
  yarn test:unit          # All unit tests
  yarn test:integration   # Integration tests
  yarn test:fork         # Fork testing
  yarn test:health       # Health check
  yarn test:coverage     # Coverage report