// import { ConversationalAgent } from '@hashgraphonline/conversational-agent'; // Using local implementation instead
import { HCS10Client } from '@hashgraphonline/standards-sdk';
import { DemoLogger } from '../utils/logger';
import { displayHeader, displayResult, getUserInput } from '../utils/demo-helpers';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new DemoLogger('ChatAgent');

async function main() {
  displayHeader('Conversational Chat Agent', 
    'Build agents for natural conversations'
  );

  try {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      logger.warning('OPENAI_API_KEY not found in .env file');
      logger.info('This demo requires an OpenAI API key');
      process.exit(1);
    }

    // Step 1: Initialize HCS-10 client
    logger.step(1, 'Setting up HCS-10 client');
    
    const operatorId = process.env.DEMO_ACCOUNT_ID || process.env.HEDERA_ACCOUNT_ID!;
    const operatorPrivateKey = process.env.DEMO_PRIVATE_KEY || process.env.HEDERA_PRIVATE_KEY!;

    const hcs10Client = new HCS10Client({
      network: 'testnet',
      operatorId: operatorId,
      operatorPrivateKey: operatorPrivateKey,
      guardedRegistryBaseUrl: process.env.REGISTRY_URL,
      logLevel: 'info'
    });

    logger.success('HCS-10 client initialized');

    // Step 2: Create conversational agent
    logger.step(2, 'Creating conversational agent');
    
    const agent = new ConversationalAgent({
      llm: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        temperature: 0.7
      },
      systemPrompt: `You are a helpful AI assistant specialized in Hedera blockchain and African technology ecosystems. 
You can help users with:
- Understanding Hedera concepts
- Creating transactions
- Finding and connecting with other agents
- Answering questions about African tech markets
- Providing blockchain insights

Be friendly, informative, and focused on practical solutions.`,
      memory: {
        type: 'buffer',
        k: 10 // Remember last 10 messages
      }
    });

    logger.success('Conversational agent ready');

    // Step 3: Interactive chat session
    logger.step(3, 'Starting chat session');
    
    console.log('\n💬 Chat with your AI agent (type "exit" to quit)');
    console.log('The agent can help with Hedera, blockchain, and African tech topics.\n');

    const sessionContext = {
      accountId: operatorId.toString(),
      network: 'testnet',
      timestamp: new Date().toISOString()
    };

    // Example conversation starters
    console.log('💡 Try asking:');
    console.log('  - "What can you tell me about Hedera?"');
    console.log('  - "How do I create an NFT collection?"');
    console.log('  - "What are the opportunities in African blockchain?"');
    console.log('  - "Help me understand consensus service"\n');

    while (true) {
      const userInput = getUserInput('You: ');
      
      if (userInput.toLowerCase() === 'exit') {
        break;
      }

      if (!userInput.trim()) {
        continue;
      }

      try {
        // Process message with context
        const response = await agent.processMessage(userInput, {
          context: sessionContext,
          includeHistory: true
        });

        console.log(`\n🤖 Agent: ${response.message}\n`);

        // If the response includes suggested actions
        if (response.suggestedActions && response.suggestedActions.length > 0) {
          console.log('📋 Suggested actions:');
          response.suggestedActions.forEach((action: any, i: number) => {
            console.log(`${i + 1}. ${action}`);
          });
          console.log('');
        }

        // Demo: Show how the agent could execute blockchain operations
        if (userInput.toLowerCase().includes('create') || 
            userInput.toLowerCase().includes('send') ||
            userInput.toLowerCase().includes('transfer')) {
          
          logger.info('Note: In a production agent, I could execute this transaction for you.');
          logger.info('For safety, this demo only simulates blockchain operations.');
        }

      } catch (error) {
        logger.error('Failed to process message:', error);
      }
    }

    // Step 4: Session summary
    logger.step(4, 'Session Summary');
    
    const conversationHistory = agent.getConversationHistory();
    
    console.log('\n📊 Chat Statistics:');
    console.log(`- Messages exchanged: ${conversationHistory.length}`);
    console.log(`- Session duration: ${new Date().toLocaleTimeString()}`);
    console.log(`- Context maintained: Yes`);
    
    // Optional: Save conversation
    const saveChoice = getUserInput('\nSave conversation history? (y/n): ');
    
    if (saveChoice?.toLowerCase() === 'y') {
      const fs = await import('fs/promises');
      const filename = `chat-session-${Date.now()}.json`;
      
      await fs.writeFile(filename, JSON.stringify({
        session: sessionContext,
        history: conversationHistory,
        timestamp: new Date().toISOString()
      }, null, 2));
      
      logger.success(`Conversation saved to: ${filename}`);
    }

    logger.divider();
    logger.success('Chat agent demo complete!');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Integrate with HCS for persistent conversations');
    console.log('2. Add transaction execution capabilities');
    console.log('3. Connect with other agents for collaboration');
    console.log('4. Implement specialized knowledge domains');

  } catch (error) {
    logger.error('Demo failed', error);
    process.exit(1);
  }
}

