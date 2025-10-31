// ==================== ENUMS ====================

export enum WhatsAppQualityRating {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED',
}

export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
}

export enum TemplateStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

export enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  PENDING = 'pending',
}

export enum WebhookEventType {
  MESSAGE = 'message',
  MESSAGE_STATUS = 'message_status',
  TEMPLATE_STATUS = 'template_status',
  ACCOUNT_ALERT = 'account_alert',
  PHONE_NUMBER_QUALITY_UPDATE = 'phone_number_quality_update',
}

// ==================== WHATSAPP_BUSINESS_ACCOUNTS COLLECTION ====================

export interface WhatsAppBusinessAccount {
  // Document ID = auto-generated
  id: string;

  // Meta IDs
  accountId: string; // WhatsApp Business Account ID dari Meta
  businessId: string; // Business Manager ID dari Meta

  // Owner & Access
  ownerId: string; // Superadmin yang setup akun ini

  // Account Info
  name: string;
  currency: string;
  timezone: string;

  // Status
  isActive: boolean;
  verificationStatus?: string; // pending, verified

  // Metadata
  metadata?: {
    industry?: string;
    estimatedTraffic?: string;
    customFields?: Record<string, unknown>;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  connectedAt?: Date;
}

// ==================== WHATSAPP_PHONE_NUMBERS COLLECTION ====================

export interface WhatsAppPhoneNumber {
  // Document ID = auto-generated
  id: string;

  // References
  wabaId: string; // reference ke whatsapp_business_accounts
  userId: string; // user yang diassign nomor ini

  // Phone Info
  phoneNumber: string; // Format: +[country code][number]
  phoneNumberId: string; // ID dari Meta
  displayName: string; // Display name di WhatsApp

  // Quality & Status
  qualityRating: WhatsAppQualityRating; // GREEN, YELLOW, RED
  verified: boolean;
  isActive: boolean;

  // Webhook Configuration
  webhookUrl: string; // URL untuk menerima webhook dari Meta
  webhookVerifyToken: string; // Token untuk verifikasi webhook

  // Credentials (Encrypted)
  accessTokenEncrypted: string; // Encrypted access token
  accessTokenExpiresAt?: Date;

  // Messaging Limits
  messagingLimit?: {
    dailyLimit: number;
    dailyUsed: number;
    resetAt: Date;
  };

  // Statistics
  statistics?: {
    totalMessagesSent: number;
    totalMessagesReceived: number;
    totalTemplatesSent: number;
    lastActivityAt?: Date;
  };

  // Metadata
  metadata?: {
    capabilities?: string[];
    customFields?: Record<string, unknown>;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastVerifiedAt?: Date;
}

// ==================== WHATSAPP_TEMPLATES COLLECTION ====================

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: Record<string, unknown>;
  buttons?: {
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'OTP';
    text: string;
    url?: string;
    phoneNumber?: string;
  }[];
}

export interface WhatsAppTemplate {
  // Document ID = auto-generated
  id: string;

  // References
  wabaId: string;
  teamLeadId: string; // Supervisor/Team Lead yang manage template

  // Template Info
  name: string;
  category: TemplateCategory; // MARKETING, UTILITY, AUTHENTICATION
  language: string; // e.g., "en_US", "id"

  // Components
  components: TemplateComponent[];

  // Status
  status: TemplateStatus; // APPROVED, PENDING, REJECTED
  rejectionReason?: string; // Jika rejected

  // Meta IDs
  metaTemplateId: string; // Template ID dari Meta

  // Variables
  variables?: {
    bodyVariables?: string[]; // e.g., ["customer_name", "order_id"]
    headerVariables?: string[];
  };

  // Statistics
  statistics?: {
    timesUsed: number;
    lastUsedAt?: Date;
    successRate?: number;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
}

// ==================== WHATSAPP_MESSAGES COLLECTION ====================

export interface MessageContent {
  text?: string;
  caption?: string;
  url?: string;
  mimeType?: string;
  templateName?: string;
  templateLanguage?: string;
  templateVariables?: string[];
  interactive?: {
    type: string;
    header?: string;
    body: string;
    footer?: string;
    action?: Record<string, unknown>;
  };
  document?: {
    link: string;
    mimeType: string;
    filename?: string;
  };
  image?: {
    link: string;
    mimeType: string;
  };
  video?: {
    link: string;
    mimeType: string;
  };
  audio?: {
    link: string;
    mimeType: string;
  };
}

export interface MessageCost {
  currency: string; // e.g., "USD"
  pricePerMessage: number; // Cost per message
  totalCost: number; // Total cost for this message
  billingCategory?: string; // e.g., "STANDARD", "OUTBOUND"
}

export interface WhatsAppMessage {
  // Document ID = auto-generated
  id: string;

  // References
  wabaId: string;
  phoneNumberId: string;
  userId: string; // User yang send message
  contactId?: string; // Contact yang receive message

  // Message Info
  messageId: string; // WhatsApp message ID dari Meta
  direction: MessageDirection; // INBOUND, OUTBOUND
  type: MessageType; // text, image, template, interactive, etc.
  content: MessageContent;

  // Status
  status: MessageStatus; // sent, delivered, read, failed
  failureReason?: string;

  // Template Info (jika template message)
  templateName?: string;

