import { HCS10Client, Logger, FeeConfigBuilder } from '@hashgraphonline/standards-sdk';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, getUserChoice } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('MonitorIncoming');

async function monitorIncomingRequests(
  client: HCS10Client,
  inboundTopicId: string,
  feeConfig?: FeeConfigBuilder
): Promise<void> {
  let lastProcessedMessage = 0;
  const processedRequestIds = new Set<number>();
  
  logger.info(`Monitoring incoming requests on topic ${inboundTopicId}`);
  logger.info('Press Ctrl+C to stop monitoring\n');

  while (true) {
    try {
      const messages = await client.getMessages(inboundTopicId);
      
      // Check for already processed connections
      const connectionCreatedMessages = messages.messages.filter(
        (msg: any) => msg.op === 'connection_created'
      );
      
      connectionCreatedMessages.forEach((msg: any) => {
        if (msg.connection_id) {
          processedRequestIds.add(msg.connection_id);
        }
      });
      
      // Find new connection requests
      const connectionRequests = messages.messages.filter(
        (msg: any) =>
          msg.op === 'connection_request' &&
          msg.sequence_number > lastProcessedMessage
      );

      for (const message of connectionRequests) {
        lastProcessedMessage = Math.max(lastProcessedMessage, message.sequence_number);
        
        const operatorId = message.operator_id || '';
        const accountId = client.extractAccountFromOperatorId(operatorId);
        
        if (!accountId) {
          logger.warning('Invalid operator_id format, skipping');
          continue;
        }

        const connectionRequestId = message.sequence_number;
        
        if (processedRequestIds.has(connectionRequestId)) {
          logger.info(`Request #${connectionRequestId} already processed, skipping`);
          continue;
        }

        // New connection request!
        logger.info('🔔 New connection request received!');
        displayResult('From', accountId);
        displayResult('Request ID', connectionRequestId.toString());
        displayResult('Message', message.data || 'No message');
        displayResult('Time', message.created ? new Date(message.created).toLocaleString() : 'Unknown');

        try {
          logger.info('Auto-accepting connection request...');
          
          const { connectionTopicId } = await client.handleConnectionRequest(
            inboundTopicId,
            accountId,
            connectionRequestId,
            feeConfig
          );

          processedRequestIds.add(connectionRequestId);
          
          logger.success('Connection accepted! 🤝');
          displayResult('Connection Topic', connectionTopicId);
          displayResult('View on HashScan', `https://hashscan.io/testnet/topic/${connectionTopicId}`);
          
          // Send welcome message
          const welcomeMessage = {
            type: 'welcome',
            text: 'Connection accepted! Welcome from Hedera Africa Demo.',
            timestamp: new Date().toISOString()
          };
          
          const receipt = await client.sendMessage(
            connectionTopicId,
            JSON.stringify(welcomeMessage),
            'Welcome message'
          );
          
          logger.info('Welcome message sent');
          displayResult('Message Tx', `https://hashscan.io/testnet/transaction/${receipt.toString()}`);
          
        } catch (error) {
          logger.error(`Error handling request #${connectionRequestId}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error monitoring requests:', error);
    }

    // Poll every 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function main() {
  displayHeader('Monitor Incoming Connections', 
    'Accept connection requests from other agents'
  );

  try {
    // Initialize client
    const accountId = process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY;
    const inboundTopicId = process.env.DEMO_INBOUND_TOPIC_ID;

    if (!accountId || !privateKey) {
      throw new Error('Account credentials not found. Run 02:register first to create an agent.');
    }

    if (!inboundTopicId) {
      logger.error('No inbound topic found. Your agent needs an inbound topic to receive requests.');
      logger.info('Run "pnpm run 02:register" to create a complete agent.');
      process.exit(1);
    }

    const client = new HCS10Client({
      network: 'testnet',
      operatorId: accountId,
      operatorPrivateKey: privateKey,
      guardedRegistryBaseUrl: process.env.REGISTRY_URL,
      prettyPrint: true,
      logLevel: 'info'
    });

    logger.info('Agent Details:');
    displayResult('Account', accountId);
    displayResult('Inbound Topic', inboundTopicId);
    displayResult('View Topic', `https://hashscan.io/testnet/topic/${inboundTopicId}`);

    // Fee configuration
    logger.info('\nConnection Fee Options:');
    const feeChoice = getUserChoice('Select fee structure:', [
      'No fees (accept all connections)',
      '0.5 HBAR fee',
      '1 HBAR fee'
    ]);

    let feeConfig: FeeConfigBuilder | undefined;
    const sdkLogger = new Logger({ module: 'Fees', level: 'info' });

    switch (feeChoice) {
      case 1:
        feeConfig = new FeeConfigBuilder({ network: 'testnet', logger: sdkLogger })
          .addHbarFee(0.5, accountId);
        logger.info('Set 0.5 HBAR connection fee');
        break;
      case 2:
        feeConfig = new FeeConfigBuilder({ network: 'testnet', logger: sdkLogger })
          .addHbarFee(1, accountId);
        logger.info('Set 1 HBAR connection fee');
        break;
      default:
        logger.info('Accepting all connections without fees');
    }

    logger.divider();
    logger.info('Share these details with agents who want to connect:');
    console.log(`\n📋 Connection Instructions:`);
    console.log(`Inbound Topic ID: ${inboundTopicId}`);
    if (feeConfig) {
      const fee = feeChoice === 1 ? '0.5' : '1';
      console.log(`Connection Fee: ${fee} HBAR`);
    }
    console.log('\nTo connect: pnpm run 03:connect');
    console.log(`When prompted, enter: ${inboundTopicId}`);

    // Start monitoring
    await monitorIncomingRequests(client, inboundTopicId, feeConfig);

  } catch (error) {
    logger.error('Monitoring failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});