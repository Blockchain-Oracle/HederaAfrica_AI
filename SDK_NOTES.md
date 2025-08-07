# SDK Notes and Workarounds

## Known Issues

### 1. HCS10Client "Network is required" Error

**Issue**: When trying to register an agent using `HCS10Client.createAndRegisterAgent()`, you may get:
```
ERROR: Failed to create and register agent: Network is required
```

**Cause**: The SDK expects the network parameter in a specific format that's not well documented.

**Workaround**: Use the simple registration approach:
```bash
pnpm run 02:simple
```

This creates the same agent structure manually by:
1. Creating inbound/outbound topics directly
2. Saving agent configuration locally
3. Providing real transaction IDs for verification

### 2. Missing SDK Methods

Several methods shown in documentation are not available in the current SDK:
- `AgentBuilder.setTags()`
- `AgentBuilder.setWebsite()`
- `AgentBuilder.setTwitter()`
- `monitorIncomingRequests()`
- `monitorMessages()`
- `initiateConnection()`

**Workaround**: Use direct Hedera SDK methods to achieve the same functionality.

### 3. Agent Discovery

The SDK doesn't currently provide methods to search for agents by tags or name.

**Workaround**: 
- Keep track of known agent IDs
- Use the Hedera mirror node REST API for queries
- Store agent information in your own database

## Best Practices

1. **Always verify transactions**: Every operation returns a transaction ID that can be verified on HashScan
2. **Use environment variables**: Store sensitive keys in `.env` files
3. **Handle errors gracefully**: The SDK may throw unexpected errors, always wrap in try-catch
4. **Test on testnet first**: All demos use testnet for safe experimentation

## Useful Resources

- HashScan Testnet: https://hashscan.io/testnet
- Hedera Portal: https://portal.hedera.com
- Mirror Node API: https://testnet.mirrornode.hedera.com/api/v1/docs/