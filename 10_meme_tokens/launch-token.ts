import { AccountId, ContractId, PrivateKey } from "@hashgraph/sdk";
import {
  CONTRACT_DEPLOYMENTS,
  createAdapter,
  getChain,
  MJClient,
  NativeAdapter,
} from "@buidlerlabs/memejob-sdk-js";
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, getUserInput, withSpinner } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('TokenLaunch');

async function main() {
  displayHeader('AI Token Launch Demo', 
    'Launch and trade tokens with bonding curves'
  );

  try {
    // Check for required credentials
    const accountId = process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      logger.error('Account credentials not found');
      logger.info('Please run "pnpm run 02:register" first to create an agent');
      process.exit(1);
    }

    // Step 1: Initialize SDK client
    logger.step(1, 'Initializing token SDK');
    
    const contractId = ContractId.fromString(
      CONTRACT_DEPLOYMENTS.testnet.contractId
    );

    const client = new MJClient(
      createAdapter(NativeAdapter, {
        operator: {
          accountId: AccountId.fromString(accountId),
          privateKey: PrivateKey.fromStringECDSA(privateKey),
        },
      }),
      {
        chain: getChain("testnet"),
        contractId,
      }
    );

    logger.success('SDK initialized');

    // Step 2: Get token parameters
    logger.step(2, 'Token Configuration');
    
    const tokenName = getUserInput('Token name (e.g., AfricaAI): ') || 'DemoAI';
    const tokenSymbol = getUserInput('Token symbol (e.g., AAI): ') || 'DEMO';
    const metadataCID = getUserInput('IPFS metadata CID (or press Enter to skip): ') || '';
    
    const tokenInfo = {
      name: tokenName,
      symbol: tokenSymbol,
      memo: metadataCID ? `ipfs://${metadataCID}` : 'AI-powered token by Hedera Africa Demo',
    };

    displayResult('Name', tokenInfo.name);
    displayResult('Symbol', tokenInfo.symbol);
    displayResult('Memo', tokenInfo.memo);

    // Step 3: Create token with bonding curve
    logger.step(3, 'Creating token with bonding curve');
    
    const token = await withSpinner('Launching token...', async () => {
      return await client.createToken(tokenInfo, {
        amount: 1000000000000n, // Initial liquidity
        distributeRewards: true,
        referrer: "0x0000000000000000000000000000000000000000",
      });
    });

    logger.success('Token created successfully!');
    logger.info('Token details:', token);

    // Step 4: Demonstrate trading
    logger.step(4, 'Trading Demo');
    
    const tradeChoice = getUserInput('\nWould you like to try trading? (y/n): ');
    
    if (tradeChoice?.toLowerCase() === 'y') {
      const action = getUserInput('Buy or sell? (buy/sell): ')?.toLowerCase();
      const amount = getUserInput('Amount (in smallest unit, e.g., 1000000): ');
      
      if (action && amount) {
        const amountBigInt = BigInt(amount);
        
        if (action === 'buy') {
          logger.info('Executing buy order...');
          
          const buyResult = await withSpinner('Buying tokens...', async () => {
            return await token.buy({
              amount: amountBigInt,
              referrer: "0x0000000000000000000000000000000000000000"
            });
          });

          logger.success('Buy order executed!');
          displayResult('Status', buyResult.status);
          displayResult('Tokens bought', buyResult.amount.toString());
          displayResult('Transaction', buyResult.transactionIdOrHash);
          
        } else if (action === 'sell') {
          logger.info('Executing sell order...');
          
          const sellResult = await withSpinner('Selling tokens...', async () => {
            return await token.sell({
              amount: amountBigInt,
              instant: true,
            });
          });

          logger.success('Sell order executed!');
          displayResult('Status', sellResult.status);
          displayResult('Tokens sold', sellResult.amount.toString());
          displayResult('Transaction', sellResult.transactionIdOrHash);
        }
      }
    }

    // Step 5: AI Trading Strategy Example
    logger.step(5, 'AI Trading Strategy');
    
    console.log('\n🤖 AI Agent Trading Ideas:');
    console.log('\n1. Trend-based Trading:');
    console.log('   - Monitor social media sentiment');
    console.log('   - Buy when positive mentions increase');
    console.log('   - Sell when sentiment turns negative');
    
    console.log('\n2. Volume-based Strategy:');
    console.log('   - Track trading volume patterns');
    console.log('   - Enter positions on volume spikes');
    console.log('   - Exit on declining activity');
    
    console.log('\n3. Market Making:');
    console.log('   - Provide liquidity with buy/sell orders');
    console.log('   - Profit from spread');
    console.log('   - Adjust based on volatility');

    // Save token info
    const tokenData = {
      name: tokenName,
      symbol: tokenSymbol,
      contractId: contractId.toString(),
      createdAt: new Date().toISOString(),
      creator: accountId,
      bondingCurve: true
    };

    const fs = await import('fs/promises');
    await fs.writeFile(`ai-token-${tokenSymbol}.json`, JSON.stringify(tokenData, null, 2));
    logger.success(`Token info saved to: ai-token-${tokenSymbol}.json`);

    console.log('\n📋 Next Steps:');
    console.log('1. Implement automated trading strategies');
    console.log('2. Monitor token performance with Hgraph');
    console.log('3. Create AI agents that trade autonomously');
    console.log('4. Build a portfolio management system');

  } catch (error) {
    logger.error('Token launch failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});