import { HCS10Client, AIAgentCapability } from '@hashgraphonline/standards-sdk';
import { ChatOpenAI } from '@langchain/openai';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, getUserInput } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('NaturalCommands');

// Command patterns the AI can understand
const COMMAND_EXAMPLES = [
  "Find all AI agents",
  "Show me DeFi agents with trading capabilities",
  "List agents tagged with 'data'",
  "Search for NFT marketplace agents",
  "Connect to agent 0.0.123456",
  "Send a message saying 'Hello from Africa!'",
  "What agents are available for collaboration?",
  "Find agents interested in African markets"
];

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

async function parseNaturalCommand(command: string, model: ChatOpenAI): Promise<any> {
  const systemPrompt = `You are a command parser for a Hedera blockchain agent system.
Parse the user's natural language command and return a JSON object with the action and parameters.

Available actions:
- find_agents: Search for agents (params: tags[], name)
- connect_agent: Connect to an agent (params: agentId or inboundTopic)
- send_message: Send a message (params: topicId, message)
- get_info: Get information about agents or the system

Examples:
"Find all AI agents" -> {"action": "find_agents", "params": {"tags": ["ai"]}}
"Connect to agent 0.0.123456" -> {"action": "connect_agent", "params": {"inboundTopic": "0.0.123456"}}
"Send hello to topic 0.0.789" -> {"action": "send_message", "params": {"topicId": "0.0.789", "message": "hello"}}

Return only valid JSON, no additional text.`;

  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: command }
  ]);

  try {
    return JSON.parse(response.content as string);
  } catch {
    return { action: 'unknown', original: command };
  }
}

async function executeCommand(parsedCommand: any, client: HCS10Client): Promise<void> {
  const { action, params } = parsedCommand;

  switch (action) {
    case 'find_agents':
      logger.info(`Searching for agents with tags: ${params.tags?.join(', ') || 'all'}`);
      
      const capabilities = params.tags ? mapTagsToCapabilities(params.tags) : undefined;
      const searchResult = await client.findRegistrations({
        tags: capabilities && capabilities.length > 0 ? capabilities : undefined
      });
      const agents = searchResult.registrations || [];

      if (agents.length === 0) {
        logger.info('No agents found matching your criteria');
      } else {
        console.log(`\n📋 Found ${agents.length} agents:\n`);
        agents.forEach((agent: any, i: number) => {
          console.log(`${i + 1}. ${agent.metadata?.name || 'Unnamed Agent'}`);
          console.log(`   Account: ${agent.accountId}`);
          console.log(`   Inbound: ${agent.inboundTopicId}`);
          if (agent.metadata?.tags && agent.metadata.tags.length > 0) {
            console.log(`   Tags: ${agent.metadata.tags.join(', ')}`);
          }
          console.log('');
        });
      }
      break;

    case 'connect_agent':
      logger.info(`Connecting to agent via topic: ${params.inboundTopic}`);
      logger.info('Use pnpm run 03:connect to complete the connection flow');
      displayResult('Target Topic', params.inboundTopic);
      break;

    case 'send_message':
      logger.info(`Sending message to topic: ${params.topicId}`);
      logger.info(`Message: "${params.message}"`);
      
      try {
        const receipt = await client.sendMessage(
          params.topicId,
          params.message,
          'Natural language command'
        );
        logger.success('Message sent!');
        displayResult('Status', receipt.status.toString());
      } catch (error) {
        logger.error('Failed to send message:', error);
      }
      break;

    case 'get_info':
      logger.info('System Information:');
      displayResult('Network', 'Hedera Testnet');
      displayResult('Registry', process.env.REGISTRY_URL || 'Default');
      displayResult('Your Account', process.env.HEDERA_ACCOUNT_ID || 'Not configured');
      break;

    default:
      logger.warning(`Unknown command action: ${action}`);
      logger.info('Try commands like: "Find AI agents" or "List all agents"');
  }
}

async function main() {
  displayHeader('Natural Language Commands', 
    'Process natural language requests for agent operations'
  );

  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      logger.warning('OPENAI_API_KEY not found in .env file');
      logger.info('This demo requires an OpenAI API key for natural language processing');
      process.exit(1);
    }

    // Initialize clients
    const operatorId = process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID!;
    const operatorPrivateKey = process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY!;

    const client = new HCS10Client({
      network: 'testnet',
      operatorId: operatorId,
      operatorPrivateKey: operatorPrivateKey,
      guardedRegistryBaseUrl: process.env.REGISTRY_URL,
      logLevel: 'info'
    });

    const model = new ChatOpenAI({
      temperature: 0,
      modelName: 'gpt-3.5-turbo',
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    logger.success('Natural language processor ready');

    // Show examples
    console.log('\n📝 Example commands:');
    COMMAND_EXAMPLES.forEach((example, i) => {
      console.log(`${i + 1}. "${example}"`);
    });

    console.log('\n💬 Enter natural language commands (type "exit" to quit)\n');

    // Interactive loop
    while (true) {
      const command = getUserInput('Command: ');
      
      if (command.toLowerCase() === 'exit') {
        break;
      }

      if (!command.trim()) {
        continue;
      }

      try {
        // Parse the natural language command
        logger.info('Understanding your command...');
        const parsed = await parseNaturalCommand(command, model);
        
        logger.info(`Interpreted as: ${parsed.action}`);
        if (parsed.params) {
          logger.info(`Parameters: ${JSON.stringify(parsed.params)}`);
        }

        // Execute the command
        await executeCommand(parsed, client);

      } catch (error) {
        logger.error('Command failed:', error);
      }

      console.log(''); // Add spacing
    }

    logger.divider();
    logger.success('Natural commands demo complete!');

  } catch (error) {
    logger.error('Demo failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});