// ==================== ENUMS ====================

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  USER = 'user',
}

export enum ChatStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  CLOSED = 'closed',
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending',
  ERROR = 'error',
}

export enum BroadcastStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
}

export enum AIProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
}

export enum AIModel {
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_35_TURBO = 'gpt-3.5-turbo',
  GEMINI_PRO = 'gemini-pro',
  GEMINI_15_FLASH = 'gemini-1.5-flash',
}

// ==================== USERS COLLECTION ====================

export interface FerdUser {
  // Document ID = uid dari Firebase Auth
  id: string;
  email: string;
  name: string;
  role: UserRole; // 'superadmin', 'admin', 'supervisor', 'user'
  photoURL?: string;
  phoneNumber?: string;
  
  // Hierarchy
  adminId?: string; // untuk supervisor: id admin yang manage
  supervisorId?: string; // untuk user: id supervisor yang assign
  
  // Status
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  lastActivityAt?: Date;
  
  // Metadata
  metadata?: {
    department?: string;
    jobTitle?: string;
    customFields?: Record<string, unknown>;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== AI_AGENTS COLLECTION ====================

export interface AIAgent {
  // Document ID = auto-generated
  id: string;
  userId: string; // supervisor atau user yang create agent
  name: string;
  description?: string;
  
  // Configuration
  provider: AIProvider; // 'openai' atau 'gemini'
  model: AIModel;
  apiKeyEncrypted: string; // encrypted dengan admin SDK
  
  // Parameters
  temperature?: number; // 0-2, default 0.7
  maxTokens?: number; // default 2000
  systemPrompt?: string;
  
  // Features
  autoReplyEnabled: boolean;
  autoReplyKeywords?: string[];
  
  // Usage
  isActive: boolean;
  totalMessages?: number;
  totalCosts?: number;
  
  // Relations
  behaviourId?: string; // reference ke AI_BEHAVIOURS
  knowledgeId?: string; // reference ke AI_KNOWLEDGE
  
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

// ==================== AI_BEHAVIOURS COLLECTION ====================

export interface AIBehaviour {
  // Document ID = auto-generated
  id: string;
  userId: string;
  name: string;
  
  // Personality
  personality: string; // e.g., "profesional tapi ramah", "formal", "casual"
  communicationStyle: string; // "verbose" | "concise" | "balanced"
  tone: string; // "friendly" | "professional" | "humorous" | "serious"
  
  // Guidelines
  responseGuidelines: string[]; // array of rules/guidelines
  limitations: string[]; // array of what agent should NOT do
  customInstructions: string; // detailed custom instructions
  
  // Behavior
  shouldAskClarification: boolean;
  shouldProvideExamples: boolean;
  shouldIncludeDisclaimer: boolean;
  disclaimerText?: string;
  
  // Response handling
  handoffKeywords?: string[]; // keywords that trigger human handoff
  handoffPrompt?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== AI_KNOWLEDGE COLLECTION ====================

export interface AIKnowledge {
  // Document ID = auto-generated
  id: string;
  userId: string;
  name: string;
  description?: string;
  
  // Knowledge sources
  documents: {
    id: string;
    title: string;
    content: string;
    uploadedAt: Date;
    url?: string;
  }[];
  
  faqs: {
    id: string;
    question: string;
    answer: string;
    category?: string;
  }[];
  
  productInfo: {
    id: string;
    name: string;
    description: string;
    price?: number;
    features?: string[];
    specs?: Record<string, unknown>;
  }[];
  
  policies: {
    id: string;
    title: string;
    content: string;
    category?: string;
    effectiveDate?: Date;
  }[];
  
  // Vector embeddings for semantic search
  vectorEmbeddingsEnabled: boolean;
  lastTrainedAt?: Date;
  
  // Statistics
  totalDocuments: number;
  totalFAQs: number;
  totalProducts: number;
  totalPolicies: number;
  
  // Status
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== WHATSAPP_DEVICES COLLECTION ====================

export interface WhatsAppDevice {
  // Document ID = auto-generated
  id: string;
  userId: string; // user yang punya device
  
  // Device info
  phoneNumber: string; // WhatsApp number
  deviceName?: string;
  
  // Connection
  connectionStatus: ConnectionStatus;
  isLoggedIn: boolean;
  
  // QR Code for pairing
  qrCode?: string;
  qrCodeExpiresAt?: Date;
  
  // Session
  sessionDataEncrypted?: string; // encrypted session data
  
  // Quotas & Limits
  messageQuota?: {
    dailyLimit: number;
    dailyUsed: number;
    resetAt: Date;
  };
  
  // Statistics
  totalMessagesSent?: number;
  totalMessagesReceived?: number;
  
  // Timestamps
  connectedAt?: Date;
  lastSeenAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CONTACTS COLLECTION ====================

export interface Contact {
  // Document ID = auto-generated
  id: string;
  supervisorId: string; // supervisor yang manage contact
  assignedUserId?: string; // user yang handle contact ini
  
  // Contact info
  name: string;
  phone: string; // WhatsApp number
  email?: string;
  
  // Organization
  companyName?: string;
  jobTitle?: string;
  
  // Categorization
  tags?: string[]; // e.g., ["vip", "lead", "customer", "support"]
  category?: string; // e.g., "customer", "prospect", "supplier"
  
  // Interaction tracking
  totalMessages?: number;
  totalReplies?: number;
  lastMessageAt?: Date;
  responseRate?: number; // percentage
  
  // Custom fields
  customFields?: Record<string, unknown>;
  
  // Status
  isBlocked?: boolean;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== BROADCASTS COLLECTION ====================

export interface Broadcast {
  // Document ID = auto-generated
  id: string;
  supervisorId: string; // supervisor yang create broadcast
  
  // Basic info
  title: string;
  description?: string;
  
  // Content
  templateId?: string; // reference ke template jika ada
  messageContent: {
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'document' | 'video';
  };
  
  // Recipients
  assignedUserIds: string[]; // user yang akan send message
  recipientContactIds?: string[]; // specific contacts (jika tidak, ke semua)
  
  // Scheduling
  status: BroadcastStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Statistics
  statistics: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    read?: number;
    replied?: number;
  };
  
  // Retry & Error
  failedRecipients?: Array<{
    contactId: string;
    phone: string;
    reason: string;
  }>;
  
  // Settings
  retryFailed: boolean;
  maxRetries?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CHATS COLLECTION ====================

export interface Chat {
  // Document ID = auto-generated
  id: string;
  contactId: string; // reference ke contact
  userId: string; // user yang handle chat
  supervisorId: string; // supervisor yang manage
  
  // Device info
  deviceId: string; // whatsapp device yang handle
  
  // Chat state
  status: ChatStatus;
  isUnread: boolean;
  unreadCount: number;
  
  // Last message
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageFrom?: 'contact' | 'user' | 'ai';
  
  // AI handling
  aiAgentId?: string; // jika chat di-handle oleh AI agent
  isAIHandled: boolean;
  aiHandledSince?: Date;
  humanHandoffNeeded?: boolean;
  humanHandoffReason?: string;
  
  // Statistics
  totalMessages: number;
  totalUserMessages: number;
  totalContactMessages: number;
  totalAIMessages?: number;
  
  // Tags & categorization
  tags?: string[];
  notes?: string;
  
  // Assignments
  previouslyAssignedTo?: string[]; // history of assignments
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== MESSAGES COLLECTION (Sub-collection under CHATS) ====================

export interface Message {
  // Document ID = auto-generated message id
  id: string;
  chatId: string;
  
  // Sender info
  senderId: string; // contact uid, user uid, atau 'ai-agent'
  senderType: 'contact' | 'user' | 'ai';
  senderName?: string;
  
  // Message content
  type: 'text' | 'image' | 'document' | 'video' | 'audio';
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  
  // Status
  status: 'sent' | 'delivered' | 'read' | 'failed';
  
  // AI related
  aiAgentId?: string; // jika message dari AI
  aiConfidence?: number; // 0-100
  
  // Metadata
  whatsappMessageId?: string;
  
  createdAt: Date;
  updatedAt?: Date;
}

// ==================== MESSAGE_TEMPLATES COLLECTION ====================

export interface MessageTemplate {
  // Document ID = auto-generated
  id: string;
  supervisorId: string;
  
  // Basic info
  name: string;
  description?: string;
  category?: string;
  
  // Content
  content: string;
  variables?: string[]; // e.g., ["name", "order_id", "date"]
  mediaUrl?: string;
  mediaType?: 'image' | 'document' | 'video';
  
  // Usage
  usageCount?: number;
  isActive: boolean;
  
  // Tags
  tags?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: Date;
    path?: string;
    [key: string]: unknown;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
