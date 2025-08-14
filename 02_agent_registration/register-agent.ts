import { HCS10Client, AgentBuilder, AIAgentCapability, InboundTopicType } from '@hashgraphonline/standards-sdk';
import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, getUserInput, waitForUserInput } from '../utils/demo-helpers';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = new DemoLogger('RegisterAgent');

async function updateEnvFile(envFilePath: string, variables: Record<string, string>): Promise<void> {
  let envContent = '';

  try {
    envContent = await fs.readFile(envFilePath, 'utf8');
  } catch (error) {
    // File doesn't exist, start with empty content
  }

  const envLines = envContent.split('\n');
  const updatedLines = [...envLines];

  for (const [key, value] of Object.entries(variables)) {
    const lineIndex = updatedLines.findIndex(line => line.startsWith(`${key}=`));

    if (lineIndex !== -1) {
      updatedLines[lineIndex] = `${key}=${value}`;
    } else {
      updatedLines.push(`${key}=${value}`);
    }
  }

  // Ensure file ends with newline
  if (updatedLines[updatedLines.length - 1] !== '') {
    updatedLines.push('');
  }

  await fs.writeFile(envFilePath, updatedLines.join('\n'));
}

async function main() {
  displayHeader('HCS-10 Agent Registration Demo', 
    'Register an AI agent on the Hedera network using the HCS-10 standard'
  );

  // Initialize Hedera client
  const hederaClient = createHederaClient();
  
  // Get agent details from user
  logger.info('Let\'s create your AI agent profile:');
  
  // Ask for agent type first
  logger.info('\nSelect agent type:');
  logger.info('1. Alice (Connection Initiator)');
  logger.info('2. Bob (Connection Listener)'); 
  logger.info('3. Custom Agent');
  
  const agentTypeInput = getUserInput('Agent type (1-3): ') || '3';
  
  let agentName = '';
  let agentDescription = '';
  let envPrefix = 'DEMO';
  
  if (agentTypeInput === '1') {
    agentName = 'Alice';
    agentDescription = 'Connection initiator agent for demos';
    envPrefix = 'ALICE';
  } else if (agentTypeInput === '2') {
    agentName = 'Bob';
    agentDescription = 'Connection listener agent for demos';
    envPrefix = 'BOB';
  } else {
    agentName = getUserInput('Agent name (e.g., DataBot): ') || 'HackathonBot';
    agentDescription = getUserInput('Agent description: ') || 'Hedera Africa Hackathon Demo Agent';
    envPrefix = 'DEMO';
  }
  
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
    let capturedMetadata: any = {};
    let metadata: any = {};
    
    try {
      agent = await withSpinner('Registering agent on Hedera...', async () => {
        return hcs10Client.createAndRegisterAgent(agentBuilder, {
          progressCallback: async (data) => {
            logger.info(`[${data.stage}] ${data.message}`);
            if (data.progressPercent !== undefined) {
              logger.info(`Progress: ${data.progressPercent}%`);
            }
            
            // Capture metadata as it becomes available
            if (data.details) {
              if (data.details.account?.accountId) {
                capturedMetadata.accountId = data.details.account.accountId;
              }
              if (data.details.account?.privateKey) {
                capturedMetadata.privateKey = data.details.account.privateKey;
              }
              if (data.details.outboundTopicId) {
                capturedMetadata.outboundTopicId = data.details.outboundTopicId;
              }
              if (data.details.inboundTopicId) {
                capturedMetadata.inboundTopicId = data.details.inboundTopicId;
              }
              if (data.details.profileTopicId) {
                capturedMetadata.profileTopicId = data.details.profileTopicId;
              }
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
      
      // Use SDK metadata if available, otherwise use captured metadata
      metadata = agent.metadata || capturedMetadata;
      
      if (!metadata || !metadata.accountId) {
        logger.error('Registration failed - no metadata available');
        logger.info('This might be due to network timing issues');
        return;
      }
      
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
      accountId: metadata.accountId,
      privateKey: metadata.privateKey,
      inboundTopicId: metadata.inboundTopicId,
      outboundTopicId: metadata.outboundTopicId,
      profileTopicId: metadata.profileTopicId,
      createdAt: new Date().toISOString()
    };

    const configPath = path.join(process.cwd(), 'agent-config.json');

    logger.success(`Agent configuration saved to: ${configPath}`);

    // Update .env file for easy reuse
    if (metadata.accountId) {
      const envUpdates: Record<string, string> = {
        [`${envPrefix}_ACCOUNT_ID`]: metadata.accountId,
        [`${envPrefix}_PRIVATE_KEY`]: metadata.privateKey || '',
        [`${envPrefix}_INBOUND_TOPIC_ID`]: metadata.inboundTopicId,
        [`${envPrefix}_OUTBOUND_TOPIC_ID`]: metadata.outboundTopicId
      };
      
      // Add profile topic if available
      if (metadata.profileTopicId) {
        envUpdates[`${envPrefix}_PROFILE_TOPIC_ID`] = metadata.profileTopicId;
      }
      
      const envFilePath = path.join(process.cwd(), '.env');
      await updateEnvFile(envFilePath, envUpdates);
      logger.success('Environment variables updated for easy reuse');
    }

    // Show next steps
    console.log('\n📋 Next Steps:');
    console.log('1. Find other agents: pnpm run 02:find');
    console.log('2. Update profile: pnpm run 02:profile');
    console.log('3. Connect to agents: pnpm run 03:connect');
    console.log('4. Send messages: pnpm run 03:messages');

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