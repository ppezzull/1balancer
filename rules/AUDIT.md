# Smart Contracts Security Review: Balancer and BalancerFactory

Date: 2025-09-02
Scope: packages/hardhat/contracts/portfolio/balancers/Balancer.sol, packages/hardhat/contracts/portfolio/factory/BalancerFactory.sol, unit tests, and high-level rules/docs

## Summary (final)
The contracts implement a lean, off-chain-orchestrated architecture. Balancer uses EIP-712 typed data (with EIP-1271 compatibility) and the Factory deploys EIP-1167 minimal proxies funded via EIP-2612 permits.

No critical issues were found. Medium/low risks have been mitigated with small, targeted safeguards: reentrancy guards, duplicate and size checks, token sanity checks, optional target sum enforcement with a warning event, and a toggle to disable 1271 fallback. The unit tests for happy paths and new guards are passing.

## Threat Model and Assumptions
- Trust: The owner/authorizedSigner is trusted to sign valid proposals. Off-chain services are trusted to compute, validate, and sign only safe rebalances.
- Assets: Any ERC-20 can be added; tokens may have non-standard behavior (FoT, hooks, rebasing). No on-chain price oracle is used; percentage targets are soft and enforced only by off-chain governance.
- Factory: Receives EIP-2612 permits to pull funds from msg.sender; moves funds to the newly initialized Balancer in the same tx.
- Privileges: Only the Balancer owner can change the authorized signer; only signed proposals that match the current nonce and deadline execute.

## Findings

### High
- None found.

### Medium
1) Potential DoS/lock from asset misconfiguration
- Description: initialize accepts any token addresses and stores them as assets with targetPercentageBps. If an invalid or malicious token is configured (transfer hooks, reverts, blacklists), later deposits/withdrawals or rebalances could lock funds or break flows.
- Impact: Medium. Operational DoS; depends on off-chain validation.
- Recommendation: Maintain a whitelist/registry off-chain and enforce stricter off-chain checks before signing. Optionally add on-chain sanity checks (e.g., revert if token code length == 0 or known bad flags) if a curated set of assets is intended.

2) Unbounded asset arrays can be gas-heavy and increase risk surface
- Description: Balancer stores assets as a dynamic array with a mapping lookup. Large arrays mean high gas to iterate in executeSignedRebalance and to compute hashes.
- Impact: Medium. Gas/DoS ceiling for very large portfolios or very large OrderDelta arrays.
- Recommendation: Define practical asset limits in off-chain policy. Consider on-chain max array length checks in initialize and execute paths.

3) Re-entrancy risk surface on token transfers
- Description: The Balancer and Factory perform ERC20.safeTransferFrom and safeTransfer calls. For standard ERC-20 this is safe, but non-standard tokens might invoke hooks in downstream protocols (e.g., ERC777-like or token with callbacks).
- Impact: Medium. Potential re-entrancy into the same contract’s public methods if a malicious token calls back.
- Mitigations present: No external calls after state changes in executeSignedRebalance; nonce increments before transfers; effects-then-interactions pattern is mostly respected.
- Recommendation: Implemented. ReentrancyGuard is applied to Balancer.executeSignedRebalance and Factory.createBalancer. If restricting to standard ERC-20, document the policy.

4) EIP-1271 fallback trust model
- Description: isValidSignature accepts contract responses as valid. If owner/authorizedSigner is a contract with a permissive or compromised isValidSignature implementation, forged signatures could be accepted.
- Impact: Medium. This is an expected part of 1271 trust model; risk shifts to the external contract.
- Recommendation: Document clearly. Optionally allow owner to disable 1271 fallback via a flag if desired.

### Low
5) Missing explicit sum constraint for target percentages
- Description: Contract leaves global targetPercentageBps sum enforcement to off-chain. On-chain can drift to sums greater or less than 10_000.
- Impact: Low (by design), but can confuse integrators.
- Recommendation: Implemented. Warning event TargetsSumOutOfRange added and optional strict enforcement via enforceTargetSum.

6) No event for authorized signer change beyond SignerUpdated
- Description: SignerUpdated is emitted; that’s good. Consider also emitting previous signer to improve auditability (already the event has newSigner; previous isn’t crucial given chain history).
- Impact: Low. Informational only.

7) initialize can be front-run with weird arrays (not exploitable due to _initialized guard)
- Description: initialize uses a one-time guard; subsequent calls revert. This is fine. Passing arrays with duplicates is allowed; duplicate tokens will overwrite mapping entries but remain duplicated in assets[].
- Impact: Low. UI/logic complexity.
- Recommendation: Optionally check and prevent duplicates at init.

8) Factory does not clear approvals (and shouldn’t); relies on permit-spent model
- Description: After transferFrom, allowances might remain if value > amount. Tests assert zero allowance in mocks; in practice, some tokens may not auto-decrease allowances.
- Impact: Low. Users could accidentally grant the factory more than necessary.
- Recommendation: Encourage clients to set permit value = exact amount per token; consider documenting that pattern. Optional best-effort reduceAllowance pattern is generally discouraged due to approvals race conditions.

