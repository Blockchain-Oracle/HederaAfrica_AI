// Shared TypeScript types for all demos

export interface DemoConfig {
  network: 'testnet' | 'mainnet';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  timeout?: number;
}

export interface AgentInfo {
  accountId: string;
  privateKey: string;
  name?: string;
  description?: string;
  inboundTopicId?: string;
  outboundTopicId?: string;
}

export interface ConnectionInfo {
  connectionTopicId: string;
  otherAgent: string;
  status: 'pending' | 'active' | 'closed';
  createdAt: Date;
}

export interface MessagePayload {
  type: string;
  data: any;
  timestamp?: number;
  sender?: string;
}