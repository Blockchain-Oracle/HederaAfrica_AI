import { 
  TokenCreateTransaction, 
  TokenType, 
  TokenSupplyType,
  TokenMintTransaction,
  TokenNftInfoQuery,
  NftId,
  TransactionReceipt,
  Hbar,
  CustomRoyaltyFee,
  CustomFixedFee,
  AccountId
} from '@hashgraph/sdk';
import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, withSpinner, getUserInput } from '../utils/demo-helpers';

const logger = new DemoLogger('CreateNFT');

async function main() {
  displayHeader('NFT Creation Demo', 
    'Create and mint NFT collections on Hedera'
  );

  const client = createHederaClient();
  const operatorId = client.operatorAccountId!;

  try {
    // Step 1: Get NFT collection details
    logger.step(1, 'NFT Collection Configuration');
    
    const collectionName = getUserInput('NFT Collection Name (or press Enter for default): ') || 
      'Africa Art Collection';
    const collectionSymbol = getUserInput('Collection Symbol (or press Enter for default): ') || 
      'AFART';
    const maxSupply = parseInt(getUserInput('Max Supply (or press Enter for 100): ') || '100');

    logger.info(`Creating "${collectionName}" (${collectionSymbol})`);
    logger.info(`Maximum supply: ${maxSupply} NFTs`);

    // Step 2: Configure royalties (optional)
    logger.step(2, 'Royalty Configuration (optional)');
    
    const royaltyChoice = getUserInput('Add royalty fee? (y/n): ');
    let royaltyFee = null;
    
    if (royaltyChoice?.toLowerCase() === 'y') {
      const royaltyPercent = parseInt(getUserInput('Royalty percentage (1-100): ') || '5');
      const royaltyReceiver = getUserInput('Royalty receiver account (or press Enter for your account): ') || 
        operatorId.toString();
      
      royaltyFee = new CustomRoyaltyFee()
        .setNumerator(royaltyPercent)
        .setDenominator(100)
        .setFeeCollectorAccountId(AccountId.fromString(royaltyReceiver))
        .setFallbackFee(new CustomFixedFee().setHbarAmount(new Hbar(1)));
      
      logger.info(`Royalty: ${royaltyPercent}% to ${royaltyReceiver}`);
    }

    // Step 3: Create NFT collection
    logger.step(3, 'Creating NFT Collection');
    
    const nftCreate = new TokenCreateTransaction()
      .setTokenName(collectionName)
      .setTokenSymbol(collectionSymbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(maxSupply)
      .setInitialSupply(0)
      .setTreasuryAccountId(operatorId)
      .setSupplyKey(client.operatorPublicKey!)
      .setAdminKey(client.operatorPublicKey!)
      .setFreezeKey(client.operatorPublicKey!)
      .setWipeKey(client.operatorPublicKey!)
      .setMetadataKey(client.operatorPublicKey!)
      .setTokenMemo(`${collectionName} - Created via Hedera Africa Demo`);

    if (royaltyFee) {
      nftCreate.setCustomFees([royaltyFee]);
    }

    const nftCreateResponse = await withSpinner('Creating NFT collection...', async () => {
      const tx = await nftCreate.execute(client);
      return await tx.getReceipt(client);
    });

    const tokenId = nftCreateResponse.tokenId!;
    
    logger.success('NFT collection created!');
    displayResult('Token ID', tokenId.toString());
    displayResult('View on HashScan', `https://hashscan.io/testnet/token/${tokenId}`);

    // Step 4: Mint NFTs
    logger.step(4, 'Minting NFTs');
    
    const mintCount = parseInt(getUserInput('\nHow many NFTs to mint? (1-10): ') || '3');
    let mintResponse: any = null;
    
    if (mintCount > 0 && mintCount <= 10) {
      const nftMetadata: string[] = [];
      
      // Prepare metadata for each NFT
      for (let i = 1; i <= mintCount; i++) {
        const metadata = {
          name: `${collectionName} #${i}`,
          description: `NFT ${i} from ${collectionName}`,
          image: `https://example.com/nft/${i}.png`,
          attributes: [
            { trait_type: "Edition", value: i },
            { trait_type: "Collection", value: collectionName },
            { trait_type: "Creator", value: "Hedera Africa Demo" }
          ]
        };
        
        // Convert metadata to bytes (in real app, this would be IPFS CID)
        nftMetadata.push(Buffer.from(JSON.stringify(metadata)).toString());
      }

      const mintTx = new TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata(nftMetadata.map(m => Buffer.from(m)));

      mintResponse = await withSpinner(`Minting ${mintCount} NFTs...`, async () => {
        const tx = await mintTx.execute(client);
        return await tx.getReceipt(client);
      });

      logger.success(`Minted ${mintCount} NFTs!`);
      displayResult('Serial Numbers', mintResponse.serials.map((s: any) => s.toString()).join(', '));
      displayResult('Transaction', `https://hashscan.io/testnet/transaction/${mintResponse.toString()}`);

      // Step 5: Query NFT information
      logger.step(5, 'NFT Information');
      
      if (mintResponse.serials.length > 0) {
        const firstSerial = mintResponse.serials[0];
        const nftId = new NftId(tokenId, firstSerial);
        
        try {
          const nftInfo = await new TokenNftInfoQuery()
            .setNftId(nftId)
            .execute(client);
          
          logger.info('First NFT Details:');
          displayResult('NFT ID', `${tokenId}@${firstSerial}`);
          displayResult('Owner', nftInfo[0].accountId.toString());
          const metadata = nftInfo[0].metadata;
          if (metadata && metadata.length > 0) {
            displayResult('Metadata', Buffer.from(metadata).toString().substring(0, 100) + '...');
          }
        } catch (error) {
          logger.warning('Could not query NFT info');
        }
      }
    }

    // Step 6: Optional - Transfer NFT
    const transferChoice = getUserInput('\nTransfer an NFT to another account? (y/n): ');
    
    if (transferChoice?.toLowerCase() === 'y' && mintResponse && mintResponse.serials && mintResponse.serials.length > 0) {
      const recipientId = getUserInput('Recipient account ID: ');
      const serialToTransfer = getUserInput(`Serial number to transfer (${mintResponse.serials.join(', ')}): `);
      
      if (recipientId && serialToTransfer) {
        logger.info(`Note: For NFT transfers, the recipient must be associated with the token.`);
        logger.info(`In production, you would:`);
        logger.info(`1. Have recipient associate with token ID ${tokenId}`);
        logger.info(`2. Execute NFT transfer transaction`);
        logger.info(`3. Verify ownership change`);
        
        // In a real implementation:
        // const transferTx = new TransferTransaction()
        //   .addNftTransfer(tokenId, parseInt(serialToTransfer), operatorId, AccountId.fromString(recipientId));
      }
    }

    logger.divider();
    logger.success('NFT collection demo complete!');
    
    console.log('\n📋 Summary:');
    console.log(`- Collection: ${collectionName} (${collectionSymbol})`);
    console.log(`- Token ID: ${tokenId}`);
    console.log(`- NFTs Minted: ${mintCount}`);
    console.log(`- Max Supply: ${maxSupply}`);
    if (royaltyFee) {
      console.log(`- Royalty: Configured`);
    }
    
    console.log('\n🔗 Useful Links:');
    console.log(`- Token: https://hashscan.io/testnet/token/${tokenId}`);
    console.log(`- Your NFTs: https://hashscan.io/testnet/account/${operatorId}#nfts`);

  } catch (error) {
    logger.error('NFT creation failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});