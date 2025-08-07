import { Client, AccountId, PrivateKey, Hbar, AccountBalanceQuery } from '@hashgraph/sdk';
import * as dotenv from 'dotenv';
import { DemoLogger } from './logger';

dotenv.config();

const logger = new DemoLogger('HederaClient');

export interface ClientConfig {
  accountId?: string;
  privateKey?: string;
  network?: 'testnet' | 'mainnet';
}

export interface HederaClientWithKeys extends Client {
  operatorPrivateKey?: PrivateKey;
}

export function createHederaClient(config?: ClientConfig): HederaClientWithKeys {
  const accountId = config?.accountId || process.env.HEDERA_ACCOUNT_ID;
  const privateKey = config?.privateKey || process.env.HEDERA_PRIVATE_KEY;
  const network = config?.network || process.env.HEDERA_NETWORK || 'testnet';

  if (!accountId || !privateKey) {
    throw new Error(
      'Missing required environment variables: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY'
    );
  }

  const client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  
  const privateKeyObj = PrivateKey.fromString(privateKey);
  
  client.setOperator(
    AccountId.fromString(accountId),
    privateKeyObj
  );

  // Set default max transaction fee and query payment
  client.setDefaultMaxTransactionFee(new Hbar(10));
  client.setDefaultMaxQueryPayment(new Hbar(2));

  logger.info(`Client configured for ${network} with account ${accountId}`);

  // Extend client with private key
  const extendedClient = client as HederaClientWithKeys;
  extendedClient.operatorPrivateKey = privateKeyObj;

  return extendedClient;
}

export async function checkBalance(client: Client): Promise<string> {
  const operatorId = client.operatorAccountId;
  if (!operatorId) {
    throw new Error('No operator account ID set');
  }

  const balanceQuery = new AccountBalanceQuery()
    .setAccountId(operatorId);
  const balance = await balanceQuery.execute(client);
  return balance.hbars.toString();
}