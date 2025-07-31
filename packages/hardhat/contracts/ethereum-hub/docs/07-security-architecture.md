# Security Architecture

## Overview

The Ethereum Hub implements multiple layers of security to ensure safe cross-chain atomic swaps.
This document details the security measures, threat model, and mitigation strategies.

## Threat Model

### 1. Cross-Chain Threats

**Threat**: Asymmetric execution where one chain executes but the other doesn't

**Mitigation**:
- Hashlock ensures both parties must know the secret
- Timelock coordination prevents race conditions
- Atomic design: all-or-nothing execution

### 2. Front-Running Attacks

**Threat**: MEV bots intercepting transactions

**Mitigation**:
- CREATE2 deterministic addresses
- Commit-reveal pattern for secrets
- Private mempool submission options

### 3. Timeout Exploitation

**Threat**: Attacker manipulates timeouts to steal funds

**Mitigation**:
```solidity
// Critical constraint enforced
require(
    immutables.timelocks.dstCancellation < immutables.timelocks.srcWithdrawal,
    "Invalid timeout coordination"
);
```

## Smart Contract Security

### 1. Access Control

```solidity
// Role-based permissions
bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");
bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

// Only orchestrator can create escrows
function createSrcEscrow(...) external onlyRole(ORCHESTRATOR_ROLE) {
    // Implementation
}

// Emergency pause capability
function pause() external onlyRole(PAUSER_ROLE) {
    _pause();
}
```

### 2. Reentrancy Protection

```solidity
// All external functions protected
function withdraw(bytes32 secret) external nonReentrant {
    // State changes before external calls
    _withdrawn = true;
    _revealedSecret = secret;
    
    // External calls after state changes
    IERC20(token).safeTransfer(recipient, amount);
}
```

### 3. Input Validation

```solidity
// Comprehensive validation in libraries
function validate(Immutables memory immutables) internal view returns (bool) {
    return immutables.maker != address(0) &&
           immutables.taker != address(0) &&
           immutables.token != address(0) &&
           immutables.amount > 0 &&
           immutables.hashlockHash != bytes32(0) &&
           immutables.timelocks.validate() &&
           immutables.chainId > 0;
}
```

### 4. Safe Math

```solidity
// Using Solidity 0.8.23 with built-in overflow protection
uint256 total = amount + fee; // Automatically reverts on overflow
```

## Secret Management

### 1. Secret Generation

```typescript
class SecureSecretManager {
    // Use cryptographically secure random
    generateSecret(): Buffer {
        const secret = crypto.randomBytes(32);
        
        // Additional entropy from multiple sources
        const timestamp = Buffer.from(Date.now().toString());
        const random = crypto.randomBytes(32);
        
        return crypto.createHash('sha256')
            .update(secret)
            .update(timestamp)
            .update(random)
            .digest();
    }
}
```

### 2. Secret Storage

```typescript
// Never store plaintext secrets
interface EncryptedSecret {
    ciphertext: Buffer;
    iv: Buffer;
    authTag: Buffer;
    createdAt: number;
    expiresAt: number;
}

class SecretStore {
    private algorithm = 'aes-256-gcm';
    private key: Buffer; // From KMS or secure storage
    
    encrypt(secret: Buffer): EncryptedSecret {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        
        const ciphertext = Buffer.concat([
            cipher.update(secret),
            cipher.final()
        ]);
        
        return {
            ciphertext,
            iv,
            authTag: cipher.getAuthTag(),
            createdAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };
    }
}
```

### 3. Secret Reveal Strategy

```typescript
// Reveal on destination first, then source
async function revealSecret(session: SwapSession) {
    // 1. Reveal on NEAR (shorter timeout)
    await nearContract.withdraw(session.secret);
    
    // 2. Wait for confirmation
    await waitForFinalityNear(txHash);
    
    // 3. Only then reveal on BASE
    await baseEscrow.withdraw(session.secret);
}
```

## Cross-Chain Security

### 1. Message Verification

```solidity
// Verify cross-chain messages
function verifyMessage(
    bytes32 messageHash,
    bytes memory signature,
    address expectedSigner
) internal pure returns (bool) {
    address recovered = ECDSA.recover(messageHash, signature);
    return recovered == expectedSigner;
}
```

### 2. Event Authenticity

```typescript
// Verify events are from legitimate contracts
async function verifyEvent(event: Event): Promise<boolean> {
    const receipt = await provider.getTransactionReceipt(event.transactionHash);
    
    return receipt &&
           receipt.contractAddress === EXPECTED_CONTRACT &&
           receipt.logs.some(log => 
               log.topics[0] === event.topics[0] &&
               log.data === event.data
           );
}
```

### 3. Timeout Safety Margins

```solidity
// Safety margins prevent edge cases
uint32 constant SAFETY_BUFFER = 2 hours;
uint32 constant MIN_TIMEOUT = 30 minutes;
uint32 constant MAX_TIMEOUT = 7 days;

// Enforce margins
require(timeout >= MIN_TIMEOUT && timeout <= MAX_TIMEOUT, "Invalid timeout");
```

## Operational Security

### 1. Key Management

```typescript
// Hierarchical deterministic key derivation
class KeyManager {
    private masterKey: HDKey;
    
    deriveKey(path: string): Buffer {
        const child = this.masterKey.derive(path);
        return child.privateKey;
    }
    
    // Separate keys for different operations
    getSigningKey(): Buffer {
        return this.deriveKey("m/44'/60'/0'/0/0");
    }
    
    getEncryptionKey(): Buffer {
        return this.deriveKey("m/44'/60'/0'/1/0");
    }
}
```

