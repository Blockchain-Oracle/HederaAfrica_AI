import { 
  TokenCreateTransaction, 
  TokenType, 
  TokenSupplyType,
  PrivateKey,
  AccountId,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction
} from '@hashgraph/sdk';
import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, withSpinner, getUserInput } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('CreateToken');

async function main() {
  displayHeader('Token Creation Demo', 
    'Create and manage fungible tokens on Hedera'
  );

  const client = createHederaClient();
  const operatorId = client.operatorAccountId!;
  const operatorKey = client.operatorPublicKey!;

  try {
    // Step 1: Get token details
    logger.step(1, 'Define token parameters');
    
    const tokenName = getUserInput('Token name (e.g., AfricaCoin): ') || 'DemoToken';
    const tokenSymbol = getUserInput('Token symbol (e.g., AFR): ') || 'DEMO';
    const decimals = parseInt(getUserInput('Decimals (e.g., 2): ') || '2');
    const initialSupply = parseInt(getUserInput('Initial supply (e.g., 1000000): ') || '1000000');
    
    logger.info('Token configuration:');
    displayResult('Name', tokenName);
    displayResult('Symbol', tokenSymbol);
    displayResult('Decimals', decimals);
    displayResult('Initial Supply', initialSupply.toLocaleString());

    // Step 2: Create the token
    logger.step(2, 'Creating token on Hedera');
    
    const tokenCreateTx = new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setTokenType(TokenType.FungibleCommon)
      .setSupplyType(TokenSupplyType.Infinite)
      .setInitialSupply(initialSupply)
      .setDecimals(decimals)
      .setTreasuryAccountId(operatorId)
      .setAdminKey(operatorKey)
      .setSupplyKey(operatorKey)
      .setFreezeDefault(false)
      .setTokenMemo(`Created by Hedera Africa Demo on ${new Date().toLocaleDateString()}`);

    const tokenCreateResponse = await withSpinner('Creating token...', async () => {
      const tx = await tokenCreateTx.execute(client);
      return await tx.getReceipt(client);
    });

    const tokenId = tokenCreateResponse.tokenId!;
    
    logger.success('Token created successfully!');
    displayResult('Token ID', tokenId.toString());
    displayResult('Transaction', `https://hashscan.io/testnet/token/${tokenId}`);

    // Step 3: Show token info
    logger.step(3, 'Token Information');
    console.log('\n📊 Token Details:');
    console.log(`Name: ${tokenName}`);
    console.log(`Symbol: ${tokenSymbol}`);
    console.log(`Token ID: ${tokenId}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Initial Supply: ${initialSupply.toLocaleString()}`);
    console.log(`Treasury: ${operatorId}`);

    // Step 4: Mint additional tokens (optional)
    const mintChoice = getUserInput('\nMint additional tokens? (y/n): ');
    
    if (mintChoice?.toLowerCase() === 'y') {
      const mintAmount = parseInt(getUserInput('Amount to mint: ') || '0');
      
      if (mintAmount > 0) {
        logger.step(4, 'Minting additional tokens');
        
        const mintTx = new TokenMintTransaction()
          .setTokenId(tokenId)
          .setAmount(mintAmount);

        const mintResponse = await withSpinner(`Minting ${mintAmount} tokens...`, async () => {
          const tx = await mintTx.execute(client);
          return await tx.getReceipt(client);
        });

        logger.success('Tokens minted successfully!');
        displayResult('New Supply', (initialSupply + mintAmount).toLocaleString());
        displayResult('Mint Transaction', `https://hashscan.io/testnet/transaction/${mintResponse.toString()}`);
      }
    }

    // Step 5: Transfer tokens (optional)
    const transferChoice = getUserInput('\nTransfer tokens to another account? (y/n): ');
    
    if (transferChoice?.toLowerCase() === 'y') {
      const recipientId = getUserInput('Recipient account ID: ');
      const transferAmount = parseInt(getUserInput('Amount to transfer: ') || '0');
      
      if (recipientId && transferAmount > 0) {
        logger.step(5, 'Transferring tokens');
        
        // First, recipient needs to associate with the token
        logger.info('Note: Recipient must associate with the token first');
        logger.info('In production, they would execute TokenAssociateTransaction');
        
        // For demo, we'll show the transfer transaction
        const transferTx = new TransferTransaction()
          .addTokenTransfer(tokenId, operatorId, -transferAmount)
          .addTokenTransfer(tokenId, AccountId.fromString(recipientId), transferAmount);

        logger.info('Transfer transaction prepared');
        logger.info(`Would transfer ${transferAmount} ${tokenSymbol} to ${recipientId}`);
        
        // In real scenario, execute after recipient associates
        // const transferResponse = await transferTx.execute(client);
        // const transferReceipt = await transferResponse.getReceipt(client);
      }
    }

    // Save token info
    const tokenInfo = {
      name: tokenName,
      symbol: tokenSymbol,
      tokenId: tokenId.toString(),
      decimals,
      initialSupply,
      createdAt: new Date().toISOString(),
      treasury: operatorId.toString()
    };

    const fs = await import('fs/promises');
    await fs.writeFile(`token-${tokenSymbol}.json`, JSON.stringify(tokenInfo, null, 2));
    logger.success(`Token info saved to: token-${tokenSymbol}.json`);

    console.log('\n📋 Next Steps:');
    console.log('1. Share the token ID with others to accept transfers');
    console.log('2. Use token in DeFi applications');
    console.log('3. Create NFT collections: pnpm run 07:nft');
    console.log('4. Set up scheduled transfers: pnpm run 08:schedule');

  } catch (error) {
    logger.error('Token creation failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});