// Conversational Agent class implementation (simplified for demo)
class ConversationalAgent {
  private messages: Array<{role: string, content: string}> = [];
  private config: any;

  constructor(config: any) {
    this.config = config;
    this.messages.push({
      role: 'system',
      content: config.systemPrompt
    });
  }

  async processMessage(message: string, options?: any): Promise<any> {
    // Add user message to history
    this.messages.push({
      role: 'user',
      content: message
    });

    // Keep only last k messages if buffer memory is configured
    if (this.config.memory?.type === 'buffer' && this.config.memory.k) {
      const systemMessage = this.messages[0];
      const recentMessages = this.messages.slice(-(this.config.memory.k * 2));
      this.messages = [systemMessage, ...recentMessages];
    }

    // In a real implementation, this would call the LLM API
    // For demo purposes, we'll simulate responses
    const response = await this.simulateResponse(message);
    
    // Add assistant response to history
    this.messages.push({
      role: 'assistant',
      content: response.message
    });

    return response;
  }

  private async simulateResponse(message: string): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lowerMessage = message.toLowerCase();
    
    // Provide contextual responses based on keywords
    if (lowerMessage.includes('hedera')) {
      return {
        message: "Hedera is a public distributed ledger that uses hashgraph consensus - a fast, fair, and secure alternative to blockchain. It's particularly well-suited for African markets due to its low fees, high throughput, and energy efficiency. The network can handle 10,000+ transactions per second with finality in 3-5 seconds.",
        suggestedActions: ["Learn about HCS", "Create a token", "Explore use cases"]
      };
    }
    
    if (lowerMessage.includes('nft')) {
      return {
        message: "NFTs on Hedera are incredibly efficient! You can create NFT collections with custom royalties, mint NFTs for less than $0.01, and benefit from the network's fast finality. African artists and creators are using Hedera NFTs for digital art, music rights, and cultural heritage preservation.",
        suggestedActions: ["Create NFT collection", "View NFT marketplaces", "Learn about royalties"]
      };
    }
    
    if (lowerMessage.includes('african') || lowerMessage.includes('africa')) {
      return {
        message: "Africa is experiencing rapid blockchain adoption! Key opportunities include: cross-border payments (reducing remittance costs), agricultural supply chain tracking, digital identity solutions, and financial inclusion through DeFi. Countries like Nigeria, Kenya, and South Africa are leading the way with innovative blockchain projects on Hedera.",
        suggestedActions: ["Explore use cases", "Connect with African developers", "View success stories"]
      };
    }
    
    if (lowerMessage.includes('consensus')) {
      return {
        message: "Hedera Consensus Service (HCS) provides decentralized ordering and timestamping for any application. It's perfect for audit logs, supply chain tracking, and multi-party coordination. Messages are ordered fairly and timestamped by the Hedera network, providing an immutable record that can be independently verified.",
        suggestedActions: ["Create a topic", "Send messages", "Build audit trail"]
      };
    }
    
    if (lowerMessage.includes('create') || lowerMessage.includes('build')) {
      return {
        message: "I can help you understand how to create various things on Hedera! You can create tokens (fungible and NFTs), topics for messaging, scheduled transactions, and smart contracts. Each has specific use cases - what would you like to create?",
        suggestedActions: ["Create token", "Create NFT", "Create topic", "Schedule transaction"]
      };
    }
    
    // Default response
    return {
      message: "I'm here to help you understand Hedera and explore blockchain opportunities in Africa. You can ask me about Hedera's features, creating tokens or NFTs, consensus service, African blockchain adoption, or any other blockchain-related topics. What would you like to know?",
      suggestedActions: ["Learn basics", "View examples", "Get started"]
    };
  }

  getConversationHistory(): Array<{role: string, content: string}> {
    // Return all messages except the system prompt
    return this.messages.slice(1);
  }
}

main().catch(error => {
  logger.error('Demo failed', error);
  process.exit(1);
});