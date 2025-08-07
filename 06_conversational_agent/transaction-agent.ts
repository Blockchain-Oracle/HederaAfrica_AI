import { ConversationalAgent } from '@hashgraphonline/conversational-agent';
import { HCS10Client } from '@hashgraphonline/standards-sdk';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, getUserInput } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('TransactionAgent');

// Example natural language requests
const EXAMPLE_REQUESTS = [
  "Send 5 HBAR to 0.0.98",
  "Transfer 10 HBAR to Alice at 0.0.123456",
  "Create a new fungible token called AfricaCoin with symbol AFR and 1 million supply",
  "Mint 1000 more AfricaCoin tokens",
  "Schedule a payment of 2 HBAR to 0.0.98 for tomorrow",
  "What's my HBAR balance?",
  "Show my recent transactions"
];

async function main() {
  displayHeader('Transaction Processing AI Agent', 
    'Process natural language transaction requests'
  );

  try {
    if (!process.env.OPENAI_API_KEY) {
      logger.error('OPENAI_API_KEY not found');
      logger.info('Please set your OpenAI API key in .env file');
      process.exit(1);
    }

    // Step 1: Initialize conversational agent
    logger.step(1, 'Initializing Conversational Agent');
    
    const hederaAgent = new ConversationalAgent({
      accountId: process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID!,
      privateKey: process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY!,
      network: 'testnet',
      openAIApiKey: process.env.OPENAI_API_KEY!,
      operationalMode: 'returnBytes', // Return transaction bytes for user approval
      userAccountId: process.env.HEDERA_ACCOUNT_ID!, // The user making requests
      verbose: true
    });

    await hederaAgent.initialize();
    logger.success('Conversational agent initialized');

    // Also initialize HCS-10 client for messaging
    const hcs10Client = new HCS10Client({
      network: 'testnet',
      operatorId: process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID!,
      operatorPrivateKey: process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY!,
      guardedRegistryBaseUrl: process.env.REGISTRY_URL,
      logLevel: 'info'
    });

    // Step 2: Process requests
    logger.step(2, 'Natural Language Transaction Interface');
    
    console.log('\nExample requests you can make:');
    EXAMPLE_REQUESTS.forEach(req => console.log(`- ${req}`));
    console.log('\nType "exit" to quit\n');

    // Interactive loop
    while (true) {
      const request = getUserInput('\nWhat would you like to do? > ');
      
      if (request.toLowerCase() === 'exit') {
        logger.info('Goodbye!');
        break;
      }

      if (request.trim()) {
        try {
          logger.info('Processing your request...');
          
          // Process the natural language request
          const response = await hederaAgent.processMessage(request);
          
          // Handle different response types
          if (response.response && !response.transactionBytes) {
            // Informational response (balance check, etc.)
            displayResult('Response', response.response);
          }
          
          if (response.transactionBytes) {
            // Transaction requires approval
            logger.info('Transaction prepared!');
            displayResult('Type', response.transactionType || 'Transaction');
            displayResult('Description', response.response || 'Ready for approval');
            
            // In a real app, you would:
            // 1. Decode the transaction bytes
            // 2. Show transaction details to user
            // 3. Get user approval
            // 4. Sign and submit
            
            console.log('\n📝 Transaction Details:');
            console.log('- Bytes ready for signing');
            console.log('- Would require user approval in production');
            console.log('- Could be scheduled for later execution');
            
            // For demo purposes, show what would happen
            if (response.transactionType === 'TransferTransaction') {
              console.log('\n💸 This would transfer HBAR as requested');
              console.log('Transaction would be submitted to Hedera network');
              console.log('You would receive a transaction ID for verification');
            } else if (response.transactionType === 'TokenCreateTransaction') {
              console.log('\n🪙 This would create a new token as requested');
              console.log('Token would be deployed on Hedera');
              console.log('You would receive the token ID');
            }
          }
          
          if (response.error) {
            logger.error('Request failed:', response.error);
          }

        } catch (error) {
          logger.error('Failed to process request:', error);
        }
      }
    }

    // Cleanup
    // Agent cleanup handled automatically

  } catch (error) {
    logger.error('Demo failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});