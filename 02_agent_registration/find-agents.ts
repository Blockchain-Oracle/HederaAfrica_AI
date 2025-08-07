import { HCS10Client } from '@hashgraphonline/standards-sdk';
import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, getUserInput, getUserChoice } from '../utils/demo-helpers';
import chalk from 'chalk';

const logger = new DemoLogger('FindAgents');

async function main() {
  displayHeader('Find HCS-10 Agents Demo', 
    'Search for AI agents registered on the Hedera network'
  );

  // Initialize clients
  const hederaClient = createHederaClient();
  
  logger.step(1, 'Initializing HCS-10 client');
  const hcs10Client = await withSpinner('Setting up HCS-10 client...', async () => {
    return new HCS10Client({
      network: 'testnet',
      operatorId: hederaClient.operatorAccountId!.toString(),
      operatorPrivateKey: hederaClient.operatorPrivateKey?.toString() || process.env.HEDERA_PRIVATE_KEY!
    });
  });

  logger.info('\n⚠️  Note: Agent discovery features are limited in the current SDK version');
  logger.info('\nIn a production environment, you would be able to:');
  logger.info('- Search agents by tags');
  logger.info('- Find agents by name');
  logger.info('- List recent registrations');
  logger.info('- Query agent capabilities');
  
  logger.divider();
  logger.info('For this demo, you can:');
  logger.info('1. Use known agent IDs from your environment');
  logger.info('2. Check your agent-config.json from registration');
  logger.info('3. Use the example agents below');
  
  // Example agents for demonstration
  const exampleAgents = [
    {
      name: 'Your Agent (if registered)',
      accountId: hederaClient.operatorAccountId?.toString() || 'Not registered',
      description: 'Check agent-config.json for details'
    },
    {
      name: 'Alice (from .env)',
      accountId: process.env.ALICE_ACCOUNT_ID || '0.0.6348176',
      description: 'Demo agent for testing connections'
    },
    {
      name: 'Bob (from .env)',
      accountId: process.env.BOB_ACCOUNT_ID || '0.0.6348182',
      description: 'Demo agent for testing connections'
    }
  ];
  
  logger.success('\nKnown Agents:');
  exampleAgents.forEach((agent, index) => {
    console.log(chalk.bold(`\n${index + 1}. ${agent.name}`));
    console.log(chalk.gray(`   Account: ${agent.accountId}`));
    console.log(chalk.gray(`   ${agent.description}`));
  });
  
  try {

    // Show connection instructions
    logger.divider();
    console.log('\n💡 Next Steps:');
    console.log('   1. Register your own agent: pnpm run 02:register');
    console.log('   2. Connect to agents: pnpm run 03:connect');
    console.log('   3. Send messages: pnpm run 03:message');
    
    logger.info('\n🔍 To discover agents in production:');
    logger.info('- Query the HCS-10 registry topics');
    logger.info('- Use the SDK discovery methods when available');
    logger.info('- Check the Hedera mirror node REST API');

  } catch (error) {
    logger.error('Search failed', error);
    process.exit(1);
  }

  logger.divider();
  logger.success('Demo completed! 🎉');
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});