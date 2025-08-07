import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, waitForUserInput } from '../utils/demo-helpers';
import { TopicCreateTransaction, TopicInfoQuery, Hbar } from '@hashgraph/sdk';

const logger = new DemoLogger('CreateTopic');

async function main() {
  displayHeader('HCS Topic Creation Demo', 
    'This demo creates a Hedera Consensus Service (HCS) topic'
  );

  const client = createHederaClient();

  logger.info('Topics are used for:');
  logger.info('- Decentralized messaging');
  logger.info('- Agent communication (HCS-10)');
  logger.info('- Event logging');
  logger.info('- Data timestamping');

  waitForUserInput('\nPress Enter to create a topic...');

  try {
    // Create topic transaction
    logger.step(1, 'Creating topic transaction');
    const topicTx = new TopicCreateTransaction()
      .setTopicMemo('Demo: HCS Topic for messaging')
      .setSubmitKey(client.operatorPublicKey!) // Optional: restrict who can submit
      .setMaxTransactionFee(new Hbar(2));

    // Execute transaction
    const txResponse = await withSpinner('Creating topic...', async () => {
      return topicTx.execute(client);
    });

    logger.success('Transaction submitted');
    displayResult('Transaction ID', txResponse.transactionId.toString());

    // Get receipt with topic ID
    logger.step(2, 'Getting topic ID from receipt');
    const receipt = await withSpinner('Waiting for confirmation...', async () => {
      return txResponse.getReceipt(client);
    });

    const topicId = receipt.topicId!;
    logger.success('Topic created successfully!');
    displayResult('Topic ID', topicId.toString());
    displayResult('Status', receipt.status.toString());

    // Query topic info
    logger.step(3, 'Querying topic information');
    const topicInfo = await withSpinner('Fetching topic details...', async () => {
      return new TopicInfoQuery()
        .setTopicId(topicId)
        .execute(client);
    });

    displayResult('Topic Memo', topicInfo.topicMemo);
    displayResult('Sequence Number', topicInfo.sequenceNumber.toString());
    displayResult('Running Hash', Buffer.from(topicInfo.runningHash).toString('hex').substring(0, 16) + '...');

    // Save for use in send-message.ts
    console.log('\n💡 To send messages to this topic, run:');
    console.log(`   TOPIC_ID=${topicId} pnpm run 01:message`);

    // Show explorer link
    console.log('\n📊 View on HashScan:');
    console.log(`https://hashscan.io/testnet/topic/${topicId.toString()}`);

  } catch (error) {
    logger.error('Topic creation failed', error);
    process.exit(1);
  }

  logger.divider();
  logger.success('Demo completed successfully! 🎉');
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});