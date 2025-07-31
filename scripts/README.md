# 1Balancer Scripts Directory

This directory contains helper scripts that power the bootstrap infrastructure and development workflow for the 1Balancer ecosystem.

## Overview

These Node.js scripts provide the underlying functionality for the yarn commands defined in the root `package.json`.
They handle system checks, environment setup, service management, and cross-chain orchestration.

## Scripts Documentation

### 1. `check-dependencies.js`

**Purpose**: Verifies that all required system dependencies are installed before setup.

**Why we need it**: 
- Prevents cryptic errors during bootstrap by checking prerequisites upfront
- Ensures consistent development environment across all contributors
- Provides clear installation instructions for missing dependencies

**What it checks**:
- Node.js >= 20.18.3
- Yarn >= 3.2.3
- Git (for submodule management)
- Curl (for downloading Rust)
- Rust 1.86.0 (optional, will be installed if missing)

**Usage**: Called automatically by `yarn bootstrap` or manually via `yarn check:deps`

---

### 2. `setup-rust.js`

**Purpose**: Installs and configures Rust toolchain specifically for NEAR Protocol development.

**Why we need it**:
- NEAR smart contracts require Rust with WASM target
- Ensures exact version (1.86.0) for compatibility
- Automates the complex Rust setup process
- Installs NEAR-specific tools (cargo-near, near-cli)

**What it does**:
1. Downloads and installs rustup if not present
2. Sets Rust version to exactly 1.86.0
3. Adds wasm32-unknown-unknown target
4. Installs cargo-near for contract compilation
5. Installs near-cli for blockchain interaction

**Usage**: Called by `yarn bootstrap` or manually via `yarn setup:rust`

---

### 3. `create-env-files.js`

**Purpose**: Manages environment configuration using a centralized inheritance model.

**Why we need it**:
- Maintains single source of truth (root `.env.example`)
- Prevents hardcoded secrets in code
- Creates package-specific env files that inherit from root
- Validates required configuration values
- Guides users through missing setup steps

**What it does**:
1. Copies `.env.example` to `.env` if it doesn't exist
2. Reads values from root `.env`
3. Creates package-specific `.env` files with inherited values
4. Checks for missing required keys
5. Provides setup instructions for each missing key

**Usage**: Called by `yarn bootstrap` or manually via `yarn create:envs`

---

### 4. `check-status.js`

**Purpose**: Monitors the health of all services in the 1Balancer ecosystem.

**Why we need it**:
- Quick visibility into what's running
- Helps debug connection issues
- Verifies successful bootstrap
- Provides service URLs at a glance

**What it checks**:
- Frontend (Next.js) on port 3000
- Hardhat blockchain on port 8545
- Orchestrator API on port 8080
- NEAR Bridge on port 8090
- Optional services (NEAR local, Solver)

**Usage**: Run `yarn status` or `yarn st` to check all services

---

### 5. `generate-proxy.js`

**Purpose**: Generates a complete Vercel proxy project containing the **exact code** from the official 1inch Vercel proxy repository.

**Why we need it**:
- Eliminates need to manually clone `Tanz0rz/1inch-vercel-proxy` repository
- Bundles the exact official proxy code as templates for automated deployment
- Creates identical project structure to the official repository
- Ensures 100% compatibility with official 1inch proxy implementation

**What it does**:
1. Creates complete Vercel project structure in specified directory
2. Generates `api/proxy.js` with **exact code** from official repository
3. Creates `vercel.json` with **exact configuration** from official repository
4. Uses correct environment variable names (`API_AUTH_TOKEN`, `ALLOWED_ORIGIN`)
5. Includes proper documentation and project metadata

**Exact Code Implementation**:
- **Source**: `https://github.com/Tanz0rz/1inch-vercel-proxy`
- **File Structure**: `api/proxy.js` + `vercel.json` (exactly as official repo)
- **Environment Variables**: `API_AUTH_TOKEN` (exactly as official repo)
- **CORS Logic**: Exact localhost detection and origin validation
- **Error Handling**: Identical error messages and status codes

**Key Features**:
- **Zero deviation** from official 1inch proxy implementation
- **Exact file structure** and naming conventions
- **Identical CORS handling** for production security
- **Same authentication flow** using Bearer tokens
- **Complete project scaffolding** ready for Vercel deployment

**Usage**: Called by `setup-proxy.js` or manually: `node generate-proxy.js <output-dir>`

---

### 6. `setup-proxy.js`

**Purpose**: Automated deployment of the **exact official 1inch Vercel proxy** to Vercel with zero configuration.

**Why we need it**:
- 1inch API requires server-side calls (CORS restriction)  
- Automates deployment of the exact official proxy implementation
- Handles authentication and environment configuration using official variable names
- Eliminates manual cloning and setup of `Tanz0rz/1inch-vercel-proxy`

