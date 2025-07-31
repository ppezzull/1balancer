# Orchestrator Service File Structure

## Complete Directory Structure

```
packages/orchestrator/
├── src/                          # Source code directory
│   ├── index.ts                 # Main application entry point
│   ├── config/                  # Configuration management
│   │   └── index.ts            # Environment config with validation
│   │
│   ├── core/                    # Core business logic components
│   │   ├── SessionManager.ts    # Swap session lifecycle management
│   │   ├── DutchAuctionSimulator.ts  # Price discovery simulation
│   │   ├── SecretManager.ts     # HTLC secret generation/encryption
│   │   └── CrossChainCoordinator.ts  # Atomic swap orchestration
│   │
│   ├── services/               # Infrastructure services
│   │   ├── EventMonitor.ts     # Multi-chain event monitoring
│   │   ├── WebSocketManager.ts # Real-time client communications
│   │   └── MetricsCollector.ts # Prometheus metrics collection
│   │
│   ├── api/                    # REST API implementation
│   │   ├── routes/            # API route handlers
│   │   │   ├── index.ts       # Route setup and mounting
│   │   │   ├── sessions.ts    # Session management endpoints
│   │   │   └── quote.ts       # Price quote endpoints
│   │   │
│   │   └── middleware/        # Express middleware
│   │       ├── authenticate.ts     # API key/JWT authentication
│   │       ├── rateLimiter.ts     # Rate limiting implementation
│   │       ├── validateRequest.ts  # Joi schema validation
│   │       ├── errorHandler.ts    # Global error handling
│   │       └── asyncHandler.ts    # Async route wrapper
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts           # Shared types and interfaces
│   │
│   └── utils/                 # Utility functions
│       ├── logger.ts          # Winston logger configuration
│       └── constants.ts       # Application constants
│
├── tests/                      # Test files
│   ├── setup.ts               # Jest test configuration
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── mocks/                 # Test mocks
│
├── scripts/                    # Utility scripts
│   └── setup.sh              # Development setup script
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── FILE-STRUCTURE.md      # This file
│   ├── USAGE.md              # Usage guide
│   └── WORKFLOWS.md          # Workflow documentation
│
├── config files               # Configuration
├── package.json              # Package dependencies
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest test configuration
├── .env.example              # Environment template
├── Makefile                  # Build automation
└── README.md                 # Main documentation
```

## File Descriptions

### Entry Point

#### `src/index.ts`
Main application entry point that:
- Initializes Express server
- Sets up Socket.IO for WebSocket
- Initializes all core services
- Configures middleware pipeline
- Starts event monitoring
- Handles graceful shutdown

```typescript
// Key initialization flow
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);

// Service initialization
const sessionManager = new SessionManager();
const eventMonitor = new EventMonitor();
// ... etc
```

### Core Components (`src/core/`)

#### `SessionManager.ts`
- **Purpose**: Manages swap session lifecycle
- **Key Classes**: `SessionManager`
- **Interfaces**: `SwapSession`, `SessionStep`, `SessionStatus`
- **Features**:
  - Session creation with unique IDs
  - State machine implementation
  - Secret storage and retrieval
  - Timeout management
  - Session persistence

#### `DutchAuctionSimulator.ts`
- **Purpose**: Simulates Dutch auction pricing
- **Key Classes**: `DutchAuctionSimulator`
- **Interfaces**: `AuctionParams`, `SimulatedQuote`
- **Features**:
  - Market price fetching
  - Urgency-based pricing
  - Price impact calculation
  - Quote history tracking

#### `SecretManager.ts`
- **Purpose**: Manages HTLC secrets securely
- **Key Classes**: `SecretManager`
- **Interfaces**: `SecretPair`, `EncryptedSecret`
- **Features**:
  - 32-byte secret generation
  - AES-256-GCM encryption
  - One-time reveal mechanism
  - Automatic expiration

#### `CrossChainCoordinator.ts`
- **Purpose**: Orchestrates atomic swaps
- **Key Classes**: `CrossChainCoordinator`
- **Features**:
  - Source chain locking
  - Destination chain coordination
  - Secret revelation handling
  - Failure recovery

### Services (`src/services/`)

#### `EventMonitor.ts`
- **Purpose**: Monitors blockchain events
- **Key Classes**: `EventMonitor`
- **Features**:
  - Multi-chain support (BASE, NEAR)
  - Event filtering and processing
  - Reorg protection
  - Retry mechanisms

#### `WebSocketManager.ts`
- **Purpose**: Real-time client communications
- **Key Classes**: `WebSocketManager`
- **Features**:
  - Authenticated connections
  - Channel subscriptions
  - Event broadcasting
  - Connection management

#### `MetricsCollector.ts`
- **Purpose**: Collects performance metrics
- **Key Classes**: `MetricsCollector`
- **Features**:
  - Prometheus-compatible metrics
  - Counters, histograms, gauges
  - Performance tracking
  - Health monitoring

### API Layer (`src/api/`)

#### Routes (`src/api/routes/`)

##### `index.ts`
- Route setup and mounting
- Service injection
- API versioning

##### `sessions.ts`
- **Endpoints**:
  - `POST /` - Create swap session
  - `GET /:sessionId` - Get session status
  - `POST /:sessionId/execute` - Execute swap
  - `POST /:sessionId/cancel` - Cancel session
  - `GET /` - List sessions (admin)

##### `quote.ts`
- **Endpoints**:
  - `POST /` - Get swap quote
  - `GET /history` - Quote history
  - `GET /pairs` - Supported pairs

#### Middleware (`src/api/middleware/`)

##### `authenticate.ts`
- API key validation
- JWT token verification
- Request authentication

##### `rateLimiter.ts`
- Request rate limiting
- Per-IP and per-key limits
- Custom rate limit rules

##### `validateRequest.ts`
- Joi schema validation
- Request body validation
- Query parameter validation

##### `errorHandler.ts`
- Global error handling
- Error response formatting
- Logging integration

### Configuration (`src/config/`)

#### `index.ts`
- Environment variable loading
- Configuration validation
- Default values
- Type-safe config object

```typescript
interface Config {
  env: string;
  port: number;
  chains: ChainConfig;
  security: SecurityConfig;
  // ... etc
}
```

### Types (`src/types/`)

#### `index.ts`
- Shared TypeScript interfaces
- Common type definitions
- Error classes
- Constants as types

### Utilities (`src/utils/`)

#### `logger.ts`
- Winston logger setup
- Log formatting
- Multiple transports
- Child logger creation

#### `constants.ts`
- Application constants
- Chain IDs
- Token addresses
- Error codes
- Timeout values

## Configuration Files

### `package.json`
- Dependencies management
- Script definitions
- Package metadata

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  }
}
```

### `tsconfig.json`
- TypeScript compiler options
- Module resolution
- Build configuration
- Type checking rules

### `.env.example`
- Environment template
- Required variables
- Example values
- Documentation comments

### `Makefile`
- Build automation
- Common commands
- Development helpers
- Deployment tasks

## Test Structure (`tests/`)

### `setup.ts`
- Jest configuration
- Global test setup
- Mock definitions
- Test utilities

### Test Organization
```
tests/
├── unit/
│   ├── core/
│   │   ├── SessionManager.test.ts
│   │   └── SecretManager.test.ts
│   ├── services/
│   └── api/
│
└── integration/
    ├── swapFlow.test.ts
    └── apiEndpoints.test.ts
```

## Documentation (`docs/`)

### `ARCHITECTURE.md`
- System design
- Component interactions
- Data flow
- Security model

### `USAGE.md`
- API documentation
- Integration examples
- Configuration guide
- Troubleshooting

### `WORKFLOWS.md`
- Swap execution flow
- Event processing
- Error handling
- Monitoring setup

## File Naming Conventions

1. **TypeScript Files**: PascalCase for classes/components
   - `SessionManager.ts`
   - `DutchAuctionSimulator.ts`

2. **Route Files**: camelCase
   - `sessions.ts`
   - `quote.ts`

3. **Config Files**: lowercase with dots
   - `jest.config.js`
   - `.env.example`

4. **Documentation**: UPPERCASE with hyphens
   - `ARCHITECTURE.md`
   - `FILE-STRUCTURE.md`

## Import Structure

Standard import order:
```typescript
// 1. External dependencies
import express from 'express';
import { ethers } from 'ethers';

// 2. Internal absolute imports
import { config } from '../config';
import { logger } from '../utils/logger';

// 3. Relative imports
import { SessionManager } from './SessionManager';

// 4. Types
import type { SwapSession } from '../types';
```

## Build Output

After building (`yarn build`):
```
dist/
├── index.js
├── config/
├── core/
├── services/
├── api/
├── types/
└── utils/
```

The `dist/` directory mirrors the `src/` structure with compiled JavaScript.