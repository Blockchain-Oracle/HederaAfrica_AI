import { HCS10Client, AgentBuilder, AIAgentCapability, InboundTopicType } from '@hashgraphonline/standards-sdk';
import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, getUserInput, waitForUserInput } from '../utils/demo-helpers';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = new DemoLogger('RegisterAgent');

async function main() {
  displayHeader('HCS-10 Agent Registration Demo', 
    'Register an AI agent on the Hedera network using the HCS-10 standard'
  );

  // Initialize Hedera client
  const hederaClient = createHederaClient();
  
  // Get agent details from user
  logger.info('Let\'s create your AI agent profile:');
  
  const agentName = getUserInput('Agent name (e.g., DataBot): ') || 'HackathonBot';
  const agentDescription = getUserInput('Agent description: ') || 'Hedera Africa Hackathon Demo Agent';
  
  logger.info('\nSelect agent capabilities (comma-separated numbers):');
  logger.info('1. Text Generation');
  logger.info('2. Image Generation');
  logger.info('3. Audio Generation');
  logger.info('4. Video Generation');
  logger.info('5. Data Integration');
  
  const capabilitiesInput = getUserInput('Capabilities (e.g., 1,5): ') || '1,5';
  const capabilityMap: Record<string, AIAgentCapability> = {
    '1': AIAgentCapability.TEXT_GENERATION,
    '2': AIAgentCapability.IMAGE_GENERATION,
    '3': AIAgentCapability.AUDIO_GENERATION,
    '4': AIAgentCapability.VIDEO_GENERATION,
    '5': AIAgentCapability.DATA_INTEGRATION
  };
  
  const capabilities = capabilitiesInput.split(',')
    .map(c => capabilityMap[c.trim()])
    .filter(Boolean);

  const tags = getUserInput('Tags (comma-separated, e.g., finance,data-analysis): ') || 'demo,hackathon';
  const tagArray = tags.split(',').map(t => t.trim());

  logger.divider();
  logger.info('Agent configuration:');
  displayResult('Name', agentName);
  displayResult('Description', agentDescription);
  displayResult('Capabilities', capabilities.join(', '));
  displayResult('Tags', tagArray.join(', '));
  
  waitForUserInput('\nPress Enter to register agent...');

  try {
    // Initialize HCS-10 client
    logger.step(1, 'Initializing HCS-10 client');
    // Based on standards-sdk pattern - operatorId and operatorPrivateKey should be strings, not objects
    const operatorId = process.env.HEDERA_ACCOUNT_ID!;
    const operatorPrivateKey = process.env.HEDERA_PRIVATE_KEY!;
    
    const hcs10Client = await withSpinner('Setting up HCS-10 client...', async () => {
      return new HCS10Client({
        network: 'testnet',
        operatorId: operatorId,
        operatorPrivateKey: operatorPrivateKey,
        guardedRegistryBaseUrl: process.env.REGISTRY_URL,
        prettyPrint: true,
        logLevel: 'debug'
      });
    });

    // Build agent configuration
    logger.step(2, 'Building agent configuration');
    const agentBuilder = new AgentBuilder()
      .setName(agentName)
      .setDescription(agentDescription)
      .setCapabilities(capabilities)
      .setType('autonomous')
      .setModel('gpt-4')
      .setNetwork('testnet')
      .setInboundTopicType(InboundTopicType.PUBLIC)
      .setAlias(`${agentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`);

    // Create and register agent
    logger.step(3, 'Creating and registering agent');
    let agent;
    try {
      agent = await withSpinner('Registering agent on Hedera...', async () => {
        return hcs10Client.createAndRegisterAgent(agentBuilder, {
          progressCallback: async (data) => {
            logger.info(`[${data.stage}] ${data.message}`);
            if (data.progressPercent !== undefined) {
              logger.info(`Progress: ${data.progressPercent}%`);
            }
            // Show transaction IDs as they happen
            if (data.details?.transactionId) {
              displayResult('Transaction', `https://hashscan.io/testnet/transaction/${data.details.transactionId}`);
            }
          }
        });
      });
      
      logger.success('Agent registered successfully! 🎉');
      
      // Display agent details
      logger.divider();
      logger.info('Agent Registration Complete!');
      
      // Check if we got metadata
      if (!agent.metadata) {
        throw new Error('Registration failed - no metadata returned');
      }
      
      const metadata = agent.metadata;
      
      // Show actual registration details
      displayResult('Agent Name', agentName);
      displayResult('Account ID', metadata.accountId);
      displayResult('Inbound Topic', metadata.inboundTopicId);
      displayResult('Outbound Topic', metadata.outboundTopicId);
      
      // Show explorer links
      console.log('\n🔍 Verify on HashScan:');
      console.log(`Inbound: https://hashscan.io/testnet/topic/${metadata.inboundTopicId}`);
      console.log(`Outbound: https://hashscan.io/testnet/topic/${metadata.outboundTopicId}`);
    } catch (registerError: any) {
      logger.error('Failed to register agent', registerError);
      logger.info('\nThis might be due to SDK configuration or network issues.');
      logger.info('The error "Network is required" suggests the SDK needs different initialization.');
      throw registerError;
    }

    // Save agent details for future use
    logger.step(4, 'Saving agent configuration');
    const agentConfig = {
      name: agentName,
      accountId: agent.metadata?.accountId,
      privateKey: agent.metadata?.privateKey,
      inboundTopicId: agent.metadata?.inboundTopicId,
      outboundTopicId: agent.metadata?.outboundTopicId,
      profileTopicId: agent.metadata?.profileTopicId,
      createdAt: new Date().toISOString()
    };

    const configPath = path.join(process.cwd(), 'agent-config.json');
    await fs.writeFile(configPath, JSON.stringify(agentConfig, null, 2));
    logger.success(`Agent configuration saved to: ${configPath}`);

    // Show next steps
    console.log('\n📋 Next Steps:');
    console.log('1. Find other agents: pnpm run 02:find');
    console.log('2. Update profile: pnpm run 02:profile');
    console.log('3. Connect to agents: pnpm run 03:connect');
    console.log('4. Send messages: pnpm run 03:messages');

    // Update .env file for easy reuse
    if (agent.metadata) {
      const envUpdates: Record<string, string> = {
        [`DEMO_ACCOUNT_ID`]: agent.metadata.accountId,
        [`DEMO_PRIVATE_KEY`]: agent.metadata.privateKey,
        [`DEMO_INBOUND_TOPIC_ID`]: agent.metadata.inboundTopicId,
        [`DEMO_OUTBOUND_TOPIC_ID`]: agent.metadata.outboundTopicId
      };
      
      // Simple env update (in production use a proper parser)
      let envContent = '';
      try {
        envContent = await fs.readFile('.env', 'utf-8');
      } catch {}
      
      Object.entries(envUpdates).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      });
      
      await fs.writeFile('.env', envContent);
      logger.success('Environment variables updated for easy reuse');
    }

  } catch (error) {
    logger.error('Agent registration failed', error);
    process.exit(1);
  }

  logger.divider();
  logger.success('Demo completed successfully! 🎉');
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});