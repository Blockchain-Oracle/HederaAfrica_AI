# Hedera Africa Demo Repository

A comprehensive collection of demos showcasing Hedera integrations, HCS-10 agent communication, and AI-powered blockchain interactions. Perfect for hackathon participants and developers learning Hedera.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and pnpm
- Hedera testnet account with 20+ HBAR
- OpenAI API key (for AI demos)

### Getting API Keys and Credentials

#### Hedera Account & Private Key
1. Visit [Hedera Portal](https://portal.hedera.com/dashboard)
2. Create an account or log in
3. Generate testnet credentials (Account ID and Private Key)
4. Fund your testnet account with HBAR using the faucet

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or log in
3. Navigate to API keys section
4. Generate a new API key for your project

### Setup
```bash
# Clone the repository
git clone https://github.com/Blockchain-Oracle/HederaAfrica_AI.git
cd HederaAfrica_AI

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Verify setup
pnpm run 00:setup
```

## 📁 Demo Structure

### 00_setup - Environment Configuration
- `check-setup.ts` - Verify Hedera connection and balance

### 01_basic_hedera - Hedera Fundamentals
- `index.ts` - Simple HBAR transfer
- `create-topic.ts` - Create HCS topic
- `send-message.ts` - Send topic messages

### 02_agent_registration - HCS-10 Agent Setup
- `register-agent.ts` - Create and register agents
- `find-agents.ts` - Search registry by tags
- `agent-profile.ts` - Update agent profiles

### 03_agent_connections - Agent Communication
- `connect-agents.ts` - Establish connections
- `send-messages.ts` - Exchange messages
- `connection-fees.ts` - Fee-based connections

### 05_ai_agent_basic - LangChain Integration
- `langchain-agent.ts` - Autonomous AI agent with HCS-10 tools
- `natural-commands.ts` - Natural language command processing
- `agent-responses.ts` - Context-aware response generation

### 06_conversational_agent - Transaction Processing
- `transaction-agent.ts` - Natural language transaction requests
- `chat-agent.ts` - Multi-turn conversation handling

### 07_token_operations - Token Management
- `create-token.ts` - Create fungible tokens with real transactions
- `create-nft.ts` - NFT collection creation

### 08_scheduled_transactions - Time-Based Execution
- `schedule-transfer.ts` - Create multi-sig scheduled transactions

### 09_data_analysis - Blockchain Analytics
- `hgraph-queries.ts` - Query Hedera data with GraphQL

### 10_meme_tokens - Token Trading
- `launch-token.ts` - Launch tokens with bonding curves

### 11_advanced_patterns - Complex Workflows
- `multi-agent-chat.ts` - Multi-agent collaboration system
- Features: Multi-agent support, connection handling, messaging

### 05_ai_agent_basic - AI Integration Basics
- `langchain-agent.ts` - LangChain with Hedera tools
- `natural-commands.ts` - Natural language processing
- `agent-responses.ts` - AI message handling

### 06_conversational_agent - Advanced AI
- `chat-agent.ts` - Full conversational AI
- `transaction-agent.ts` - AI transaction creation
- `multi-step-tasks.ts` - Complex workflows

### 07_token_operations - Token Management
- `create-token.ts` - Fungible tokens
- `create-nft.ts` - NFT collections
- `token-transfers.ts` - Token distribution

### 08_scheduled_transactions - Multi-sig & Scheduling
- `schedule-transfer.ts` - Scheduled transactions
- `approve-transaction.ts` - Multi-sig approvals
- `agent-approvals.ts` - Agent-based approvals

### 09_data_analysis - Blockchain Analytics
- `hgraph-queries.ts` - Query blockchain data
- `account-analysis.ts` - Account analytics
- `token-monitoring.ts` - Real-time monitoring

### 10_meme_tokens - DeFi Integration
- `launch-token.ts` - Launch meme tokens
- `bonding-curve.ts` - Bonding curve trading
- `ai-trading-bot.ts` - Automated trading

### 11_advanced_patterns - Complex Scenarios
- `multi-agent-chat.ts` - Group communication
- `ai-collaboration.ts` - Agent collaboration
- `state-persistence.ts` - State management

## 🎯 Running Demos

Each demo can be run independently:

```bash
# Basic operations
pnpm run 01:transfer      # Transfer HBAR
pnpm run 01:topic         # Create topic

# Agent demos
pnpm run 02:register      # Register agent
pnpm run 03:connect       # Connect agents

# Interactive CLI
pnpm run 04:cli           # Full CLI experience

# AI demos
pnpm run 05:langchain     # AI agent demo
pnpm run 06:chat          # Conversational AI

# Token operations
pnpm run 07:token         # Create token
pnpm run 07:nft           # Create NFT
```

## 🔧 Configuration

### Environment Variables
See `.env.example` for all configuration options:
- `HEDERA_ACCOUNT_ID` - Your Hedera account
- `HEDERA_PRIVATE_KEY` - Your private key
- `OPENAI_API_KEY` - For AI demos
- `KNOWN_AGENT_PREFIXES` - For multi-agent support

### Multi-Agent Setup
The CLI demo supports multiple agents:
```bash
# Add to .env
KNOWN_AGENT_PREFIXES=TODD,DAVE,BOB

TODD_ACCOUNT_ID=0.0.123456
TODD_PRIVATE_KEY=...

DAVE_ACCOUNT_ID=0.0.234567
DAVE_PRIVATE_KEY=...
```

## 📚 Learn More

- [Hedera Documentation](https://docs.hedera.com)
- [HCS-10 Standard](https://hashgraphonline.com/standards/hcs-10)
- [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit)
- [Standards SDK](https://hashgraphonline.com/docs/libraries/standards-sdk)

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT