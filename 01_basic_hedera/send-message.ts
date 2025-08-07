import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, getUserInput, sleep } from '../utils/demo-helpers';
import { TopicMessageSubmitTransaction, TopicMessageQuery, TopicId, Hbar } from '@hashgraph/sdk';

const logger = new DemoLogger('SendMessage');

async function main() {
  displayHeader('HCS Message Demo', 
    'Send and receive messages on a Hedera Consensus Service topic'
  );

  const client = createHederaClient();

  // Get topic ID from environment or user input
  let topicIdString = process.env.TOPIC_ID;
  if (!topicIdString) {
    topicIdString = getUserInput('Enter Topic ID (e.g., 0.0.123456): ');
  }

  const topicId = TopicId.fromString(topicIdString);
  logger.info(`Using topic: ${topicId.toString()}`);

  // Set up message listener
  logger.step(1, 'Setting up message listener');
  const messages: any[] = [];
  
  new TopicMessageQuery()
    .setTopicId(topicId)
    .setStartTime(0) // Get all messages
    .subscribe(client, null, (message) => {
      const messageText = Buffer.from(message.contents).toString();
      messages.push({
        sequenceNumber: message.sequenceNumber,
        timestamp: message.consensusTimestamp.toDate(),
        message: messageText
      });
      
      logger.success(`📨 New message received!`);
      displayResult('Sequence', message.sequenceNumber.toString());
      displayResult('Timestamp', message.consensusTimestamp.toDate().toISOString());
      displayResult('Message', messageText);
      console.log();
    });

  logger.info('Listener active. Waiting for messages...\n');

  // Send messages
  logger.step(2, 'Sending messages to topic');
  
  const demoMessages = [
    { text: 'Hello from Hedera Africa Demo! 🌍', delay: 2000 },
    { text: JSON.stringify({ type: 'demo', data: 'structured message' }), delay: 3000 },
    { text: `Timestamp: ${new Date().toISOString()}`, delay: 2000 }
  ];

  for (const [index, msg] of demoMessages.entries()) {
    logger.info(`Sending message ${index + 1}/${demoMessages.length}`);
    
    const submitTx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(msg.text)
      .setMaxTransactionFee(new Hbar(1));

    const txResponse = await withSpinner('Submitting message...', async () => {
      return submitTx.execute(client);
    });

    const receipt = await txResponse.getReceipt(client);
    logger.success(`Message sent! Status: ${receipt.status}`);
    displayResult('Transaction ID', txResponse.transactionId.toString());
    displayResult('View on HashScan', `https://hashscan.io/testnet/transaction/${txResponse.transactionId}`);
    
    // Wait before next message
    if (index < demoMessages.length - 1) {
      logger.info(`Waiting ${msg.delay / 1000} seconds...`);
      await sleep(msg.delay);
    }
  }

  // Allow time for messages to be received
  logger.info('\nWaiting for all messages to be received...');
  await sleep(5000);

  // Summary
  logger.divider();
  logger.success(`Demo complete! Sent ${demoMessages.length} messages`);
  logger.info(`Total messages on topic: ${messages.length}`);

  // Interactive mode
  console.log('\n💬 Enter custom messages (type "exit" to quit):');
  
  while (true) {
    const userMessage = getUserInput('> ');
    if (userMessage.toLowerCase() === 'exit') break;

    const submitTx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(userMessage);

    const txResponse = await withSpinner('Sending...', async () => {
      return await submitTx.execute(client);
    });
    const receipt = await txResponse.getReceipt(client);
    displayResult('Transaction ID', txResponse.transactionId.toString());

    logger.success('Message sent!');
  }

  logger.success('Demo completed! 🎉');
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});