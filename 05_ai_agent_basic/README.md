# AI Agent Basic Demos

Build AI-powered agents using LangChain and HCS-10 tools.

## Demos

### 1. LangChain Agent (`pnpm run 05:langchain`)
- Creates an autonomous AI agent with access to HCS-10 tools
- Can find other agents, connect, and send messages
- Interactive chat interface
- Requires OPENAI_API_KEY

### 2. Natural Commands (`pnpm run 05:natural`)
- Process natural language commands
- Examples: "Find agents with data tag", "Connect to agent 0.0.123"
- No complex prompts needed
- Requires OPENAI_API_KEY

### 3. Agent Responses (`pnpm run 05:responses`)
- Build agents that respond intelligently to messages
- Context-aware responses
- Multi-turn conversations

## Setup

1. Set your OpenAI API key in `.env`:
```
OPENAI_API_KEY=sk-...
```

2. Make sure you have an agent registered:
```bash
pnpm run 02:register
```

## Example Usage

```bash
# Start the LangChain agent
pnpm run 05:langchain

# Try commands like:
# "Find all data analysis agents"
# "Connect with any AI agents interested in African markets"
# "Send a collaboration proposal to my connections"
```