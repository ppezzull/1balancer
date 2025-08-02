Add account setup suggestions throughout Makefile

This was "the missing puzzle" - account commands weren't being suggested where needed.

Added account setup checks and suggestions to:
- Deploy commands: deploy-fork, deploy-sepolia, deploy-base
- Test command: test-integration (checks if contracts deployed)
- Guide workflows: guide-local, guide-testnet
- Workflow commands: all workflow-* commands now mention account setup
- Main run command: auto-generates account if missing

Fixed formatting:
- Proxy setup warning now uses standard "📚 SETUP REQUIRED:" pattern
- All suggestions follow existing Makefile patterns

The account setup flow is now properly integrated:
1. Generate/import account before any deployment
2. Fund with appropriate tokens for testnets
3. Clear error messages guide users to account commands
4. Auto-generation in quickstart and run commands for convenience

No account setup is rocket science anymore! 🚀