**What it does**:
1. Checks for existing proxy deployment
2. Installs Vercel CLI if needed
3. Handles interactive API key collection
4. Generates proxy project using **exact official code** via `generate-proxy.js`
5. Deploys to Vercel with correct environment variables (`API_AUTH_TOKEN`)
6. Updates local environment files with deployed URL
7. Tests deployed proxy functionality
8. Cleans up temporary files

**Official Repository Compatibility**:
- Uses exact environment variable names from official repo
- Deploys identical `api/proxy.js` and `vercel.json` files
- Maintains same CORS and security behavior
- Produces functionally identical deployment to manual process

**Key Features**:
- **Zero-configuration deployment** of official 1inch proxy
- **Exact compatibility** with `Tanz0rz/1inch-vercel-proxy`
- **Automatic Vercel CLI installation** and authentication
- **Environment file auto-updating** with deployed URL
- **Built-in deployment testing** for validation
- **Error recovery and troubleshooting** with specific guidance

**Usage**: Called by `yarn bootstrap` or manually via `yarn setup:proxy` / `yarn proxy:deploy`

---

### 7. `test-proxy.js`

**Purpose**: Validates deployed 1inch API proxy functionality and performance, ensuring compatibility with the official proxy behavior.

**Why we need it**:
- Ensures the deployed proxy works identically to the official implementation
- Verifies CORS headers match official proxy configuration
- Tests key 1inch API endpoints through our deployed proxy
- Validates authentication flow using `API_AUTH_TOKEN`
- Provides performance metrics and health checks

**What it does**:
1. Tests multiple 1inch API endpoints (tokens, status, price, protocols)
2. Validates CORS headers match official proxy implementation
3. Measures response times and error rates
4. Checks authentication with 1inch API using correct token format
5. Provides detailed test results and troubleshooting guidance

**Test Coverage**:
- **Token list endpoint** (`/tokens/v1.1/1`)
- **Chain status endpoint** (`/status/v1.0/1`)
- **Protocol list endpoint** (`/liquidity-sources/v1.2/1`)
- **Price check endpoint** (`/price/v1.1/1`)
- **CORS preflight requests** (OPTIONS method)
- **Error handling scenarios** and edge cases

**Official Proxy Validation**:
- Tests exact same endpoints as official proxy documentation
- Validates CORS behavior matches official implementation
- Checks authentication flow using official environment variables
- Ensures response format compatibility with official proxy

**Usage**: Called automatically by `setup-proxy.js` or manually via `yarn proxy:test` / `node test-proxy.js <proxy-url>`

---

### 8. `show-logs.js`

**Purpose**: Displays logs from all running services for debugging.

**Why we need it**:
- Consolidated view of all service logs
- Helps debug startup issues
- Monitors service health during development
- Supports different deployment modes (direct process, Docker, PM2)

**What it does**:
- Detects deployment mode (Docker, PM2, or direct)
- Shows appropriate logs based on deployment
- Provides real-time log streaming
- Handles graceful exit on Ctrl+C

**Usage**: Run `yarn logs` to view all service logs

---

## Design Principles

### 1. **No Hardcoded Values**
All configuration comes from environment variables, never hardcoded in scripts.

### 2. **User-Friendly Output**
- Colored output with chalk for clarity
- Spinners with ora for progress indication
- Clear error messages with solutions

### 3. **Idempotent Operations**
Scripts can be run multiple times safely, skipping already completed steps.

### 4. **Cross-Platform Support**
Written in Node.js for consistency across Windows, macOS, and Linux.

### 5. **Error Recovery**
Scripts provide clear guidance when something fails, with specific fix instructions.

## Adding New Scripts

When adding a new script:

1. **Follow the Pattern**
   - Use chalk for colors
   - Use ora for spinners
   - Check prerequisites first
   - Provide clear error messages

2. **Document in This File**
   - Explain the purpose
   - Describe why it's needed
   - List what it does
   - Show usage examples

3. **Update All Relevant README Files**
   - Update `scripts/README.md` (this file)
   - Update root `README.md` if it affects user workflow
   - Update any documentation in `docs/` directory
   - Update `BOOTSTRAP-INFRASTRUCTURE.md` if part of bootstrap flow

4. **Update package.json**
   - Add corresponding yarn script
   - Include in bootstrap flow if needed

5. **Handle Errors Gracefully**
   ```javascript
   try {
     // Operation
   } catch (error) {
     spinner.fail(chalk.red('Operation failed'));
     console.log(chalk.yellow('To fix: ...'));
     process.exit(1);
   }
   ```

6. **Always Update Documentation**
   - This is a MANDATORY step for all script changes
   - Include the script in relevant workflow documentation
   - Update troubleshooting guides if the script can fail
   - Add examples and use cases

## Script Dependencies

All scripts use these common dependencies:
- `chalk`: Terminal colors
- `ora`: Spinner/progress indicators
- `fs`: File system operations
- `path`: Path manipulation
- `child_process`: System command execution
- `dotenv`: Environment variable management

## Maintenance

- Keep scripts focused on single responsibilities
- Update this README when modifying scripts
- Test scripts on fresh installations
- Ensure scripts work in CI/CD environments