9) Stack-too-deep risk in createBalancer
- Observation: Addressed with viaIR=true in Hardhat overrides. This is a build-time nuance, not a runtime risk.

10) Use of IERC20 instead of a strict SafeERC20-only interface in Factory
- Note: Using IERC20 + SafeERC20 is fine; ensure all transfers use safe wrappers (you do in Factory and Balancer).

11) Lack of pausing/emergency controls
- Description: No pause/kill switch in Balancer. In case of critical incident, owners cannot freeze proposal execution or withdrawals within the current design.
- Impact: Low/Medium depending on operational requirements.
- Recommendation: Consider adding a minimal pause (owner only) if aligned with non-custodial ethos.

### Informational / Best Practices
- Prefer custom errors (already used) over string reverts for gas efficiency—good.
- Effects-then-interactions ordering looks correct in executeSignedRebalance (nonce increments before transfers)—good.
- Domain separator storage and chainId cache are handled; recomputation on fork is supported—good. DOMAIN_SEPARATOR() view is exposed for tooling compatibility.
- Minimal Ownable pattern is clear; ownership transfer requires onlyOwner—good.
- Consider exposing a view that returns the full assets array and corresponding targets in one call to reduce off-chain multicall overhead.
- Consider canonical EIP-712 type string constants as public for clients to fetch and verify on-chain.

## Test coverage (current) and gaps
Current coverage (passing)
- EIP-712 proposal hashing/signature execution
- EIP-1271 compatibility sanity
- Factory create with EIP-2612 permits and initial funding
- Guards: duplicate assets (Factory/Balancer), max asset cap, zero/invalid token checks
- Target sum: warning event on initialize when sum != 10,000 bps

Gaps to address next
- Expired deadlines and wrong nonces
- Invalid signatures (wrong signer, tampered deltas)
- Misordered permits (PermitOrderMismatch) and insufficient permit values
- Non-standard/reverting tokens to validate safe revert paths
- Very large arrays to observe gas ceilings and DoS boundaries

## Integration Considerations (with the scaffold)
- Off-chain services must enforce:
  - Asset whitelisting and duplicate prevention.
  - Sum of targetPercentageBps ≈ 10,000 bps or a policy threshold.
  - Reasonable bounds for deltas and amounts.
  - Replay protection via nonce and prompt expiry on signatures.
  - Proper EIP-712 domain binding (chainId and verifyingContract) across environments.
- UI: Show warnings if targets sum deviates from 100% or if assets include tokens with known non-standard behavior.
- Indexer: Ingest ProposalExecuted, store full deltas, and recompute post-state for auditability.

## Gas and Deployability
- The switch to minimal proxies plus constructor-less Balancer (initializer) is an improvement for deploy gas and code size.
- Using viaIR selectively on the factory mitigates stack-too-deep while keeping optimizer runs modest; measure bytecode size vs gas to confirm best tradeoff.
- Consider CREATE2 salt-based deployments only if deterministic addresses are required; current design avoids it for simplicity.

## Final validation and conclusion
Quality gates
- Build: PASS
- Unit tests: PASS (current suite)

The implementation remains lean and now includes key operational safeguards. With the additional negative tests and optional features (pause, event enrichment), the system is well-positioned for integration with your Supabase/RLS indexer and frontends.

## Implementation status checklist (as of 2025-09-02)

Applied
- [x] ReentrancyGuard added
  - Balancer.executeSignedRebalance is nonReentrant
  - Factory.createBalancer is nonReentrant
- [x] Duplicate asset prevention
  - Balancer.initialize reverts on duplicates
  - Factory.createBalancer reverts on duplicates
- [x] Max assets cap
  - MAX_ASSETS = 32 enforced in Balancer.initialize and Factory.createBalancer
- [x] Token sanity checks
  - Zero-address and code-length checks in Balancer.initialize and Factory.createBalancer
- [x] Target sum controls
  - Optional enforcement flag enforceTargetSum with InvalidTargetsSum revert
  - Warning event TargetsSumOutOfRange when not enforcing
- [x] EIP-1271 toggle
  - allow1271 flag gates 1271 fallback; Allow1271Updated event
- [x] SignerUpdated event improved
  - Emits previous and new signer
- [x] EIP-712 helpers/views
  - DOMAIN_SEPARATOR() view exposed (domainSeparator preserved)
- [x] Compact portfolio view
  - getPortfolio() returns [tokens[], targetBps[]]

Applied (tests)
- [x] Tests for guards (duplicates, max assets, invalid/zero asset, target-sum warning on init)
- [x] Happy paths (permits funding, EIP-712 execution, EIP-1271 sanity)

Pending / optional
- [x] Pausable emergency stop on Balancer (pause/unpause; gate sensitive functions with whenNotPaused)
- [x] Factory event enrichment (e.g., BalancerCreated include assetsLength)
- [x] Expose EIP-712 name/version constants (public EIP712_NAME/EIP712_VERSION)
- [x] Additional array-size caps (e.g., max deltas length in execute paths)
- [ ] Optional deterministic deployments via CREATE2 (only if required)
