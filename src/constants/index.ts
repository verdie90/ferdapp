export const COLLECTIONS = {
  // Core
  USERS: 'USERS',
  AUDIT_LOGS: 'AUDIT_LOGS',
  
  // AI System
  AI_AGENTS: 'AI_AGENTS',
  AI_BEHAVIOURS: 'AI_BEHAVIOURS',
  AI_KNOWLEDGE: 'AI_KNOWLEDGE',
  
  // WhatsApp System (Generic)
  WHATSAPP_DEVICES: 'WHATSAPP_DEVICES',
  CHATS: 'CHATS',
  
  // WhatsApp Cloud API Integration
  WHATSAPP_BUSINESS_ACCOUNTS: 'WHATSAPP_BUSINESS_ACCOUNTS',
  WHATSAPP_PHONE_NUMBERS: 'WHATSAPP_PHONE_NUMBERS',
  WHATSAPP_TEMPLATES: 'WHATSAPP_TEMPLATES',
  WHATSAPP_MESSAGES: 'WHATSAPP_MESSAGES',
  WHATSAPP_CONTACTS: 'WHATSAPP_CONTACTS',
  WHATSAPP_CONVERSATION_SESSIONS: 'WHATSAPP_CONVERSATION_SESSIONS',
  WHATSAPP_WEBHOOKS: 'WHATSAPP_WEBHOOKS',
  WHATSAPP_METRICS: 'WHATSAPP_METRICS',
  WHATSAPP_ERRORS: 'WHATSAPP_ERRORS',
  
  // Contact Management
  CONTACTS: 'CONTACTS',
  
  // Campaign Management
  MESSAGE_TEMPLATES: 'MESSAGE_TEMPLATES',
  BROADCASTS: 'BROADCASTS',
} as const;

export const FIRESTORE_INDEXES = {
  USERS: {
    'organizationId': 'Ascending',
    'role': 'Ascending',
    'isActive': 'Ascending',
    'createdAt': 'Descending',
  },
  BROADCASTS: {
    'organizationId': 'Ascending',
    'status': 'Ascending',
    'createdAt': 'Descending',
  },
  MESSAGES: {
    'accountId': 'Ascending',
    'status': 'Ascending',
    'sentAt': 'Descending',
  },
  AI_AGENTS: {
    'organizationId': 'Ascending',
    'isActive': 'Ascending',
    'createdAt': 'Descending',
  },
} as const;

export const RBAC_HIERARCHY = {
  SUPERADMIN: {
    level: 1,
    label: 'Super Administrator',
    canManage: ['admin', 'organizations', 'all'],
    permissions: ['create', 'read', 'update', 'delete', 'manage', 'audit'],
  },
  ADMIN: {
    level: 2,
    label: 'Administrator',
    canManage: ['supervisor', 'users', 'organization_settings'],
    permissions: ['create', 'read', 'update', 'delete', 'manage'],
  },
  SUPERVISOR: {
    level: 3,
    label: 'Supervisor',
    canManage: ['users', 'templates', 'broadcasts', 'contacts', 'ai_agents', 'chats'],
    permissions: ['create', 'read', 'update', 'delete'],
  },
  USER: {
    level: 4,
    label: 'Regular User',
    canManage: ['own_profile', 'own_whatsapp_device', 'own_chats'],
    permissions: ['read', 'update', 'send_message'],
  },
} as const;

export const ERROR_CODES = {
  // Auth errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  INVALID_PASSWORD: 'INVALID_PASSWORD',

  // Permission errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_INPUT: 'INVALID_INPUT',

  // WhatsApp errors
  WHATSAPP_ACCOUNT_NOT_FOUND: 'WHATSAPP_ACCOUNT_NOT_FOUND',
  WHATSAPP_API_ERROR: 'WHATSAPP_API_ERROR',
  WHATSAPP_WEBHOOK_ERROR: 'WHATSAPP_WEBHOOK_ERROR',
  WHATSAPP_TEMPLATE_ERROR: 'WHATSAPP_TEMPLATE_ERROR',
  WHATSAPP_MESSAGE_FAILED: 'WHATSAPP_MESSAGE_FAILED',
  WHATSAPP_INVALID_PHONE: 'WHATSAPP_INVALID_PHONE',
  WHATSAPP_RATE_LIMITED: 'WHATSAPP_RATE_LIMITED',
  WHATSAPP_QUALITY_RED: 'WHATSAPP_QUALITY_RED',
  INVALID_PHONE_NUMBER: 'INVALID_PHONE_NUMBER',

  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
