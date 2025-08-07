import { 
  ScheduleCreateTransaction,
  TransferTransaction,
  Hbar,
  AccountId,
  ScheduleInfoQuery,
  ScheduleSignTransaction
} from '@hashgraph/sdk';
import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, withSpinner, getUserInput } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('ScheduleTransfer');

async function main() {
  displayHeader('Scheduled Transaction Demo', 
    'Create transactions that execute when conditions are met'
  );

  const client = createHederaClient();
  const operatorId = client.operatorAccountId!;

  try {
    // Step 1: Get transaction details
    logger.step(1, 'Configure scheduled transfer');
    
    const recipientId = getUserInput('Recipient account ID (or press Enter for treasury): ') || '0.0.98';
    const amount = parseFloat(getUserInput('Amount in HBAR (e.g., 5): ') || '1');
    const delayMinutes = parseInt(getUserInput('Execute after how many signatures? (e.g., 2): ') || '1');
    
    displayResult('From', operatorId.toString());
    displayResult('To', recipientId);
    displayResult('Amount', `${amount} HBAR`);
    displayResult('Required Signatures', delayMinutes.toString());

    // Step 2: Create the transfer transaction (but don't execute it)
    logger.step(2, 'Creating scheduled transaction');
    
    const transferTx = new TransferTransaction()
      .addHbarTransfer(operatorId, Hbar.fromTinybars(-amount * 100000000))
      .addHbarTransfer(AccountId.fromString(recipientId), Hbar.fromTinybars(amount * 100000000))
      .setTransactionMemo(`Scheduled transfer: ${amount} HBAR`);

    // Create a scheduled transaction
    const scheduleTx = new ScheduleCreateTransaction()
      .setScheduledTransaction(transferTx)
      .setScheduleMemo(`Demo scheduled transfer - requires ${delayMinutes} signatures`)
      .setAdminKey(client.operatorPublicKey!)
      .setPayerAccountId(operatorId); // Who pays when it executes

    const scheduleResponse = await withSpinner('Creating scheduled transaction...', async () => {
      const response = await scheduleTx.execute(client);
      return await response.getReceipt(client);
    });

    const scheduleId = scheduleResponse.scheduleId!;
    
    logger.success('Scheduled transaction created!');
    displayResult('Schedule ID', scheduleId.toString());
    displayResult('View on HashScan', `https://hashscan.io/testnet/schedule/${scheduleId}`);

    // Step 3: Query schedule info
    logger.step(3, 'Querying schedule information');
    
    const scheduleInfo = await withSpinner('Getting schedule details...', async () => {
      return new ScheduleInfoQuery()
        .setScheduleId(scheduleId)
        .execute(client);
    });

    logger.info('Schedule Details:');
    displayResult('Schedule ID', scheduleInfo.scheduleId.toString());
    displayResult('Creator', scheduleInfo.creatorAccountId?.toString() || 'Unknown');
    displayResult('Payer', scheduleInfo.payerAccountId?.toString() || 'Creator');
    displayResult('Expiration', scheduleInfo.expirationTime?.toDate().toLocaleString() || 'Default');
    
    // Step 4: Sign the scheduled transaction
    logger.step(4, 'Signing the scheduled transaction');
    
    const signChoice = getUserInput('\nSign the scheduled transaction now? (y/n): ');
    
    if (signChoice?.toLowerCase() === 'y') {
      const signTx = new ScheduleSignTransaction()
        .setScheduleId(scheduleId);

      const signResponse = await withSpinner('Signing scheduled transaction...', async () => {
        const response = await signTx.execute(client);
        return await response.getReceipt(client);
      });

      logger.success('Transaction signed!');
      displayResult('Sign Transaction', `https://hashscan.io/testnet/transaction/${signResponse.toString()}`);
      
      // Check if it executed
      if (delayMinutes === 1) {
        logger.info('Transaction should execute immediately since only 1 signature was required');
      } else {
        logger.info(`Transaction needs ${delayMinutes - 1} more signature(s) to execute`);
      }
    }

    // Step 5: Multi-signature example
    logger.step(5, 'Multi-Signature Scheduling');
    
    console.log('\n📝 Multi-Signature Use Cases:');
    console.log('1. **Escrow Payments**');
    console.log('   - Buyer creates scheduled payment');
    console.log('   - Seller delivers goods');
    console.log('   - Both sign to release payment');
    
    console.log('\n2. **DAO Treasury**');
    console.log('   - Member proposes payment');
    console.log('   - Requires 3/5 council signatures');
    console.log('   - Executes when threshold met');
    
    console.log('\n3. **Time-Locked Vesting**');
    console.log('   - Schedule token transfers');
    console.log('   - Add time-based conditions');
    console.log('   - Automatic execution');

    // Save schedule info
    const scheduleData = {
      scheduleId: scheduleId.toString(),
      type: 'HBAR Transfer',
      amount: amount,
      from: operatorId.toString(),
      to: recipientId,
      createdAt: new Date().toISOString(),
      requiredSignatures: delayMinutes,
      memo: scheduleInfo.scheduleMemo || ''
    };

    const fs = await import('fs/promises');
    await fs.writeFile(`schedule-${scheduleId}.json`, JSON.stringify(scheduleData, null, 2));
    logger.success(`Schedule info saved to: schedule-${scheduleId}.json`);

    console.log('\n📋 Next Steps:');
    console.log(`1. Share Schedule ID (${scheduleId}) with other signers`);
    console.log('2. Monitor execution status on HashScan');
    console.log('3. Create complex multi-sig workflows');
    console.log('4. Build approval systems for AI agents');

  } catch (error) {
    logger.error('Scheduling failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});