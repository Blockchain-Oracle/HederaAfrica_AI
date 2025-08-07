import { HCS10Client, Logger } from '@hashgraphonline/standards-sdk';
import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, getUserInput, sleep } from '../utils/demo-helpers';
import chalk from 'chalk';

const logger = new DemoLogger('SendMessages');

async function main() {
  displayHeader('Agent Messaging Demo', 
    'Send and receive messages between connected agents'
  );

  // Get connection topic from env or user
  let connectionTopicId = process.env.TOPIC_ID;
  if (!connectionTopicId) {
    // Try to load from saved connection
    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir('.');
      const connectionFile = files.find(f => f.startsWith('connection-') && f.endsWith('.json'));
      
      if (connectionFile) {
        const data = await fs.readFile(connectionFile, 'utf-8');
        const connection = JSON.parse(data);
        connectionTopicId = connection.communicationTopicId || connection.connectionTopicId;
        logger.success(`Loaded connection: ${connectionFile}`);
        displayResult('Target Agent', connection.targetAgent);
      }
    } catch {
      // Ignore errors
    }
    
    if (!connectionTopicId) {
      connectionTopicId = getUserInput('Enter Connection Topic ID: ');
    }
  }

  if (!connectionTopicId) {
    logger.error('Connection topic ID is required');
    logger.info('Run "pnpm run 03:connect" first to establish a connection');
    process.exit(1);
  }

  logger.info(`Using connection topic: ${connectionTopicId}`);

  // Use demo account if available
  const operatorId = process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID!;
  const operatorPrivateKey = process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY!;
  
  logger.step(1, 'Initializing HCS-10 client');
  const hcs10Client = await withSpinner('Setting up HCS-10 client...', async () => {
    return new HCS10Client({
      network: 'testnet',
      operatorId: operatorId,
      operatorPrivateKey: operatorPrivateKey,
      guardedRegistryBaseUrl: process.env.REGISTRY_URL,
      prettyPrint: true,
      logLevel: 'info'
    });
  });
  
  // Also get the standard Hedera client for direct topic operations
  const hederaClient = createHederaClient();

  const sdkLogger = new Logger({ module: 'Messages', level: 'info' });

  // Note about monitoring
  logger.step(2, 'Message sending setup');
  logger.info('Messages will be sent to the connection topic');
  logger.info('To see messages in real-time, run "pnpm run 01:message" with this topic ID in another terminal');

  // Demo messages
  logger.step(3, 'Sending demo messages');
  
  const demoMessages = [
    {
      type: 'text',
      content: 'Hello from Hedera Africa Demo! 🌍'
    },
    {
      type: 'data_request',
      content: JSON.stringify({
        type: 'data_analysis_request',
        dataset: 'african_tech_ecosystem',
        metrics: ['startups', 'funding', 'growth'],
        timeframe: '2024-2025'
      })
    },
    {
      type: 'collaboration',
      content: JSON.stringify({
        type: 'collaboration_proposal',
        project: 'DeFi for Africa',
        description: 'Building accessible DeFi solutions',
        looking_for: ['developers', 'advisors', 'partners']
      })
    }
  ];

  for (const [index, msg] of demoMessages.entries()) {
    logger.info(`Sending message ${index + 1}/${demoMessages.length} (${msg.type})`);
    
    try {
      // Import required classes
      const { TopicMessageSubmitTransaction, TopicId } = await import('@hashgraph/sdk');
      
      const topicId = TopicId.fromString(connectionTopicId);
      const submitTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(msg.content);
      
      const txResponse = await withSpinner('Sending message...', async () => {
        return submitTx.execute(hederaClient);
      });
      
      const receipt = await txResponse.getReceipt(hederaClient);
      
      logger.success('Message sent!');
      displayResult('Transaction ID', txResponse.transactionId.toString());
      displayResult('View on HashScan', `https://hashscan.io/testnet/transaction/${txResponse.transactionId}`);
      
    } catch (error) {
      logger.error(`Failed to send message: ${error}`);
    }
    
    await sleep(2000); // Wait between messages
  }

  // Interactive messaging
  logger.divider();
  console.log(chalk.bold('\n💬 Interactive Messaging Mode'));
  console.log('Type messages to send (or "exit" to quit):');
  console.log('Tip: Try sending JSON like {"action": "greet", "name": "Africa"}');
  
  while (true) {
    const userMessage = getUserInput('\n> ');
    
    if (userMessage.toLowerCase() === 'exit') {
      break;
    }
    
    if (userMessage.trim()) {
      try {
        const { TopicMessageSubmitTransaction, TopicId } = await import('@hashgraph/sdk');
        
        const topicId = TopicId.fromString(connectionTopicId);
        const submitTx = new TopicMessageSubmitTransaction()
          .setTopicId(topicId)
          .setMessage(userMessage);
        
        const txResponse = await withSpinner('Sending...', async () => {
          return submitTx.execute(hederaClient);
        });
        
        const receipt = await txResponse.getReceipt(hederaClient);
        
        logger.success('Message sent!');
        displayResult('Transaction ID', txResponse.transactionId.toString());
      } catch (error) {
        logger.error(`Failed to send: ${error}`);
      }
    }
  }

  // Summary
  logger.divider();
  logger.success(`Session complete! Sent ${demoMessages.length} demo messages`);
  logger.info(`Total messages in conversation: ${demoMessages.length}`);
  
  // Save conversation
  if (demoMessages.length > 0) {
    const saveChoice = getUserInput('\nSave conversation? (y/n): ');
    if (saveChoice.toLowerCase() === 'y') {
      const fs = await import('fs/promises');
      const filename = `conversation-${Date.now()}.json`;
      await fs.writeFile(filename, JSON.stringify(demoMessages, null, 2));
      logger.success(`Conversation saved to: ${filename}`);
    }
  }

  logger.divider();
  logger.success('Demo completed! 🎉');
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});