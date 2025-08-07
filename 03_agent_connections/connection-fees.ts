import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, getUserInput, getUserChoice } from '../utils/demo-helpers';
import { TransferTransaction, Hbar, AccountId, TopicCreateTransaction, ScheduleCreateTransaction, Timestamp } from '@hashgraph/sdk';

const logger = new DemoLogger('ConnectionFees');

async function main() {
  displayHeader('Fee-Based Connection Demo', 
    'Demonstrate HBAR payment for services using real transactions'
  );

  logger.info('This demo shows real fee-based interactions:');
  logger.info('- Create a service that requires payment');
  logger.info('- Execute actual HBAR transfers');
  logger.info('- Verify transactions on HashScan');

  const hederaClient = createHederaClient();
  const myAccountId = hederaClient.operatorAccountId!;

  try {
    // Step 1: Create a service topic
    logger.step(1, 'Creating a paid service topic');
    
    const serviceTopic = await withSpinner('Creating service topic...', async () => {
      const topicTx = new TopicCreateTransaction()
        .setTopicMemo('Premium AI Service - 1 HBAR per query')
        .setSubmitKey(hederaClient.operatorPublicKey!);
      
      const txResponse = await topicTx.execute(hederaClient);
      const receipt = await txResponse.getReceipt(hederaClient);
      
      return {
        topicId: receipt.topicId!,
        transactionId: txResponse.transactionId
      };
    });

    logger.success('Service topic created!');
    displayResult('Topic ID', serviceTopic.topicId.toString());
    displayResult('Transaction', `https://hashscan.io/testnet/transaction/${serviceTopic.transactionId}`);

    // Step 2: Show fee structure
    logger.step(2, 'Service Fee Structure');
    
    const feeOptions = [
      { name: 'Basic Query', amount: 0.5, description: 'Simple AI response' },
      { name: 'Advanced Analysis', amount: 1, description: 'Detailed AI analysis' },
      { name: 'Premium Service', amount: 5, description: 'Full AI consultation' }
    ];

    logger.info('\nAvailable services:');
    feeOptions.forEach((opt, i) => {
      console.log(`${i + 1}. ${opt.name} - ${opt.amount} HBAR`);
      console.log(`   ${opt.description}`);
    });

    const serviceChoice = getUserChoice('\nSelect service to demonstrate:', feeOptions.map(o => o.name));
    
    if (serviceChoice === -1) {
      logger.info('Demo cancelled');
      return;
    }

    const selectedService = feeOptions[serviceChoice];
    const recipientId = getUserInput('\nRecipient account (or press Enter for treasury): ') || '0.0.98';

    // Step 3: Execute the fee payment
    logger.step(3, 'Executing fee payment');
    
    const paymentTx = await withSpinner(`Sending ${selectedService.amount} HBAR for ${selectedService.name}...`, async () => {
      const transaction = new TransferTransaction()
        .addHbarTransfer(myAccountId, Hbar.fromTinybars(-selectedService.amount * 100000000))
        .addHbarTransfer(AccountId.fromString(recipientId), Hbar.fromTinybars(selectedService.amount * 100000000))
        .setTransactionMemo(`Payment for: ${selectedService.name}`);
      
      const txResponse = await transaction.execute(hederaClient);
      const receipt = await txResponse.getReceipt(hederaClient);
      
      return {
        transactionId: txResponse.transactionId,
        status: receipt.status
      };
    });

    logger.success('Payment completed!');
    displayResult('Transaction ID', paymentTx.transactionId.toString());
    displayResult('Status', paymentTx.status.toString());
    displayResult('View Payment', `https://hashscan.io/testnet/transaction/${paymentTx.transactionId}`);

    // Step 4: Demonstrate scheduled payment (optional)
    logger.step(4, 'Advanced: Scheduled Payments');
    
    const scheduleChoice = getUserChoice('Create a scheduled payment?', ['Yes', 'No']);
    
    if (scheduleChoice === 0) {
      logger.info('Creating a scheduled payment (executes in 2 minutes)...');
      
      const scheduledAmount = 0.1;
      const scheduleTx = new TransferTransaction()
        .addHbarTransfer(myAccountId, Hbar.fromTinybars(-scheduledAmount * 100000000))
        .addHbarTransfer(AccountId.fromString(recipientId), Hbar.fromTinybars(scheduledAmount * 100000000))
        .setTransactionMemo('Scheduled service payment');

      const scheduleCreate = await withSpinner('Creating scheduled transaction...', async () => {
        const scheduled = new ScheduleCreateTransaction()
          .setScheduledTransaction(scheduleTx)
          .setScheduleMemo('Deferred payment demo')
          .setExpirationTime(Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))); // 24 hours
        
        const txResponse = await scheduled.execute(hederaClient);
        const receipt = await txResponse.getReceipt(hederaClient);
        
        return {
          scheduleId: receipt.scheduleId!,
          transactionId: txResponse.transactionId
        };
      });

      logger.success('Scheduled payment created!');
      displayResult('Schedule ID', scheduleCreate.scheduleId.toString());
      displayResult('Transaction', `https://hashscan.io/testnet/transaction/${scheduleCreate.transactionId}`);
      logger.info('The payment will execute when signed by required parties');
    }

    // Summary
    logger.divider();
    logger.success('Fee-Based Service Demo Complete! 🎉');
    
    console.log('\n📊 What we demonstrated:');
    console.log('✅ Created a real service topic on Hedera');
    console.log('✅ Executed actual HBAR payment for service');
    console.log('✅ All transactions verifiable on HashScan');
    console.log('✅ Optional scheduled payments for deferred billing');
    
    console.log('\n💡 In production, this could be used for:');
    console.log('- AI agents charging for premium responses');
    console.log('- Data providers monetizing their services');
    console.log('- Automated service billing and subscriptions');
    console.log('- Multi-party fee splitting for platforms');

  } catch (error) {
    logger.error('Demo failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});