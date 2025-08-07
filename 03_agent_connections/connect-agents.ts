import { HCS10Client, Logger } from '@hashgraphonline/standards-sdk';
import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, getUserInput, waitForUserInput, sleep } from '../utils/demo-helpers';
import { Hbar } from '@hashgraph/sdk';

const logger = new DemoLogger('ConnectAgents');

async function monitorConnectionConfirmation(
  client: HCS10Client,
  targetInboundTopicId: string,
  connectionRequestId: number,
): Promise<string | null> {
  logger.info(`Waiting for confirmation for request #${connectionRequestId}`);
  
  try {
    const confirmation = await client.waitForConnectionConfirmation(
      targetInboundTopicId,
      connectionRequestId,
      30, // timeout seconds
      2000 // poll interval ms
    );
    
    logger.success(`Confirmation received! Connection Topic: ${confirmation.connectionTopicId}`);
    return confirmation.connectionTopicId;
  } catch (error) {
    logger.error(`Did not receive confirmation for request #${connectionRequestId}:`, error);
    return null;
  }
}

async function main() {
  displayHeader('Agent Connection Demo', 
    'Connect to other HCS-10 agents'
  );

  // Use demo account if available, otherwise use main account
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

  logger.success('Client initialized');
  displayResult('Your Account', operatorId);

  // Get target agent's inbound topic
  const targetInboundTopic = getUserInput('\nEnter target agent INBOUND TOPIC ID (e.g., 0.0.123456): ');
  
  if (!targetInboundTopic) {
    logger.error('Target inbound topic ID is required');
    logger.info('You need the inbound topic ID of the agent you want to connect to');
    process.exit(1);
  }

  logger.info(`Connecting to agent via topic: ${targetInboundTopic}`);
  
  try {
    // Step 2: Submit connection request
    logger.step(2, 'Submitting connection request');
    
    const connectionMessage = getUserInput('Connection message (optional): ') || 
      'Hello! I would like to connect from the Hedera Africa Demo.';

    const connectionRequest = await withSpinner('Sending connection request...', async () => {
      return await hcs10Client.submitConnectionRequest(
        targetInboundTopic,
        connectionMessage
      );
    });

    const connectionRequestId = connectionRequest.topicSequenceNumber?.toNumber();
    
    if (!connectionRequestId) {
      throw new Error('Failed to get connection request sequence number');
    }

    logger.success('Connection request sent!');
    displayResult('Request ID', connectionRequestId.toString());
    displayResult('Transaction', `https://hashscan.io/testnet/transaction/${connectionRequest.toString()}`);
    
    // Step 3: Wait for confirmation
    logger.step(3, 'Waiting for connection confirmation');
    logger.info('The target agent needs to accept the connection...');
    logger.info('(They should be running a monitoring script)');

    const connectionTopicId = await monitorConnectionConfirmation(
      hcs10Client,
      targetInboundTopic,
      connectionRequestId
    );

    if (!connectionTopicId) {
      logger.warning('Connection was not confirmed within timeout period');
      logger.info('The agent may still accept it later.');
      logger.info('To monitor your own incoming requests: pnpm run 03:monitor');
      return;
    }

    // Step 4: Connection established!
    logger.success('Connection established! 🤝');
    displayResult('Connection Topic', connectionTopicId);
    displayResult('View Topic', `https://hashscan.io/testnet/topic/${connectionTopicId}`);

    // Step 5: Send a message
    logger.step(4, 'Sending first message');
    
    const messagePayload = {
      type: 'greeting',
      text: 'Hello! Successfully connected via Hedera Africa Demo.',
      timestamp: new Date().toISOString()
    };

    const sendReceipt = await withSpinner('Sending message...', async () => {
      return await hcs10Client.sendMessage(
        connectionTopicId,
        JSON.stringify(messagePayload),
        'First message after connection'
      );
    });

    logger.success('Message sent!');
    displayResult('Status', sendReceipt.status.toString());
    displayResult('Transaction', `https://hashscan.io/testnet/transaction/${sendReceipt.toString()}`);

    // Save connection info
    const connectionInfo = {
      connectionTopicId,
      targetInboundTopic,
      requestId: connectionRequestId,
      established: new Date().toISOString()
    };
    
    const fs = await import('fs/promises');
    const filename = `connection-${connectionTopicId.replace(/\./g, '_')}.json`;
    await fs.writeFile(filename, JSON.stringify(connectionInfo, null, 2));
    logger.success(`Connection saved to: ${filename}`);
    
    console.log('\n📋 Next Steps:');
    console.log(`1. Send more messages: TOPIC_ID=${connectionTopicId} pnpm run 03:messages`);
    console.log('2. Monitor your incoming requests: pnpm run 03:monitor');
    console.log('3. Check connection fees: pnpm run 03:fees');

  } catch (error) {
    logger.error('Connection failed', error);
    process.exit(1);
  }

  logger.divider();
  logger.success('Demo completed! 🎉');
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});