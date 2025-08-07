import HgraphSDK from '@hgraph.io/sdk';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, getUserInput, withSpinner } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('HgraphQueries');

async function main() {
  displayHeader('Hedera Data Analysis with Hgraph', 
    'Query blockchain data using GraphQL for AI insights'
  );

  try {
    // Check for API key
    if (!process.env.HGRAPH_API_KEY) {
      logger.warning('HGRAPH_API_KEY not found in environment');
      logger.info('Get your free API key at: https://hgraph.io');
      logger.info('For demo purposes, we\'ll show example queries\n');
    }

    // Initialize Hgraph client
    logger.step(1, 'Initializing Hgraph SDK');
    
    const hgraph = new HgraphSDK({
      headers: {
        'x-api-key': process.env.HGRAPH_API_KEY || 'demo-key',
      },
    });

    logger.success('Hgraph client initialized');

    // Demo queries
    const accountId = getUserInput('Enter account ID to analyze (or press Enter for demo): ') || 
                     process.env.DEMO_ACCOUNT_ID || 
                     '0.0.98';

    // Query 1: Account Overview
    logger.step(2, 'Querying account information');
    
    try {
      const accountData = await withSpinner('Fetching account data...', async () => {
        const { data } = await hgraph.query({
          query: `
            query AccountOverview($accountId: String!) {
              account(where: { account_id: { _eq: $accountId }}) {
                account_id
                alias
                balance
                created_timestamp
                max_automatic_token_associations
                memo
                ethereum_nonce
                
                # Token holdings
                account_balance(limit: 10) {
                  token_id
                  balance
                  token {
                    name
                    symbol
                    decimals
                    type
                    total_supply
                  }
                }
              }
            }
          `,
          variables: { accountId }
        });
        return (data as any).account[0];
      });

      if (accountData) {
        logger.success('Account data retrieved');
        displayResult('Account', accountData.account_id);
        displayResult('Balance', `${(accountData.balance / 100000000).toFixed(8)} HBAR`);
        displayResult('Created', new Date(accountData.created_timestamp).toLocaleDateString());
        
        if (accountData.account_balance?.length > 0) {
          console.log('\n🪙 Token Holdings:');
          accountData.account_balance.forEach((holding: any) => {
            const balance = holding.balance / Math.pow(10, holding.token.decimals);
            console.log(`- ${holding.token.name} (${holding.token.symbol}): ${balance.toLocaleString()}`);
          });
        }
      }
    } catch (error) {
      logger.warning('Could not fetch account data (API key may be required)');
    }

    // Query 2: Recent Transactions
    logger.step(3, 'Analyzing recent activity');
    
    try {
      const recentActivity = await withSpinner('Fetching recent transactions...', async () => {
        const { data } = await hgraph.query({
          query: `
            query RecentActivity($accountId: String!) {
              crypto_transfer(
                where: { 
                  _or: [
                    { account_id: { _eq: $accountId }},
                    { transfers: { _contains: { account_id: $accountId }}}
                  ]
                }
                order_by: { consensus_timestamp: desc }
                limit: 5
              ) {
                consensus_timestamp
                charged_tx_fee
                transfers
                transaction_hash
              }
            }
          `,
          variables: { accountId }
        });
        return (data as any).crypto_transfer;
      });

      if (recentActivity && recentActivity.length > 0) {
        console.log('\n📊 Recent Transactions:');
        recentActivity.forEach((tx: any, idx: number) => {
          console.log(`\n${idx + 1}. ${new Date(tx.consensus_timestamp).toLocaleString()}`);
          console.log(`   Fee: ${(tx.charged_tx_fee / 100000000).toFixed(8)} HBAR`);
          console.log(`   Hash: ${tx.transaction_hash}`);
        });
      }
    } catch (error) {
      logger.warning('Could not fetch transaction data');
    }

    // Query 3: Network Statistics
    logger.step(4, 'Network Statistics');
    
    console.log('\n📈 Example Network Queries:');
    console.log('1. Total accounts created today');
    console.log('2. Most active tokens by transfer count');
    console.log('3. NFT collections by holder count');
    console.log('4. DeFi protocol activity');
    
    // Show subscription example
    logger.step(5, 'Real-time Data Subscriptions');
    
    console.log('\n🔄 Example Subscription (not executed):');
    console.log(`
const subscription = hgraph.subscribe({
  query: \`
    subscription TokenTransfers {
      token_transfer_stream(
        where: { token_id: { _eq: "0.0.1234567" }}
        limit: 10
      ) {
        from_account_id
        to_account_id
        amount
        consensus_timestamp
      }
    }
  \`
}, {
  next: ({ data }) => {
    // Process real-time transfers
    console.log('New transfer:', data);
  }
});
`);

    // AI Integration Ideas
    logger.divider();
    logger.info('🤖 AI Agent Integration Ideas:');
    console.log('\n1. Portfolio Analysis Agent:');
    console.log('   - Track token holdings and values');
    console.log('   - Analyze trading patterns');
    console.log('   - Generate investment insights');
    
    console.log('\n2. Whale Watcher Agent:');
    console.log('   - Monitor large transfers');
    console.log('   - Detect unusual activity');
    console.log('   - Alert on market movements');
    
    console.log('\n3. NFT Recommendation Agent:');
    console.log('   - Analyze collection trends');
    console.log('   - Find similar holders');
    console.log('   - Suggest acquisitions');

    console.log('\n📚 Learn more:');
    console.log('- Hgraph Docs: https://docs.hgraph.io');
    console.log('- GraphQL Playground: https://api.hgraph.io/v1/graphql');
    console.log('- Get API Key: https://hgraph.io');

  } catch (error) {
    logger.error('Demo failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});