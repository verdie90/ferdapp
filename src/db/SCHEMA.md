# Firestore Database Schema Documentation

## Collections dan Structure

### 1. **users** - User Accounts

Menyimpan semua user dalam aplikasi dengan role-based access

```typescript
{
  uid: string (Firebase Auth UID)
  email: string
  displayName?: string
  photoURL?: string
  role: 'superadmin' | 'admin' | 'supervisor' | 'user' | 'ai_agent'
  organizationId?: string (referensi ke organizations)
  parentId?: string (user yang membuat user ini)
  isActive: boolean
  metadata?: {
    department?: string
    phone?: string
    customFields?: any
  }
  createdAt: Timestamp
  updatedAt: Timestamp
  lastLoginAt?: Timestamp
}

Index:
- organizationId + role + isActive (for filtering by org and role)
- email (unique)
```

### 2. **organizations** - Organisasi/Perusahaan

```typescript
{
  id: string (auto-generated atau custom)
  name: string
  description?: string
  logoURL?: string
  superadminId: string (referensi ke users)
  settings?: {
    timezone?: string
    language?: string
    maxUsers?: number
    maxAgents?: number
    customBranding?: object
  }
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

Index:
- superadminId
- isActive
```

### 3. **roles** - Custom Roles

```typescript
{
  id: string
  name: string (e.g., "Custom Admin", "Manager")
  description?: string
  organizationId?: string (null untuk global roles)
  permissions: string[] (referensi ke permission IDs)
  hierarchyLevel: number (1=superadmin, 2=admin, 3=supervisor, 4=user)
  createdAt: Timestamp
  updatedAt: Timestamp
}

Index:
- organizationId + hierarchyLevel
```

### 4. **permissions** - Available Permissions

```typescript
{
  id: string
  resource: string ('users', 'templates', 'broadcasts', 'agents', etc)
  action: string ('create', 'read', 'update', 'delete', 'manage')
  description?: string
  createdAt: Timestamp
}

Pre-defined permissions untuk setiap resource.
```

### 5. **role_assignments** - User Role Assignments

```typescript
{
  userId: string (referensi ke users)
  roleId: string (referensi ke roles)
  organizationId?: string
  assignedBy: string (user ID yang assign)
  assignedAt: Timestamp
}

Index:
- userId + organizationId
- roleId
```

### 6. **whatsapp_accounts** - WhatsApp Account Integration

```typescript
{
  id: string
  userId: string (owner of the account)
  accountType: 'cloud' | 'business'
  phoneNumber: string
  waBusinessAccountId?: string (for Cloud API)
  accessToken?: string
  refreshToken?: string
  businessPhoneNumberId?: string
  isConnected: boolean
  isVerified: boolean
  connectedAt?: Timestamp
  metadata?: {
    displayName?: string
    profilePicture?: string
    lastSync?: Timestamp
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

Index:
- userId + isConnected
- phoneNumber (unique)
```

### 7. **whatsapp_messages** - Message History

```typescript
{
  id: string
  accountId: string (referensi ke whatsapp_accounts)
  senderId: string
  recipientId: string (WhatsApp contact ID)
  messageType: 'text' | 'image' | 'document' | 'video' | 'audio' | 'template'
  content: {
    text?: string
    mediaUrl?: string
    caption?: string
    templateName?: string
    parameters?: object
  }
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  statusMessage?: string
  whatsappMessageId?: string (dari WhatsApp API)
  sentAt?: Timestamp
  deliveredAt?: Timestamp
  readAt?: Timestamp
  metadata?: {
    direction: 'inbound' | 'outbound'
    source?: string (broadcast, agent, manual, etc)
    costTokens?: number (untuk Cloud API)
  }
  createdAt: Timestamp
}

Index:
- accountId + status + sentAt (untuk tracking)
- recipientId + sentAt (untuk conversation history)
```

### 8. **ai_agents** - AI Agent Configurations

```typescript
{
  id: string
  name: string
  description?: string
  type: 'openai' | 'gemini' | 'custom'
  ownerId: string (supervisor/user yang create)
  organizationId: string
  isActive: boolean
  config: {
    apiKey?: string (encrypted)
    model: string ('gpt-4', 'gpt-3.5-turbo', 'gemini-pro', etc)
    systemPrompt: string
    temperature?: number (0-2)
    maxTokens?: number
    personality?: string
    knowledge?: string (knowledge base/context)
  }
  responseRules?: {
    trigger: string (regex pattern)
    response: string
    priority: number
    enabled: boolean
  }[]
  whatsappAccountIds: string[] (linked accounts)
  totalResponses: number
  lastUsedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

Index:
- organizationId + isActive
- ownerId
```

### 9. **ai_conversations** - Conversation History

