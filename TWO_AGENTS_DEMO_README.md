# 🤖 Two-Agent Connection Demo

This demo script creates two HCS-10 agents (Alice and Bob) and demonstrates automatic connection establishment between them, following the exact pattern from the standards-sdk2 reference implementation.

## 🚀 Quick Start

```bash
pnpm run demo:two-agents
```

## 📋 What This Demo Does

1. **Creates/Loads Alice Agent**
   - Text Generation capability
   - Data Integration capability
   - Automatically saves to environment variables (`ALICE_*`)

2. **Creates/Loads Bob Agent**
   - Text Generation capability  
   - Code Generation capability
   - Automatically saves to environment variables (`BOB_*`)

3. **Demonstrates Automatic Connection**
   - Bob starts monitoring for incoming connections
   - Alice sends connection request to Bob
   - Bob automatically accepts the connection
   - A private communication topic is established
   - Alice sends a test message through the connection

## 🔧 Prerequisites

Make sure your `.env` file has:
```env
HEDERA_ACCOUNT_ID=0.0.YOUR_ACCOUNT
HEDERA_PRIVATE_KEY=your_private_key_here
REGISTRY_URL=https://testnet.hcs.global
```

## 📊 Expected Output

```
🚀 HCS-10 Two-Agent Connection Demo
────────────────────────────────────────────────────────────
Create Alice and Bob agents, then demonstrate automatic connection between them

[Step 1] Creating or retrieving Alice agent
✔ Setting up Alice...
[Alice] Alice agent found in environment variables
[Alice] Alice account ID: 0.0.123456
[Alice] Alice inbound topic ID: 0.0.123457
[Alice] Alice outbound topic ID: 0.0.123458

[Step 2] Creating or retrieving Bob agent
✔ Setting up Bob...
[Bob] Bob agent found in environment variables
[Bob] Bob account ID: 0.0.123459
[Bob] Bob inbound topic ID: 0.0.123460
[Bob] Bob outbound topic ID: 0.0.123461

==== AGENT DETAILS ====
Alice Account: 0.0.123456
Alice Inbound: 0.0.123457
Alice Outbound: 0.0.123458
Bob Account: 0.0.123459
Bob Inbound: 0.0.123460
Bob Outbound: 0.0.123461
========================

Press Enter to start the connection demo...

[Step 3] Starting Bob's monitoring service
[Monitor] Monitoring incoming requests on topic 0.0.123460

[Step 4] Alice connecting to Bob
Alice submitting connection request to Bob...
✅ Connection request submitted with sequence number: 1

[Step 5] Waiting for connection confirmation
[Monitor] Processing connection request #1 from 0.0.123456
[Monitor] ✅ Connection confirmed with topic ID: 0.0.123462
[Connection] ✅ Confirmation received! Connection Topic: 0.0.123462

🎉 Connection established! Topic ID: 0.0.123462
Connection Topic: 0.0.123462
HashScan Link: https://hashscan.io/testnet/topic/0.0.123462

[Step 6] Testing message exchange
Alice sending a message to Bob...
✅ Message sent successfully!
Message Status: SUCCESS
Transaction: https://hashscan.io/testnet/transaction/...

────────────────────────────────────────────────────────────
🎉 Two-Agent Demo completed!

📋 What happened:
1. ✅ Alice agent created/loaded
2. ✅ Bob agent created/loaded
3. ✅ Bob started monitoring for connections
4. ✅ Alice sent connection request to Bob
5. ✅ Bob automatically accepted the connection
6. ✅ Alice and Bob can now exchange messages
```

## 🔍 Environment Variables Created

After running the demo, these environment variables will be automatically added to your `.env` file:

```env
# Alice Agent
ALICE_ACCOUNT_ID=0.0.123456
ALICE_PRIVATE_KEY=302e020100300506032b6570...
ALICE_INBOUND_TOPIC_ID=0.0.123457
ALICE_OUTBOUND_TOPIC_ID=0.0.123458
ALICE_PROFILE_TOPIC_ID=0.0.123465

# Bob Agent  
BOB_ACCOUNT_ID=0.0.123459
BOB_PRIVATE_KEY=302e020100300506032b6570...
BOB_INBOUND_TOPIC_ID=0.0.123460
BOB_OUTBOUND_TOPIC_ID=0.0.123461
BOB_PROFILE_TOPIC_ID=0.0.123466
```

## 🧠 How It Works

This demo follows the **Alice & Bob** pattern from the standards-sdk2 reference:

1. **Agent Creation**: Each agent gets its own Hedera account and HCS topics
2. **Monitoring**: Bob runs a background service listening for connection requests
3. **Connection Request**: Alice sends a structured message to Bob's inbound topic
4. **Automatic Acceptance**: Bob's monitor detects the request and creates a shared topic
5. **Confirmation**: Alice waits for confirmation containing the new topic ID
6. **Communication**: Both agents can now send messages on the shared topic

## 🆚 Comparison with Individual Scripts

| Feature | Individual Scripts | Two-Agent Demo |
|---------|-------------------|----------------|
| Agent Creation | Manual, one at a time | Automatic, both agents |
| Connection Setup | Manual monitoring required | Automatic background monitoring |
| Connection Flow | Manual coordination | Fully automated |
| Message Testing | Separate script needed | Built-in test message |
| Learning Curve | Multiple steps to understand | Single demo shows everything |

## 🔧 Troubleshooting

**Q: "Failed to create Alice/Bob agent"**
A: Check that your `HEDERA_ACCOUNT_ID` and `HEDERA_PRIVATE_KEY` are set correctly and have sufficient HBAR balance.

**Q: "Connection timeout"**
A: Network propagation can be slow. The demo waits up to 60 seconds for confirmation.

**Q: "Monitor not responding"**
A: The monitoring service runs for 60 seconds. If no requests come in, it will timeout naturally.

## 🔗 Next Steps

After running this demo, you can:
- Use the individual connection scripts with the created agents
- Build your own multi-agent applications
- Explore the message exchange patterns
- Add more sophisticated agent behaviors

## 📚 Related Scripts

- `pnpm run 02:register` - Create individual agents
- `pnpm run 03:connect` - Manual connection between agents  
- `pnpm run 03:monitor` - Monitor incoming connections
- `pnpm run 03:messages` - Send messages between connected agents