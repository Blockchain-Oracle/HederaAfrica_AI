import { HCS10Client } from '@hashgraphonline/standards-sdk';
import { ChatOpenAI } from '@langchain/openai';
import { TopicMessageQuery, TopicId } from '@hashgraph/sdk';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, getUserInput } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('AgentResponses');

interface IncomingMessage {
  sender: string;
  content: string;
  timestamp: string;
  topicId: string;
  sequenceNumber: number;
}

async function main() {
  displayHeader('Intelligent Agent Responses', 
    'Build agents that respond contextually to messages'
  );

  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      logger.warning('OPENAI_API_KEY not found in .env file');
      logger.info('This demo requires an OpenAI API key for intelligent responses');
      process.exit(1);
    }

    // Step 1: Initialize clients
    logger.step(1, 'Setting up clients');
    
    const operatorId = process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID!;
    const operatorPrivateKey = process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY!;

    const hcs10Client = new HCS10Client({
      network: 'testnet',
      operatorId: operatorId,
      operatorPrivateKey: operatorPrivateKey,
      guardedRegistryBaseUrl: process.env.REGISTRY_URL,
      logLevel: 'info'
    });

    const llm = new ChatOpenAI({
      temperature: 0.7,
      modelName: 'gpt-3.5-turbo',
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    logger.success('Clients initialized');

    // Step 2: Set up message monitoring
    logger.step(2, 'Message Response Configuration');
    
    const monitorTopicId = getUserInput('Topic ID to monitor (or press Enter to create new): ');
    let topicId: string;
    
    if (monitorTopicId) {
      topicId = monitorTopicId;
      logger.info(`Monitoring existing topic: ${topicId}`);
    } else {
      // Create a new topic for this demo
      const { TopicCreateTransaction } = await import('@hashgraph/sdk');
      const hederaClient = (hcs10Client as any).getClient();
      
      const topicTx = new TopicCreateTransaction()
        .setTopicMemo('Agent Response Demo - Intelligent message handling')
        .setSubmitKey(hederaClient.operatorPublicKey);
      
      const topicResponse = await topicTx.execute(hederaClient);
      const topicReceipt = await topicResponse.getReceipt(hederaClient);
      topicId = topicReceipt.topicId!.toString();
      
      logger.success('Created demo topic');
      displayResult('Topic ID', topicId);
      displayResult('View on HashScan', `https://hashscan.io/testnet/topic/${topicId}`);
    }

    // Step 3: Define response strategies
    logger.step(3, 'Response Strategy Configuration');
    
    const responseStrategies = {
      greeting: {
        keywords: ['hello', 'hi', 'hey', 'greetings'],
        systemPrompt: 'You are a friendly AI agent. Respond warmly to greetings and introduce your capabilities related to Hedera and blockchain.'
      },
      question: {
        keywords: ['what', 'how', 'why', 'when', 'where', 'who', '?'],
        systemPrompt: 'You are a knowledgeable blockchain expert. Answer questions about Hedera, blockchain technology, and African tech ecosystems clearly and helpfully.'
      },
      request: {
        keywords: ['create', 'send', 'transfer', 'build', 'help', 'need'],
        systemPrompt: 'You are a helpful assistant. Respond to requests with actionable guidance and offer to help with Hedera operations.'
      },
      collaboration: {
        keywords: ['work together', 'collaborate', 'partner', 'join'],
        systemPrompt: 'You are a collaborative AI agent interested in partnerships. Respond positively to collaboration requests and suggest ways to work together.'
      }
    };

    logger.info('Response strategies configured:');
    Object.keys(responseStrategies).forEach(strategy => {
      logger.info(`- ${strategy} detection`);
    });

    // Step 4: Start monitoring and responding
    logger.step(4, 'Starting Message Monitor');
    
    const processedMessages = new Set<string>();
    const hederaClient = (hcs10Client as any).getClient();
    let messageCount = 0;
    
    console.log('\n🎯 Agent is monitoring for messages...');
    console.log(`Send messages to topic ${topicId} to see intelligent responses\n`);

    new TopicMessageQuery()
      .setTopicId(TopicId.fromString(topicId))
      .subscribe(hederaClient, null, async (message) => {
        const contents = Buffer.from(message.contents).toString();
        const messageId = `${message.consensusTimestamp.seconds}-${message.sequenceNumber}`;
        
        // Skip if already processed
        if (processedMessages.has(messageId)) return;
        processedMessages.add(messageId);
        
        messageCount++;
        
        // Parse incoming message
        let incomingMessage: IncomingMessage;
        try {
          incomingMessage = JSON.parse(contents);
        } catch {
          // Handle plain text messages
          incomingMessage = {
            sender: 'Unknown',
            content: contents,
            timestamp: new Date().toISOString(),
            topicId: topicId,
            sequenceNumber: message.sequenceNumber.toNumber()
          };
        }

        console.log(`\n📨 Received message #${messageCount}:`);
        console.log(`From: ${incomingMessage.sender}`);
        console.log(`Message: ${incomingMessage.content}`);
        console.log(`Time: ${new Date(incomingMessage.timestamp).toLocaleTimeString()}`);

        // Determine response strategy
        const messageText = incomingMessage.content.toLowerCase();
        let selectedStrategy = 'general';
        let systemPrompt = 'You are a helpful AI agent on the Hedera network. Respond appropriately to the message.';
        
        for (const [strategy, config] of Object.entries(responseStrategies)) {
          if (config.keywords.some(keyword => messageText.includes(keyword))) {
            selectedStrategy = strategy;
            systemPrompt = config.systemPrompt;
            break;
          }
        }

        logger.info(`Using ${selectedStrategy} response strategy`);

        // Generate intelligent response
        try {
          const responsePrompt = `${systemPrompt}

Incoming message: "${incomingMessage.content}"
Sender: ${incomingMessage.sender}

Generate an appropriate response that:
1. Addresses the sender's message directly
2. Provides helpful information
3. Suggests relevant next steps if applicable
4. Maintains a professional but friendly tone

Response:`;

          const aiResponse = await llm.invoke(responsePrompt);
          const responseText = aiResponse.content as string;

          console.log(`\n🤖 Agent Response:`);
          console.log(responseText);

          // Send response back to the topic
          const responseMessage = {
            sender: 'AI Agent',
            content: responseText,
            timestamp: new Date().toISOString(),
            inReplyTo: messageId,
            strategy: selectedStrategy
          };

          const receipt = await hcs10Client.sendMessage(
            topicId,
            JSON.stringify(responseMessage),
            `Response to message #${message.sequenceNumber}`
          );

          logger.success('Response sent successfully');
          displayResult('Response TX', receipt.toString());

        } catch (error) {
          logger.error('Failed to generate response:', error);
        }
      });

    // Step 5: Interactive testing
    logger.step(5, 'Interactive Testing');
    
    console.log('\n💬 Test the agent by sending messages (type "exit" to quit)\n');
    console.log('Try different types of messages:');
    console.log('- Greetings: "Hello agent!"');
    console.log('- Questions: "What is Hedera?"');
    console.log('- Requests: "Help me create a token"');
    console.log('- Collaboration: "Let\'s work together on a project"\n');

    while (true) {
      const userMessage = getUserInput('Your message: ');
      
      if (userMessage.toLowerCase() === 'exit') {
        break;
      }

      if (!userMessage.trim()) {
        continue;
      }

      // Send test message to topic
      const testMessage = {
        sender: 'Test User',
        content: userMessage,
        timestamp: new Date().toISOString(),
        topicId: topicId,
        sequenceNumber: 0
      };

      await hcs10Client.sendMessage(
        topicId,
        JSON.stringify(testMessage),
        'Test message'
      );

      logger.info('Message sent! Watch for the agent\'s response above...');
      
      // Wait a bit for the response to appear
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    logger.divider();
    logger.success('Agent responses demo complete!');
    
    console.log('\n📊 Session Summary:');
    console.log(`- Messages processed: ${messageCount}`);
    console.log(`- Topic monitored: ${topicId}`);
    console.log(`- Response strategies: ${Object.keys(responseStrategies).length}`);
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Add more sophisticated response strategies');
    console.log('2. Implement conversation memory');
    console.log('3. Add multi-agent coordination');
    console.log('4. Create specialized domain knowledge');

  } catch (error) {
    logger.error('Demo failed', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});