```typescript
{
  id: string
  agentId: string (referensi ke ai_agents)
  contactId: string (WhatsApp contact)
  messages: {
    id: string
    role: 'user' | 'assistant'
    content: string
    metadata?: {
      confidence?: number
      model?: string
      tokenUsage?: number
    }
    createdAt: Timestamp
  }[]
  status: 'active' | 'archived' | 'closed'
  context?: object
  startedAt: Timestamp
  lastMessageAt: Timestamp
  endedAt?: Timestamp
}

Index:
- agentId + status
- contactId + lastMessageAt
```

### 10. **response_rules** - AI Response Rules

```typescript
{
  id: string
  agentId: string
  trigger: string (keyword atau regex)
  response: string
  priority: number
  enabled: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

Index:
- agentId + enabled
```

### 11. **message_templates** - Pesan Template

```typescript
{
  id: string
  name: string
  description?: string
  type: 'text' | 'image' | 'document' | 'video'
  createdBy: string (supervisor/user)
  organizationId: string
  content: {
    text?: string
    mediaUrl?: string
    mediaType?: string
    buttons?: {
      text: string
      type: 'url' | 'phone' | 'action'
      value: string
    }[]
    variables?: string[] (e.g., {{name}}, {{order_id}})
  }
  category?: string
  isActive: boolean
  isTemplate: boolean (untuk WhatsApp approved templates)
  whatsappTemplateId?: string
  usageCount?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

Index:
- organizationId + isActive
- createdBy
```

### 12. **broadcasts** - Campaign/Broadcast

```typescript
{
  id: string
  name: string
  templateId?: string (referensi ke message_templates)
  createdBy: string
  organizationId: string
  recipients: {
    total: number
    sent: number
    delivered: number
    failed: number
    failed_numbers?: string[]
  }
  message: {
    text?: string
    templateName?: string
    parameters?: object
    mediaUrl?: string
  }
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  scheduledFor?: Timestamp
  startedAt?: Timestamp
  completedAt?: Timestamp
  metadata?: {
    failureReasons?: [
      { number: string, reason: string }
    ]
    totalTokens?: number (WhatsApp Cloud API)
    cost?: number
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

Index:
- organizationId + status + scheduledFor
- createdBy + createdAt
```

### 13. **contacts** - WhatsApp Contact List

```typescript
{
  id: string
  phoneNumber: string (WhatsApp number)
  displayName?: string
  email?: string
  organizationId: string
  tags?: string[]
  metadata?: {
    source?: string (contact list, broadcast, etc)
    lastInteractionAt?: Timestamp
    customFields?: object
  }
  lastInteractionAt?: Timestamp
  totalMessages?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

Index:
- organizationId + phoneNumber (unique combination)
- tags (untuk filtering by tag)
```

### 14. **audit_logs** - Audit Trail

```typescript
{
  id: string
  userId: string
  action: string
  resource: string (user, template, broadcast, agent)
  resourceId?: string
  changes?: {
    before?: object
    after?: object
  }
  status: 'success' | 'failure'
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
  organizationId?: string
  createdAt: Timestamp
}

Index:
- organizationId + createdAt
- userId + createdAt
```

### 15. **webhook_logs** - Webhook Events Log

```typescript
{
  id: string
  source: string (whatsapp, etc)
  event: string
  accountId: string
  payload: object (raw webhook data)
  processed: boolean
  processedAt?: Timestamp
  error?: string
  createdAt: Timestamp
}

Index:
- accountId + createdAt
- source + processed
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users dapat membaca/update profile sendiri
    match /users/{userId} {
      allow read, update: if request.auth.uid == userId;
      allow create: if request.auth != null;
    }

    // Organizations - hanya members
    match /organizations/{orgId} {
      allow read: if resource.data.members[request.auth.uid] != null;
      allow update: if resource.data.superadminId == request.auth.uid;
    }

    // Templates - hanya org members
    match /message_templates/{docId} {
      allow read, create, update, delete: if
        exists(/databases/$(database)/documents/organizations/$(request.auth.token.organizationId)/members/$(request.auth.uid));
    }

    // Broadcasts - supervisors dan admin only
    match /broadcasts/{docId} {
      allow create: if request.auth.token.role in ['admin', 'supervisor'];
      allow read, update, delete: if
        resource.data.createdBy == request.auth.uid ||
        request.auth.token.role == 'admin' ||
        request.auth.token.role == 'superadmin';
    }
  }
}
```

## Recommended Indexes

Buat indexes di Firestore Console untuk optimize queries:

1. **users**: organizationId + role + isActive + createdAt
2. **broadcasts**: organizationId + status + createdAt
3. **whatsapp_messages**: accountId + sentAt
4. **ai_agents**: organizationId + isActive + createdAt
5. **contacts**: organizationId + createdAt
6. **audit_logs**: organizationId + createdAt + userId

## Data Migration Strategy

1. Start dengan users collection
2. Setup organizations
3. Create roles dan permissions
4. Setup whatsapp_accounts
5. Add templates dan broadcasts
6. Initialize ai_agents
7. Start logging audit_logs

## Backup Strategy

- Daily export ke Cloud Storage
- Monthly full backup dengan compression
- Point-in-time recovery minimal 7 hari
