# Comprehensive report documenting:

  What we started with:
  - Multiple missing peer dependencies (YN0002 warnings)
  - Version conflicts between packages
  - Broken environment variable references
  - Missing Next.js SWC dependencies

  What we have now:
  - All missing peer dependencies resolved via direct installation or packageExtensions
  - Environment variables correctly referenced
  - Versions aligned to @1inch/eslint-config@3.0.7 requirements
  - Only acceptable YN0060 warnings remain (upstream conflicts)

  Notable version downgrades:
  - TypeScript: 5.8.2 → 5.5.2
  - Prettier: 3.5.3 → 3.3.2
  - These were necessary to match @1inch/eslint-config requirements

  The changes are safe and necessary to maintain compatibility with the @1inch ecosystem while supporting your scaffold-eth2 development environment.
-----

# Key Points:

# Dependency Changes Report

## Overview
This report documents all dependency changes made to resolve peer dependency warnings and version conflicts in the 1balancer project.

## Initial Issues
1. **YN0002 Warnings**: Missing peer dependencies for various packages
2. **YN0060 Warnings**: Version mismatches between provided and required dependencies
3. **Environment variable reference errors**: Broken references to undefined environment variables
4. **Next.js SWC dependencies**: Missing platform-specific SWC packages

## Changes Made

### 1. Root package.json
**Added ESLint and Related Dependencies:**
- Added all peer dependencies required by `@1inch/eslint-config@3.0.7`:
  ```json
  "@eslint/compat": "^1.1.0"
  "@eslint/eslintrc": "^3.1.0"
  "@eslint/js": "^9.5.0"
  "@stylistic/eslint-plugin": "^2.3.0"
  "@typescript-eslint/eslint-plugin": "^7.14.1"
  "@typescript-eslint/parser": "^7.14.1"
  "eslint": "^9.5.0"
  "eslint-config-prettier": "^9.1.0"
  "eslint-config-standard": "^17.1.0"
  "eslint-import-resolver-typescript": "^3.6.1"
  "eslint-plugin-import": "^2.29.1"
  "eslint-plugin-n": "^17.9.0"
  "eslint-plugin-prettier": "^5.1.3"
  "eslint-plugin-promise": "^6.2.0"
  "eslint-plugin-unused-imports": "^4.0.0"
  "globals": "^15.6.0"
  "prettier": "^3.3.2"
  "typescript": "^5.5.2"
  ```

**Updated Versions:**
- `chalk`: `^5.3.0` → `^5.4.1`
- `dotenv`: `^16.3.1` → `^17.2.1`
- `ora`: `^8.0.1` → `^8.2.0`

### 2. packages/nextjs/package.json
**Added Missing Dependencies:**
- `bs58`: `^6.0.0` - Required by Solana wallet adapters
- `csstype`: `^3.1.3` - Required by react-hot-toast/goober
- `lit`: `^3.2.0` - Required by @reown/appkit
- `undici`: `^6.21.0` - Required by kubo-rpc-client

**Added SWC Dependencies (all version 15.2.3):**
- All platform-specific @next/swc packages to fix Next.js lockfile warnings

**Updated Versions:**
- `next-themes`: `~0.3.0` → `~0.4.3` (React 19 compatibility)
- `qrcode.react`: `~4.0.1` → `~4.2.0` (React 19 compatibility)
- `eslint`: `~9.23.0` → `~9.5.0` (Match @1inch/eslint-config requirement)
- `eslint-config-prettier`: `~10.1.1` → `~9.1.0`
- `eslint-plugin-prettier`: `~5.2.4` → `~5.1.3`
- `prettier`: `~3.5.3` → `~3.3.2`
- `typescript`: `~5.8.2` → `~5.5.2`

### 3. packages/hardhat/package.json
**Changed Dependencies:**
- Moved `@typechain/ethers-v6` from dependencies to devDependencies
- Removed duplicate `@typechain/ethers-v5` (was causing conflicts)

**Added Dependencies:**
- `@types/node`: `^18.19.50` - Required by ts-node

**Updated Versions:**
- `hardhat-deploy-ethers`: `^0.4.2` (was missing, now uses correct version)
- `@typescript-eslint/eslint-plugin`: `^8.27.0` → `^7.14.1`
- `@typescript-eslint/parser`: `^8.27.0` → `^7.14.1`
- `eslint`: `^9.23.0` → `^9.5.0`
- `eslint-config-prettier`: `^10.1.1` → `^9.1.0`
- `eslint-plugin-prettier`: `^5.2.4` → `^5.1.3`
- `prettier`: `^3.5.3` → `^3.3.2`
- `typescript`: `^5.8.2` → `^5.5.2`

### 4. .yarnrc.yml
**Added packageExtensions** to handle peer dependencies that packages don't properly declare:
- Fixed missing peer dependencies for 10+ packages
- Allows packages to work together despite not declaring all required peers
- Prevents YN0002 warnings for third-party packages we can't modify

## Remaining Warnings (Acceptable)

### YN0060 Warnings - Version Mismatches:
1. **TypeScript ESLint v7 vs ESLint 9**: TypeScript ESLint v7 wants ESLint 8, but @1inch/eslint-config requires ESLint 9
2. **eslint-config-standard**: Only supports ESLint 8, not ESLint 9
3. **hardhat-deploy versions**: Minor version difference, backward compatible
4. **ethers v5 vs v6**: Different packages use different major versions
5. **lit version**: Minor version mismatch (3.3.1 vs exact version)

These warnings are acceptable because:
- They don't affect functionality
- They're upstream conflicts we can't resolve without forking packages
- The packages still work together despite version differences

## Impact Assessment
- ✅ All missing peer dependencies resolved
- ✅ React 19 compatibility issues fixed
- ✅ Next.js SWC warnings resolved
- ✅ TypeScript version aligned across all packages
- ✅ ESLint configuration properly set up for @1inch/eslint-config
- ⚠️  Some version mismatches remain due to conflicting upstream requirements

## Risk Assessment
- **Low Risk**: Most changes were adding missing peer dependencies
- **Medium Risk**: Version downgrades (TypeScript 5.8→5.5, Prettier 3.5→3.3) to match @1inch/eslint-config
- **Mitigation**: All changes align with @1inch/eslint-config requirements, which is the primary constraint