  // Pricing
  cost?: MessageCost;

  // Metadata
  metadata?: {
    conversationId?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  };

  // Timestamps
  timestamp: Date; // When the message was sent/received
  createdAt: Date;
  updatedAt?: Date;
}

// ==================== WHATSAPP_WEBHOOKS COLLECTION ====================

export interface WebhookPayload {
  object?: string;
  entry?: Array<{
    id: string;
    changes: Array<{
      value: Record<string, unknown>;
      field: string;
    }>;
  }>;
  // Flexible structure untuk berbagai event types
  [key: string]: unknown;
}

export interface WhatsAppWebhook {
  // Document ID = auto-generated
  id: string;

  // References
  wabaId: string;

  // Event Info
  eventType: WebhookEventType;
  eventId?: string; // Meta event ID

  // Payload
  payload: WebhookPayload;

  // Processing Status
  processed: boolean;
  processedAt?: Date;
  processingError?: string;

  // Retry Info
  retryCount?: number;
  nextRetryAt?: Date;
  maxRetries?: number;

  // Metadata
  sourceIp?: string;
  webhookSignature?: string;
  metadata?: {
    customFields?: Record<string, unknown>;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  receivedAt: Date;
}

// ==================== WHATSAPP_CONTACTS COLLECTION ====================
// (Extended dari Contact collection di firestore.ts)

export interface WhatsAppContact {
  // Document ID = auto-generated
  id: string;

  // References
  wabaId: string;
  phoneNumberId: string;

  // Contact Info
  phoneNumber: string; // WhatsApp number
  displayName?: string;
  email?: string;

  // WhatsApp Profile
  profilePicUrl?: string;
  profileStatus?: string;
  profileAbout?: string;

  // Conversation State
  lastMessageDirection?: MessageDirection;
  lastMessageAt?: Date;
  conversationStatus?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

  // Statistics
  totalMessages?: number;
  totalInboundMessages?: number;
  totalOutboundMessages?: number;

  // Tags & Labels
  tags?: string[];
  customFields?: Record<string, unknown>;

  // Timestamps
  firstContactAt: Date;
  lastContactAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== WHATSAPP_CONVERSATION_SESSIONS COLLECTION ====================
// Untuk tracking conversation sessions

export interface WhatsAppConversationSession {
  // Document ID = auto-generated
  id: string;

  // References
  wabaId: string;
  phoneNumberId: string;
  contactPhoneNumber: string;
  userId?: string; // User yang handle conversation

  // Session Info
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED';
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;

  // Message Count in Session
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;

  // Last Interaction
  lastMessageId?: string;
  lastMessageAt?: Date;
  lastMessageDirection?: MessageDirection;

  // Response Metrics
  averageResponseTime?: number; // seconds
  firstResponseTime?: number; // seconds

  // Classification
  category?: string; // e.g., "sales", "support", "inquiry"
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

  // Metadata
  metadata?: {
    sourceOfConversation?: string;
    customFields?: Record<string, unknown>;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface SendMessageRequest {
  phoneNumber: string;
  type: MessageType;
  content: MessageContent;
  templateName?: string;
  templateVariables?: string[];
}

export interface SendMessageResponse {
  messageId: string;
  status: MessageStatus;
  timestamp: Date;
  cost?: MessageCost;
}

export interface WebhookVerificationChallenge {
  challenge: string;
}

export interface BatchMessageRequest {
  phoneNumbers: string[];
  type: MessageType;
  content: MessageContent;
  templateName?: string;
}

export interface BatchMessageResponse {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  messages: Array<{
    phoneNumber: string;
    messageId: string;
    status: MessageStatus;
    error?: string;
  }>;
}

// ==================== WHATSAPP_METRICS COLLECTION ====================
// Untuk analytics & reporting

export interface WhatsAppDailyMetrics {
  // Document ID = date-phoneNumberId (e.g., "2024-01-15-phoneNumberId123")
  id: string;

  // References
  wabaId: string;
  phoneNumberId: string;
  date: Date;

  // Message Metrics
  totalMessagesSent: number;
  totalMessagesReceived: number;
  totalTemplatesSent: number;

  // Status Breakdown
  successfullySent: number;
  delivered: number;
  read: number;
  failed: number;

  // Cost Metrics
  totalCost: number;
  currencyCode: string;
  costPerMessage: number;

  // Quality Metrics
  failureRate: number; // percentage
  deliveryRate: number; // percentage
  readRate: number; // percentage

  // Contact Metrics
  uniqueContactsContacted: number;
  uniqueContactsResponded: number;

  // Response Time Metrics
  averageResponseTime?: number; // seconds
  medianResponseTime?: number; // seconds

  // Template Performance
  topTemplates?: Array<{
    templateName: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ==================== ERROR TRACKING ====================

export interface WhatsAppError {
  // Document ID = auto-generated
  id: string;

  // References
  wabaId: string;
  phoneNumberId?: string;
  messageId?: string;

  // Error Info
  errorCode: string;
  errorMessage: string;
  errorType: string; // e.g., "API_ERROR", "WEBHOOK_ERROR", "VALIDATION_ERROR"

  // Context
  context?: {
    operation: string;
    requestData?: Record<string, unknown>;
    responseData?: Record<string, unknown>;
  };

  // Resolution
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNotes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
