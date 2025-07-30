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

### 5. `setup-proxy.js`

**Purpose**: Guides through setting up the 1inch API proxy to handle CORS issues.

**Why we need it**:
- 1inch API requires server-side calls (CORS restriction)
- Vercel provides free, easy proxy hosting
- Interactive setup reduces configuration errors
- Automates proxy URL configuration

**What it does**:
1. Checks for Vercel CLI installation
2. Provides step-by-step deployment instructions
3. Prompts for proxy URL
4. Updates environment configuration automatically

**Usage**: Called by `yarn bootstrap` or manually via `yarn setup:proxy`

---

### 6. `show-logs.js`

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

3. **Update package.json**
   - Add corresponding yarn script
   - Include in bootstrap flow if needed

4. **Handle Errors Gracefully**
   ```javascript
   try {
     // Operation
   } catch (error) {
     spinner.fail(chalk.red('Operation failed'));
     console.log(chalk.yellow('To fix: ...'));
     process.exit(1);
   }
   ```

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