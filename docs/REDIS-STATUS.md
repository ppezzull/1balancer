# Redis Status in 1Balancer

## Current Status: NOT IN USE

Redis is currently **not being used** in the 1Balancer orchestrator service. The codebase uses in-memory storage for session management.

## Evidence

1. **No Redis client imports** in the codebase
2. **SessionManager explicitly states** it uses in-memory storage:
   ```typescript
   isRedisConnected(): boolean {
     // Currently using in-memory storage - no Redis connection
     return false;
   }
   ```
3. **Sessions stored in memory**: Using `Map<string, SwapSession>()`

## Why Redis References Exist

- **Future scalability**: Architecture designed to support Redis when needed
- **Production readiness**: Would be required for multi-instance deployments
- **Template inheritance**: Likely came from the original scaffold

## Current Implementation

- ✅ In-memory storage works fine for:
  - Development
  - Single-instance deployments
  - Testing
  
- ⚠️ Limitations:
  - Sessions lost on restart
  - Cannot scale horizontally
  - No persistence

## When Redis Would Be Needed

1. **Multiple orchestrator instances** (horizontal scaling)
2. **Session persistence** across restarts
3. **Production deployment** with high availability
4. **Distributed caching** for performance

## Scripts Updated

The following scripts have been updated to reflect that Redis is not required:
- `scripts/run-integration-tests.sh`
- `1balancer-near/scripts/deploy-local.sh`

## To Enable Redis (Future)

If Redis is needed in the future:

1. Install Redis: `brew install redis` (macOS) or `sudo apt-get install redis-server` (Ubuntu)
2. Uncomment Redis sections in scripts
3. Implement Redis client in `SessionManager.ts`
4. Update configuration to use `REDIS_URL`