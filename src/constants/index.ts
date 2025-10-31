export const COLLECTIONS = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  ORGANIZATIONS: 'organizations',
  ROLE_ASSIGNMENTS: 'role_assignments',
  WHATSAPP_ACCOUNTS: 'whatsapp_accounts',
  WHATSAPP_MESSAGES: 'whatsapp_messages',
  AI_AGENTS: 'ai_agents',
  AI_CONVERSATIONS: 'ai_conversations',
  RESPONSE_RULES: 'response_rules',
  MESSAGE_TEMPLATES: 'message_templates',
  BROADCASTS: 'broadcasts',
  CONTACTS: 'contacts',
  AUDIT_LOGS: 'audit_logs',
  WEBHOOK_LOGS: 'webhook_logs',
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
    canManage: ['admin', 'organizations'],
    permissions: ['create', 'read', 'update', 'delete', 'manage'],
  },
  ADMIN: {
    level: 2,
    canManage: ['supervisor', 'users', 'organization_settings'],
    permissions: ['create', 'read', 'update', 'delete'],
  },
  SUPERVISOR: {
    level: 3,
    canManage: ['users', 'templates', 'broadcasts', 'contacts', 'ai_agents'],
    permissions: ['create', 'read', 'update', 'delete'],
  },
  USER: {
    level: 4,
    canManage: ['own_profile', 'own_whatsapp_account'],
    permissions: ['read', 'update'],
  },
  AI_AGENT: {
    level: 5,
    canManage: [],
    permissions: ['read'],
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
