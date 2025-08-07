import { HCS10Client, Logger } from '@hashgraphonline/standards-sdk';
import { TopicMessageQuery, TopicId } from '@hashgraph/sdk';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, getUserInput } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('MultiAgentChat');

// Simulated agent personalities for demo
const AGENT_PERSONAS = {
  DataAnalyst: {
    name: 'DataBot',
    expertise: 'Data analysis, statistics, trends',
    style: 'Analytical and precise'
  },
  MarketExpert: {
    name: 'MarketAI',
    expertise: 'Market trends, trading, finance',
    style: 'Strategic and profit-focused'
  },
  TechExpert: {
    name: 'TechBot',
    expertise: 'Blockchain, smart contracts, development',
    style: 'Technical and detailed'
  }
};

async function main() {
  displayHeader('Multi-Agent Collaboration Demo', 
    'Coordinate multiple AI agents working together'
  );

  try {
    // Initialize client
    const operatorId = process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID!;
    const operatorPrivateKey = process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY!;
    
    const client = new HCS10Client({
      network: 'testnet',
      operatorId: operatorId,
      operatorPrivateKey: operatorPrivateKey,
      guardedRegistryBaseUrl: process.env.REGISTRY_URL,
      logLevel: 'info'
    });

    logger.success('Client initialized');

    // Step 1: Create collaboration topic
    logger.step(1, 'Setting up collaboration environment');
    
    const { TopicCreateTransaction } = await import('@hashgraph/sdk');
    const hederaClient = (client as any).getClient();
    
    const topicTx = new TopicCreateTransaction()
      .setTopicMemo('Multi-Agent Collaboration: African Tech Analysis')
      .setSubmitKey(hederaClient.operatorPublicKey);
    
    const topicResponse = await topicTx.execute(hederaClient);
    const topicReceipt = await topicResponse.getReceipt(hederaClient);
    const collaborationTopicId = topicReceipt.topicId!;
    
    logger.success('Collaboration topic created');
    displayResult('Topic ID', collaborationTopicId.toString());
    displayResult('View on HashScan', `https://hashscan.io/testnet/topic/${collaborationTopicId}`);

    // Step 2: Set up message monitoring
    logger.step(2, 'Starting collaboration monitor');
    
    const messages: any[] = [];
    let messageCount = 0;
    
    new TopicMessageQuery()
      .setTopicId(collaborationTopicId)
      .subscribe(hederaClient, null, (message) => {
        const contents = Buffer.from(message.contents).toString();
        try {
          const parsed = JSON.parse(contents);
          messages.push(parsed);
          messageCount++;
          
          console.log(`\n💬 [${parsed.agent}]: ${parsed.message}`);
          if (parsed.data) {
            console.log(`   📊 Data: ${JSON.stringify(parsed.data)}`);
          }
        } catch {
          console.log(`\n📝 Message: ${contents}`);
        }
      });

    logger.info('Monitor active - messages will appear above');

    // Step 3: Simulate multi-agent collaboration
    logger.step(3, 'Multi-Agent Collaboration');
    
    const topic = getUserInput('\nCollaboration topic (or press Enter for default): ') || 
                  'African startup ecosystem analysis';
    
    console.log(`\n🤝 Starting collaboration on: "${topic}"`);
    console.log('Agents will coordinate to analyze different aspects...\n');

    // Simulate agent messages
    const agentMessages = [
      {
        agent: AGENT_PERSONAS.DataAnalyst.name,
        message: `I'll analyze the data trends for ${topic}`,
        data: { focus: 'statistics', timeframe: '2024-2025' }
      },
      {
        agent: AGENT_PERSONAS.MarketExpert.name,
        message: 'I can provide market insights and investment opportunities',
        data: { sectors: ['fintech', 'agtech', 'healthtech'] }
      },
      {
        agent: AGENT_PERSONAS.TechExpert.name,
        message: "I'll examine the technical infrastructure and blockchain adoption",
        data: { technologies: ['Hedera', 'AI', 'DeFi'] }
      },
      {
        agent: AGENT_PERSONAS.DataAnalyst.name,
        message: 'Initial analysis shows 150% growth in African tech startups',
        data: { 
          growth_rate: '150%',
          top_countries: ['Nigeria', 'Kenya', 'South Africa'],
          funding_raised: '$5.2B in 2024'
        }
      },
      {
        agent: AGENT_PERSONAS.MarketExpert.name,
        message: 'Fintech leads with 40% of all investments. Great opportunities in:',
        data: {
          opportunities: [
            'Cross-border payments',
            'Micro-lending platforms',
            'Blockchain remittances'
          ]
        }
      },
      {
        agent: AGENT_PERSONAS.TechExpert.name,
        message: 'Hedera adoption increasing for tokenization and DeFi projects',
        data: {
          active_projects: 47,
          transaction_volume: '2.3M monthly',
          use_cases: ['Supply chain', 'Identity', 'Payments']
        }
      }
    ];

    // Send messages with delays
    for (const msg of agentMessages) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await client.sendMessage(
        collaborationTopicId.toString(),
        JSON.stringify(msg),
        `${msg.agent} contribution`
      );
    }

    // Wait for messages to be received
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Synthesize results
    logger.step(4, 'Collaboration Summary');
    
    console.log('\n📊 Collaborative Analysis Complete:');
    console.log('\n1. Data Insights:');
    console.log('   - 150% growth in African tech startups');
    console.log('   - $5.2B funding raised in 2024');
    console.log('   - Top hubs: Nigeria, Kenya, South Africa');
    
    console.log('\n2. Market Opportunities:');
    console.log('   - Fintech dominates with 40% of investments');
    console.log('   - Key areas: Payments, lending, blockchain');
    
    console.log('\n3. Technical Landscape:');
    console.log('   - 47 active Hedera projects');
    console.log('   - Growing DeFi ecosystem');
    console.log('   - Focus on real-world utility');

    // Interactive mode
    console.log('\n💬 Continue the collaboration:');
    console.log('Type messages to add to the discussion (or "exit" to quit)\n');

    while (true) {
      const input = getUserInput('You: ');
      
      if (input.toLowerCase() === 'exit') {
        break;
      }
      
      if (input.trim()) {
        await client.sendMessage(
          collaborationTopicId.toString(),
          JSON.stringify({
            agent: 'Human',
            message: input,
            timestamp: new Date().toISOString()
          }),
          'Human input'
        );
      }
    }

    logger.divider();
    logger.success('Multi-agent collaboration complete!');
    console.log(`\n📝 Total messages exchanged: ${messageCount}`);
    console.log(`🔗 Review full conversation: https://hashscan.io/testnet/topic/${collaborationTopicId}`);

  } catch (error) {
    logger.error('Demo failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});