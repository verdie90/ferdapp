// ==================== ENUMS ====================

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  USER = 'user',
  AI_AGENT = 'ai_agent'
}

export enum PermissionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage'
}

export enum AIAgentType {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  CUSTOM = 'custom'
}

export enum TemplateType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video'
}

export enum BroadcastStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// ==================== USER & AUTH ====================

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  organizationId?: string;
  parentId?: string; // untuk hierarchy (admin yang create user ini)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

// ==================== ROLES & PERMISSIONS ====================

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  hierarchyLevel: number; // 1=superadmin, 2=admin, 3=supervisor, 4=user
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string; // 'users', 'templates', 'broadcasts', etc
  action: PermissionType;
  description?: string;
}

export interface RoleAssignment {
  userId: string;
  roleId: string;
  organizationId?: string;
  assignedBy: string;
  assignedAt: Date;
}

// ==================== ORGANIZATION ====================

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logoURL?: string;
  superadminId: string;
  settings?: {
    timezone?: string;
    language?: string;
    maxUsers?: number;
    maxAgents?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== WHATSAPP INTEGRATION ====================

export interface WhatsAppAccount {
  id: string;
  userId: string;
  accountType: 'cloud' | 'business'; // Cloud API or Business API
  phoneNumber: string;
  waBusinessAccountId?: string;
  accessToken?: string;
  refreshToken?: string;
  businessPhoneNumberId?: string;
  isConnected: boolean;
  isVerified: boolean;
  connectedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppMessage {
  id: string;
  accountId: string;
  senderId: string;
  recipientId: string;
  messageType: 'text' | 'image' | 'document' | 'video' | 'audio' | 'template';
  content: {
    text?: string;
    mediaUrl?: string;
    caption?: string;
    templateName?: string;
    parameters?: Record<string, unknown>;
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  statusMessage?: string;
  whatsappMessageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
          [key: string]: unknown;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

// ==================== AI AGENT ====================

export interface AIAgent {
  id: string;
  name: string;
  description?: string;
  type: AIAgentType;
  ownerId: string; // userId of supervisor/user
  organizationId: string;
  isActive: boolean;
  config: {
    apiKey?: string;
    model?: string; // gpt-4, gemini-pro, etc
    systemPrompt: string;
    temperature?: number;
    maxTokens?: number;
    personality?: string; // custom personality description
    knowledge?: string; // custom knowledge base
  };
  responseRules?: ResponseRule[];
  whatsappAccountIds?: string[]; // linked accounts
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  totalResponses?: number;
}

export interface ResponseRule {
  id: string;
  agentId: string;
  trigger: string; // regex or keyword
  response: string;
  priority: number;
  enabled: boolean;
}

export interface AIConversation {
  id: string;
  agentId: string;
  contactId: string; // WhatsApp contact
  messages: AIMessage[];
  status: 'active' | 'archived' | 'closed';
  context?: Record<string, unknown>;
  startedAt: Date;
  lastMessageAt: Date;
  endedAt?: Date;
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    confidence?: number;
    model?: string;
    tokenUsage?: number;
  };
  createdAt: Date;
}

// ==================== TEMPLATES & BROADCASTS ====================

export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  type: TemplateType;
  createdBy: string; // supervisor/user id
  organizationId: string;
  content: {
    text?: string;
    mediaUrl?: string;
    mediaType?: string;
    buttons?: Array<{
      text: string;
      type: 'url' | 'phone' | 'action';
      value: string;
    }>;
    variables?: string[]; // {{variable_name}}
  };
  category?: string;
  isActive: boolean;
  isTemplate: boolean; // for WhatsApp templates
  whatsappTemplateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Broadcast {
  id: string;
  name: string;
  templateId?: string;
  createdBy: string; // supervisor/user id
  organizationId: string;
  recipients: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    failed_numbers?: string[]; // WhatsApp numbers that failed
  };
  message: {
    text?: string;
    templateName?: string;
    parameters?: Record<string, unknown>;
    mediaUrl?: string;
  };
  status: BroadcastStatus;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: {
    failureReasons?: Array<{ number: string; reason: string }>;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== CONTACTS ====================

export interface Contact {
  id: string;
  phoneNumber: string;
  displayName?: string;
  email?: string;
  organizationId: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  lastInteractionAt?: Date;
  totalMessages?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== AUDIT & LOGS ====================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string; // 'user', 'template', 'broadcast', etc
  resourceId?: string;
  changes?: Record<string, unknown>;
  status: 'success' | 'failure';
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  createdAt: Date;
}

// ==================== API RESPONSES ====================

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
