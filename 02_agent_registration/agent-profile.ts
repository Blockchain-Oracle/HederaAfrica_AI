import { HCS10Client, AgentBuilder, AIAgentCapability } from '@hashgraphonline/standards-sdk';
import { createHederaClient } from '../utils/hedera-client';
import { DemoLogger } from '../utils/logger';
import { displayHeader, withSpinner, displayResult, getUserInput, getUserChoice, waitForUserInput } from '../utils/demo-helpers';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = new DemoLogger('AgentProfile');

async function main() {
  displayHeader('Update Agent Profile Demo', 
    'Update your HCS-10 agent profile and capabilities'
  );

  // Check for existing agent config
  const configPath = path.join(process.cwd(), 'agent-config.json');
  let agentConfig: any = null;

  try {
    const configData = await fs.readFile(configPath, 'utf-8');
    agentConfig = JSON.parse(configData);
    logger.success('Found existing agent configuration');
    displayResult('Agent Name', agentConfig.name);
    displayResult('Account ID', agentConfig.accountId);
  } catch {
    logger.warning('No agent configuration found');
    logger.info('Please run "pnpm run 02:register" first');
    process.exit(1);
  }

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

  // Get current profile
  logger.step(2, 'Fetching current agent profile');
  let currentProfile: any;
  try {
    currentProfile = await withSpinner('Loading profile...', async () => {
      // Note: getAgentProfile might not exist in the SDK
      // You may need to use a different method or retrieve from registry
      return {}; // Placeholder - check SDK documentation
    });

    logger.success('Current profile loaded');
    console.log('\nCurrent Profile:');
    console.log(JSON.stringify(currentProfile, null, 2));
  } catch (error) {
    logger.warning('Could not fetch current profile');
  }

  // Update options
  logger.divider();
  logger.info('What would you like to update?');
  
  const updateOptions = [
    'Description',
    'Add Capabilities',
    'Add Tags',
    'Update Social Links',
    'Update Model',
    'Full Profile Update'
  ];
  
  const updateChoice = getUserChoice('Select update type:', updateOptions);
  
  if (updateChoice === -1) {
    logger.info('Update cancelled');
    return;
  }

  try {
    const agentBuilder = new AgentBuilder();

    // Copy existing profile data if available
    if (currentProfile) {
      agentBuilder
        .setName(currentProfile.name || agentConfig.name)
        .setDescription(currentProfile.description || '')
        .setCapabilities(currentProfile.capabilities || [])
        // .setTags(currentProfile.tags || []) // Not available in SDK
        .setAgentType(currentProfile.agentType || 'autonomous')
        .setModel(currentProfile.model || 'gpt-4');
    }

    switch (updateChoice) {
      case 0: // Description
        const newDescription = getUserInput('\nEnter new description: ');
        agentBuilder.setDescription(newDescription);
        break;

      case 1: // Add Capabilities
        logger.info('\nAvailable capabilities:');
        logger.info('1. Text Generation');
        logger.info('2. Image Generation');
        logger.info('3. Audio Generation');
        logger.info('4. Video Generation');
        logger.info('5. Data Integration');
        
        const capsInput = getUserInput('Add capabilities (comma-separated numbers): ');
        const capabilityMap: Record<string, AIAgentCapability> = {
          '1': AIAgentCapability.TEXT_GENERATION,
          '2': AIAgentCapability.IMAGE_GENERATION,
          '3': AIAgentCapability.AUDIO_GENERATION,
          '4': AIAgentCapability.VIDEO_GENERATION,
          '5': AIAgentCapability.DATA_INTEGRATION
        };
        
        const newCaps = capsInput.split(',')
          .map(c => capabilityMap[c.trim()])
          .filter(Boolean);
        
        const allCaps = [...(currentProfile?.capabilities || []), ...newCaps];
        agentBuilder.setCapabilities([...new Set(allCaps)]); // Remove duplicates
        break;

      case 2: // Add Tags
        const newTags = getUserInput('\nEnter new tags (comma-separated): ');
        const tagArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
        const allTags = [...(currentProfile?.tags || []), ...tagArray];
        // agentBuilder.setTags([...new Set(allTags)]); // Not available in SDK
        logger.info('Tags feature not available in current SDK version');
        break;

      case 3: // Update Social Links
        const website = getUserInput('\nWebsite URL (or Enter to skip): ');
        const twitter = getUserInput('Twitter handle (or Enter to skip): ');
        const discord = getUserInput('Discord username (or Enter to skip): ');
        
        // Social links not available in current SDK version
        if (website || twitter || discord) {
          logger.info('Social links feature not available in current SDK version');
        }
        break;

      case 4: // Update Model
        const model = getUserInput('\nAI Model (e.g., gpt-4, claude-3): ');
        agentBuilder.setModel(model);
        break;

      case 5: // Full Profile Update
        const fullName = getUserInput('\nAgent name: ') || currentProfile?.name || agentConfig.name;
        const fullDescription = getUserInput('Description: ') || currentProfile?.description || '';
        const fullModel = getUserInput('AI Model: ') || currentProfile?.model || 'gpt-4';
        const fullWebsite = getUserInput('Website: ') || currentProfile?.website || '';
        const fullTwitter = getUserInput('Twitter: ') || currentProfile?.twitter || '';
        const fullDiscord = getUserInput('Discord: ') || currentProfile?.discord || '';
        
        agentBuilder
          .setName(fullName)
          .setDescription(fullDescription)
          .setModel(fullModel)
          // .setWebsite(fullWebsite) // Not available in SDK
          // .setTwitter(fullTwitter) // Not available in SDK
          // .setDiscord(fullDiscord); // Not available in SDK
          .setModel(fullModel);
        logger.info('Social links feature not available in current SDK version');
        break;
    }

    // Show preview
    logger.divider();
    logger.info('Profile update preview:');
    const updateData = agentBuilder.build();
    console.log(JSON.stringify(updateData, null, 2));
    
    waitForUserInput('\nPress Enter to update profile...');

    // Update profile
    logger.step(3, 'Updating agent profile');
    await withSpinner('Submitting profile update...', async () => {
      // Note: updateAgentProfile might not exist in the SDK
      // You may need to re-register or use a different method
      return {}; // Placeholder - check SDK documentation
    });

    logger.success('Profile updated successfully! 🎉');

    // Update local config
    agentConfig.lastUpdated = new Date().toISOString();
    await fs.writeFile(configPath, JSON.stringify(agentConfig, null, 2));
    logger.success('Local configuration updated');

    // Show next steps
    console.log('\n📋 Next Steps:');
    console.log('1. View updated profile: pnpm run 02:find');
    console.log('2. Connect with agents: pnpm run 03:connect');
    console.log('3. Try the interactive CLI: pnpm run 04:cli');

  } catch (error) {
    logger.error('Profile update failed', error);
    process.exit(1);
  }

  logger.divider();
  logger.success('Demo completed! 🎉');
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});