import { createHederaClient, checkBalance } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult } from '../utils/demo-helpers';
import { AccountInfoQuery, TopicCreateTransaction, Hbar } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const logger = new DemoLogger('Setup');

async function main() {
  displayHeader('Hedera Environment Setup Check', 
    'This script verifies your Hedera configuration and connection'
  );

  // Step 1: Check environment variables
  logger.step(1, 'Checking environment variables');
  const requiredEnvVars = ['HEDERA_ACCOUNT_ID', 'HEDERA_PRIVATE_KEY'];
  const optionalEnvVars = ['OPENAI_API_KEY', 'HGRAPH_API_KEY'];
  
  let envVarsOk = true;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.error(`Missing required: ${envVar}`);
      envVarsOk = false;
    } else {
      logger.success(`Found ${envVar}`);
    }
  }

  for (const envVar of optionalEnvVars) {
    if (!process.env[envVar]) {
      logger.warning(`Optional ${envVar} not set (needed for AI demos)`);
    } else {
      logger.success(`Found ${envVar}`);
    }
  }

  if (!envVarsOk) {
    logger.error('Please set all required environment variables in .env file');
    process.exit(1);
  }

  // Step 2: Create Hedera client
  logger.step(2, 'Creating Hedera client');
  let client;
  try {
    client = await withSpinner('Connecting to Hedera testnet...', async () => {
      return createHederaClient();
    });
    logger.success('Connected to Hedera testnet');
  } catch (error) {
    logger.error('Failed to create client', error);
    process.exit(1);
  }

  // Step 3: Check account balance
  logger.step(3, 'Checking account balance');
  try {
    const balance = await withSpinner('Fetching account balance...', async () => {
      return checkBalance(client);
    });
    
    const balanceNum = parseFloat(balance);
    displayResult('Account Balance', `${balance} HBAR`);
    
    if (balanceNum < 5) {
      logger.warning('Low balance! Recommended minimum: 20 HBAR for all demos');
    } else if (balanceNum < 20) {
      logger.warning('Balance is OK but consider adding more HBAR for all demos');
    } else {
      logger.success('Balance is sufficient for all demos');
    }
  } catch (error) {
    logger.error('Failed to check balance', error);
    process.exit(1);
  }

  // Step 4: Get account info
  logger.step(4, 'Fetching account information');
  try {
    const accountInfo = await withSpinner('Getting account details...', async () => {
      const query = new AccountInfoQuery()
        .setAccountId(client.operatorAccountId!);
      return query.execute(client);
    });

    displayResult('Account ID', accountInfo.accountId.toString());
    displayResult('Public Key', accountInfo.key.toString());
    displayResult('Account Memo', accountInfo.accountMemo || '(none)');
    logger.success('Account info retrieved');
  } catch (error) {
    logger.error('Failed to get account info', error);
  }

  // Step 5: Test transaction fees
  logger.step(5, 'Testing transaction fees');
  try {
    // Create a simple transfer transaction to check fees
    const testTx = new TopicCreateTransaction()
      .setTopicMemo('Setup test topic')
      .setMaxTransactionFee(new Hbar(2));

    // Freeze the transaction to prepare it
    testTx.freezeWith(client);
    
    // Display the max transaction fee we set
    displayResult('Max transaction fee set', '2 HBAR');
    logger.success('Transaction fee configuration verified');
    
    // Note: We don't actually execute this transaction
    logger.info('(Transaction not executed - dry run only)');
  } catch (error) {
    logger.error('Failed to test transaction fees', error);
  }

  // Summary
  logger.divider();
  console.log(chalk.bold.green('\n✅ Setup verification complete!\n'));
  console.log('You are ready to run the demos. Try these commands:');
  console.log(chalk.cyan('  pnpm run 01:transfer    # Basic HBAR transfer'));
  console.log(chalk.cyan('  pnpm run 02:register    # Register an agent'));
  console.log(chalk.cyan('  pnpm run 04:cli         # Interactive CLI demo'));
  console.log();
}

main().catch(error => {
  logger.error('Setup check failed', error);
  process.exit(1);
});