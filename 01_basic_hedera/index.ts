import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, waitForUserInput } from '../utils/demo-helpers';
import { TransferTransaction, Hbar } from '@hashgraph/sdk';

const logger = new DemoLogger('HBARTransfer');

async function main() {
  displayHeader('Basic HBAR Transfer Demo', 
    'This demo shows how to transfer HBAR between accounts'
  );

  // Initialize client
  const client = createHederaClient();
  const myAccountId = client.operatorAccountId!;

  // Demo recipient - use BOB from env or default
  const recipientId = process.env.BOB_ACCOUNT_ID || '0.0.6348182';
  const transferAmount = 1; // 1 HBAR

  logger.info(`Sender: ${myAccountId}`);
  logger.info(`Recipient: ${recipientId}`);
  logger.info(`Amount: ${transferAmount} HBAR`);

  waitForUserInput('\nPress Enter to execute transfer...');

  try {
    // Create transfer transaction
    logger.step(1, 'Creating transfer transaction');
    const transaction = new TransferTransaction()
      .addHbarTransfer(myAccountId, Hbar.fromTinybars(-transferAmount * 100000000))
      .addHbarTransfer(recipientId, Hbar.fromTinybars(transferAmount * 100000000))
      .setTransactionMemo('Demo: Basic HBAR transfer');

    // Execute transaction
    const txResponse = await withSpinner('Executing transaction...', async () => {
      return transaction.execute(client);
    });

    logger.success('Transaction submitted');
    displayResult('Transaction ID', txResponse.transactionId.toString());

    // Get receipt
    logger.step(2, 'Getting transaction receipt');
    const receipt = await withSpinner('Waiting for confirmation...', async () => {
      return txResponse.getReceipt(client);
    });

    logger.success('Transfer confirmed!');
    displayResult('Status', receipt.status.toString());
    displayResult('Explorer Link', `https://hashscan.io/testnet/transaction/${txResponse.transactionId.toString()}`);

    // Transaction can be verified on HashScan
    logger.info(`\nTransaction ${txResponse.transactionId} can be verified on HashScan explorer`);

  } catch (error) {
    logger.error('Transfer failed', error);
    process.exit(1);
  }

  logger.divider();
  logger.success('Demo completed successfully! 🎉');
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});