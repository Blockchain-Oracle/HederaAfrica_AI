import { HCS10Client, AIAgentCapability } from '@hashgraphonline/standards-sdk';
import { ChatOpenAI } from '@langchain/openai';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, getUserInput, waitForUserInput } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('LangChainAgent');

// Map string tags to AIAgentCapability enum values
function mapTagsToCapabilities(tags: string[]): AIAgentCapability[] {
  const mapping: Record<string, AIAgentCapability> = {
    'ai': AIAgentCapability.TEXT_GENERATION,
    'text': AIAgentCapability.TEXT_GENERATION,
    'image': AIAgentCapability.IMAGE_GENERATION,
    'code': AIAgentCapability.CODE_GENERATION,
    'data': AIAgentCapability.DATA_INTEGRATION,
    'defi': AIAgentCapability.TRANSACTION_ANALYTICS,
    'nft': AIAgentCapability.MARKET_INTELLIGENCE,
    'trading': AIAgentCapability.TRANSACTION_ANALYTICS,
    'analytics': AIAgentCapability.TRANSACTION_ANALYTICS,
    'security': AIAgentCapability.SECURITY_MONITORING,
    'governance': AIAgentCapability.GOVERNANCE_FACILITATION,
    'compliance': AIAgentCapability.COMPLIANCE_ANALYSIS,
    'fraud': AIAgentCapability.FRAUD_DETECTION,
    'api': AIAgentCapability.API_INTEGRATION,
    'workflow': AIAgentCapability.WORKFLOW_AUTOMATION
  };

  return tags.map(tag => mapping[tag.toLowerCase()])
    .filter(capability => capability !== undefined);
}

async function main() {
  displayHeader('LangChain AI Agent Demo', 
    'Build an autonomous AI agent that can interact with Hedera'
  );

  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      logger.warning('OPENAI_API_KEY not found in .env file');
      logger.info('You can get an API key from: https://platform.openai.com/api-keys');
      logger.info('Add it to your .env file: OPENAI_API_KEY=sk-...');
      process.exit(1);
    }

    // Step 1: Initialize HCS-10 client
    logger.step(1, 'Setting up HCS-10 client');
    
    const operatorId = process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID!;
    const operatorPrivateKey = process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY!;

    const client = new HCS10Client({
      network: 'testnet',
      operatorId: operatorId,
      operatorPrivateKey: operatorPrivateKey,
      guardedRegistryBaseUrl: process.env.REGISTRY_URL,
      logLevel: 'info'
    });

    logger.success('HCS-10 client initialized');

    // Step 2: Initialize LangChain
    logger.step(2, 'Setting up AI model');
    
    const model = new ChatOpenAI({
      temperature: 0.7,
      modelName: 'gpt-4',
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    logger.success('AI model ready');

    // Step 3: Interactive AI Agent
    logger.step(3, 'Interactive AI Agent');
    logger.info('The AI agent can help you:');
    logger.info('- Find agents in the registry');
    logger.info('- Understand agent capabilities');
    logger.info('- Generate connection requests');
    logger.info('- Process agent messages');

    console.log('\n💬 Chat with the AI agent (type "exit" to quit)\n');

    // Get initial agents
    const registrationResult = await client.findRegistrations({});
    const agents = registrationResult.registrations || [];
    
    const context = {
      availableAgents: agents.length,
      registry: process.env.REGISTRY_URL || 'default registry',
      network: 'testnet'
    };

    while (true) {
      const userInput = getUserInput('You: ');
      
      if (userInput.toLowerCase() === 'exit') {
        break;
      }

      // Create a prompt with context
      const prompt = `You are an AI assistant helping users interact with Hedera blockchain agents.
Context:
- Network: ${context.network}
- Registry: ${context.registry}
- Available agents: ${context.availableAgents}

User request: ${userInput}

Provide a helpful response about Hedera agents, connections, or blockchain interactions.`;

      try {
        const response = await model.invoke(prompt);
        console.log(`\n🤖 Agent: ${response.content}\n`);

        // Demo: If user asks about agents, show some real ones
        if (userInput.toLowerCase().includes('agent') || 
            userInput.toLowerCase().includes('find') ||
            userInput.toLowerCase().includes('list')) {
          
          logger.info('Fetching real agents from registry...');
          const searchTags = userInput.match(/\b(ai|defi|nft|data|trading)\b/gi) || [];
          const capabilities = mapTagsToCapabilities(searchTags);
          
          const searchResult = await client.findRegistrations({ 
            tags: capabilities.length > 0 ? capabilities : undefined
          });
          const agentResults = searchResult.registrations || [];

          if (agentResults.length > 0) {
            console.log('\n📋 Found agents:');
            agentResults.forEach((agent: any, i: number) => {
              console.log(`\n${i + 1}. ${agent.metadata?.name || 'Unnamed Agent'}`);
              console.log(`   ID: ${agent.accountId}`);
              console.log(`   Topics: Inbound=${agent.inboundTopicId}, Outbound=${agent.outboundTopicId}`);
              if (agent.metadata?.tags && agent.metadata.tags.length > 0) {
                console.log(`   Tags: ${agent.metadata.tags.join(', ')}`);
              }
            });
            console.log('');
          }
        }

      } catch (error) {
        logger.error('AI response failed:', error);
      }
    }

    // Step 4: Autonomous Actions Demo
    logger.step(4, 'Demonstrating Autonomous Actions');
    
    const performAction = getUserInput('\nWould you like the AI to find and analyze agents? (y/n): ');
    
    if (performAction.toLowerCase() === 'y') {
      logger.info('AI agent performing autonomous search...');
      
      // Search for specific types of agents
      const categories = [
        { name: 'ai', capability: AIAgentCapability.TEXT_GENERATION },
        { name: 'defi', capability: AIAgentCapability.TRANSACTION_ANALYTICS },
        { name: 'data', capability: AIAgentCapability.DATA_INTEGRATION }
      ];
      
      for (const category of categories) {
        logger.info(`\nSearching for ${category.name} agents...`);
        
        const searchResult = await client.findRegistrations({ 
          tags: [category.capability]
        });
        const agents = searchResult.registrations || [];
        
        if (agents.length > 0) {
          // Use AI to analyze the agents
          const analysisPrompt = `Analyze these ${category.name} agents and suggest potential use cases:
${JSON.stringify(agents.map((a: any) => ({
  name: a.metadata?.name,
  tags: a.metadata?.tags,
  description: a.metadata?.description || 'No description'
})), null, 2)}

Provide a brief analysis of their capabilities and potential collaboration opportunities.`;

          const analysis = await model.invoke(analysisPrompt);
          console.log(`\n🔍 AI Analysis of ${category.name} agents:`);
          console.log(analysis.content);
        } else {
          console.log(`No ${category.name} agents found.`);
        }
      }
    }

    logger.divider();
    logger.success('AI Agent demo complete!');
    
    console.log('\n📚 Next Steps:');
    console.log('1. Add more sophisticated tools for the agent');
    console.log('2. Implement transaction capabilities');
    console.log('3. Create agent-to-agent communication');
    console.log('4. Build multi-agent workflows');

  } catch (error) {
    logger.error('Demo failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});