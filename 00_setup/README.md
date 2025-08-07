# Setup & Environment Configuration

This folder contains scripts to verify your Hedera environment setup.

## Prerequisites

1. **Hedera Testnet Account**
   - Create at [portal.hedera.com](https://portal.hedera.com)
   - Fund with testnet HBAR from the portal
   - Minimum 20 HBAR recommended for all demos

2. **Environment Variables**
   - Copy `.env.example` to `.env` in the root directory
   - Add your Hedera credentials
   - Add API keys for AI demos (optional)

## Running the Setup Check

```bash
pnpm run 00:setup
```

This will:
- ✅ Verify environment variables are set
- ✅ Connect to Hedera testnet
- ✅ Check account balance
- ✅ Display account information
- ✅ Test basic operations

## Troubleshooting

### "Missing environment variables" error
- Ensure `.env` file exists in the root directory
- Check that `HEDERA_ACCOUNT_ID` and `HEDERA_PRIVATE_KEY` are set

### "Insufficient balance" warning
- Visit [portal.hedera.com](https://portal.hedera.com)
- Use the testnet faucet to get more HBAR
- Wait a few seconds for the transaction to complete

### Connection errors
- Verify your internet connection
- Check if Hedera testnet is operational
- Ensure your account ID format is correct (e.g., `0.0.123456`)