### 2. Rate Limiting

```typescript
// Prevent abuse
const rateLimits = {
    createSession: {
        points: 10,
        duration: 60, // seconds
        blockDuration: 600 // 10 minutes if exceeded
    },
    revealSecret: {
        points: 5,
        duration: 60,
        blockDuration: 3600 // 1 hour if exceeded
    }
};
```

### 3. Monitoring and Alerts

```typescript
class SecurityMonitor {
    async detectAnomalies() {
        // Unusual timeout patterns
        if (await this.detectTimeoutManipulation()) {
            await this.alert('TIMEOUT_MANIPULATION_DETECTED');
        }
        
        // Repeated failed attempts
        if (await this.detectBruteForceAttempts()) {
            await this.alert('BRUTE_FORCE_DETECTED');
        }
        
        // Unusual gas prices
        if (await this.detectGasAnomalies()) {
            await this.alert('GAS_ANOMALY_DETECTED');
        }
    }
}
```

## Emergency Procedures

### 1. Circuit Breakers

```solidity
// Global pause mechanism
bool public emergencyPause = false;

modifier notPaused() {
    require(!emergencyPause, "System paused");
    _;
}

function emergencyStop() external onlyRole(EMERGENCY_ROLE) {
    emergencyPause = true;
    emit EmergencyStop(msg.sender, block.timestamp);
}
```

### 2. Fund Recovery

```solidity
// Time-locked recovery for stuck funds
mapping(address => uint256) public recoveryRequests;
uint256 constant RECOVERY_DELAY = 7 days;

function initiateRecovery(address token) external onlyRole(ADMIN_ROLE) {
    recoveryRequests[token] = block.timestamp + RECOVERY_DELAY;
}

function executeRecovery(address token, uint256 amount) external onlyRole(ADMIN_ROLE) {
    require(
        recoveryRequests[token] != 0 && 
        block.timestamp >= recoveryRequests[token],
        "Recovery not available"
    );
    
    IERC20(token).safeTransfer(msg.sender, amount);
    delete recoveryRequests[token];
}
```

### 3. Upgrade Procedures

```solidity
// Transparent proxy pattern for upgrades
contract FusionPlusHubV2 is FusionPlusHub {
    // New functionality while preserving state
    
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER_ROLE) 
    {
        // Additional validation
        require(
            IUpgradeable(newImplementation).version() > version(),
            "Invalid upgrade version"
        );
    }
}
```

## Audit Recommendations

### 1. Static Analysis

Run before deployment:
```bash
# Slither security analysis
slither contracts/ --print human-summary

# Mythril symbolic execution
myth analyze contracts/ethereum-hub/**/*.sol

# Echidna fuzzing
echidna-test contracts/FuzzTests.sol --contract FuzzTests
```

### 2. Test Coverage

Maintain high coverage:
```javascript
describe("Security Tests", () => {
    it("prevents reentrancy attacks", async () => {
        const attacker = await ReentrancyAttacker.deploy(escrow.address);
        await expect(attacker.attack()).to.be.reverted;
    });
    
    it("enforces timeout constraints", async () => {
        const badTimelocks = createTimelocks({
            dstCancellation: srcWithdrawal + 1 // Invalid
        });
        
        await expect(factory.createSrcEscrow(badTimelocks))
            .to.be.revertedWith("Invalid timeout coordination");
    });
});
```

### 3. Formal Verification

Key properties to verify:
- Funds can only be withdrawn with valid secret
- Timeouts are monotonically ordered
- No state can lead to locked funds

## Security Checklist

### Pre-Deployment

- [ ] All contracts audited by reputable firm
- [ ] Formal verification of critical properties
- [ ] Comprehensive test suite (>95% coverage)
- [ ] Gas optimization without compromising security
- [ ] Emergency procedures documented and tested

### Post-Deployment

- [ ] Real-time monitoring active
- [ ] Incident response plan in place
- [ ] Regular security reviews scheduled
- [ ] Bug bounty program active
- [ ] Upgrade procedures tested on testnet

## Best Practices

### 1. Principle of Least Privilege

```solidity
// Separate roles for different operations
contract RoleSegregation {
    bytes32 constant CREATOR_ROLE = keccak256("CREATOR");
    bytes32 constant EXECUTOR_ROLE = keccak256("EXECUTOR");
    bytes32 constant CANCELLER_ROLE = keccak256("CANCELLER");
    
    // Each function requires specific role
    function createEscrow() external onlyRole(CREATOR_ROLE) {}
    function executeSwap() external onlyRole(EXECUTOR_ROLE) {}
    function cancelSwap() external onlyRole(CANCELLER_ROLE) {}
}
```

### 2. Defense in Depth

Multiple layers of security:
1. Smart contract validation
2. Orchestration service validation
3. Frontend validation
4. Monitoring and alerts
5. Emergency procedures

### 3. Fail-Safe Defaults

```solidity
// Safe by default
bool public systemEnabled = false; // Must explicitly enable
uint256 public maxSwapAmount = 1000 * 10**6; // Start with low limit
uint256 public minTimelock = 1 hours; // Reasonable minimum
```

## Conclusion

Security is paramount in cross-chain systems. The Ethereum Hub implements:

1. **Smart Contract Security**: Comprehensive validation and protection
2. **Operational Security**: Key management and monitoring
3. **Cross-Chain Security**: Timeout coordination and verification
4. **Emergency Procedures**: Circuit breakers and recovery
5. **Continuous Improvement**: Audits and monitoring

This multi-layered approach ensures safe operation of cross-chain atomic swaps.