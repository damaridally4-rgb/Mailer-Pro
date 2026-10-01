export interface Recipient {
  id: string;
  email: string;
  isValid: boolean;
  fields: Record<string, string>;
  status: 'pending' | 'queued' | 'sending' | 'sent' | 'failed';
  errorMessage?: string;
  sentAt?: string;
  latencyMs?: number;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  base64: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  category: 'outreach' | 'announcement' | 'event' | 'transactional' | 'custom';
  subject: string;
  body: string;
  updatedAt: string;
}

export interface BatchConfig {
  senderName: string;
  senderEmail: string;
  replyTo: string;
  batchSize: number;
  delaySeconds: number;
  failureSimulationRate: number; // 0 to 50% for testing retry resilience
  sendMode: 'sandbox' | 'custom_relay' | 'export_eml';
  customRelayUrl?: string;
  customApiKey?: string;
}

export interface CampaignHistoryItem {
  id: string;
  title: string;
  startedAt: string;
  completedAt?: string;
  status: 'completed' | 'stopped' | 'failed' | 'in_progress';
  totalCount: number;
  sentCount: number;
  failedCount: number;
  recipients: Recipient[];
  templateSubject: string;
  attachmentsCount: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  recipientEmail?: string;
}
