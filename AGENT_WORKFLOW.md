# 🤖 HCS-10 Agent Connection Workflow

This guide shows you how to use the existing registration system to create different agents and demonstrate connections between them.

## 📋 Step-by-Step Workflow

### 1️⃣ Register Bob (Connection Listener)
```bash
pnpm run 02:register
```
- Choose: `2. Bob (Connection Listener)`
- This creates `BOB_*` environment variables

### 2️⃣ Register Alice (Connection Initiator)  
```bash
pnpm run 02:register
```
- Choose: `1. Alice (Connection Initiator)`
- This creates `ALICE_*` environment variables

### 3️⃣ Start Bob's Monitoring (Terminal 1)
```bash
pnpm run 03:monitor
```
- Choose: `1. Bob (BOB_*)`
- Bob will listen for incoming connections

### 4️⃣ Alice Connects to Bob (Terminal 2)
```bash
pnpm run 03:connect
```
- Choose: `1. Alice (ALICE_*)`
- Enter Bob's inbound topic ID when prompted
- Alice will send connection request to Bob

### 5️⃣ Watch the Magic! ✨
- Bob automatically accepts Alice's connection
- A shared communication topic is created
- Both agents can now exchange messages

## 🔧 Environment Variables Created

After registration, your `.env` file will have:

```env
# Bob Agent (Listener)
BOB_ACCOUNT_ID=0.0.123456
BOB_PRIVATE_KEY=302e020100300506032b6570...
BOB_INBOUND_TOPIC_ID=0.0.123457
BOB_OUTBOUND_TOPIC_ID=0.0.123458
BOB_PROFILE_TOPIC_ID=0.0.123459

# Alice Agent (Initiator)
ALICE_ACCOUNT_ID=0.0.123460
ALICE_PRIVATE_KEY=302e020100300506032b6570...
ALICE_INBOUND_TOPIC_ID=0.0.123461
ALICE_OUTBOUND_TOPIC_ID=0.0.123462
ALICE_PROFILE_TOPIC_ID=0.0.123463
```

## 🎯 Expected Flow

### Terminal 1 (Bob Monitoring):
```
🚀 Monitor Incoming Connections
────────────────────────────────────────────────────────────
Accept connection requests from other agents

Which agent should listen for connections?
1. Bob (BOB_*)
2. Demo (DEMO_*)
Choose agent (1-2): 1

[MonitorIncoming] Bob agent found in environment variables
[MonitorIncoming] Monitoring incoming requests on topic 0.0.123457
[MonitorIncoming] Press Ctrl+C to stop monitoring

[MonitorIncoming] Processing connection request #1 from 0.0.123460
[MonitorIncoming] ✅ Connection accepted! 🤝
Connection Topic: 0.0.654321
View on HashScan: https://hashscan.io/testnet/topic/0.0.654321
[MonitorIncoming] Welcome message sent
Message Tx: https://hashscan.io/testnet/transaction/...
```

### Terminal 2 (Alice Connecting):
```
🚀 Agent Connection Demo
────────────────────────────────────────────────────────────
Connect to other HCS-10 agents

Which agent should initiate the connection?
1. Alice (ALICE_*)
2. Demo (DEMO_*)
3. Main Account (HEDERA_*)
Choose agent (1-3): 1

[ConnectAgents] Alice agent found in environment variables
[ConnectAgents] Using agent configuration from environment variables
Your Account: 0.0.123460

Enter target agent INBOUND TOPIC ID (e.g., 0.0.123456): 0.0.123457
[ConnectAgents] Connecting to agent via topic: 0.0.123457
Connection message (optional): Hello Bob from Alice!

[ConnectAgents] ✅ Connection request sent!
Request ID: 1
[ConnectAgents] ✅ Connection established! 🤝
Connection Topic: 0.0.654321
```

## 🔄 Key Benefits of This Approach

1. **Uses Existing Scripts**: No new complex demo script needed
2. **Environment-Based**: Each agent has its own environment variables
3. **Easy to Understand**: One registration, one monitor, one connect
4. **Flexible**: Can create multiple agent types (Alice, Bob, Custom)
5. **Reusable**: Once registered, agents persist in environment

## 🆚 Traditional vs New Approach

| Step | Traditional | New Approach |
|------|-------------|--------------|
| Create Agent 1 | `pnpm run 02:register` → manual input | `pnpm run 02:register` → choose "Bob" |
| Create Agent 2 | `pnpm run 02:register` → manual input | `pnpm run 02:register` → choose "Alice" |
| Start Monitoring | `pnpm run 03:monitor` → guess which agent | `pnpm run 03:monitor` → choose "Bob" |
| Connect | `pnpm run 03:connect` → guess which agent | `pnpm run 03:connect` → choose "Alice" |

## 🎪 Demo Script

Want to show this to others? Here's a quick demo script:

```bash
# Terminal 1 - Create and monitor Bob
pnpm run 02:register  # Choose: 2 (Bob)
pnpm run 03:monitor   # Choose: 1 (Bob)

# Terminal 2 - Create Alice and connect  
pnpm run 02:register  # Choose: 1 (Alice)
pnpm run 03:connect   # Choose: 1 (Alice), enter Bob's inbound topic
```

## 📝 Notes

- Bob's inbound topic ID will be shown after registration
- Copy Bob's inbound topic ID to use in Alice's connection
- Both agents need sufficient HBAR balance for transactions
- Network propagation can take a few seconds