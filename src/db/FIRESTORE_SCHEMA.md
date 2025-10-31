# Firestore Database Schema - FerdApp

## Table of Contents

1. [Collections Overview](#collections-overview)
2. [Collection Details](#collection-details)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Security Rules](#security-rules)
6. [Data Migrations](#data-migrations)

---

## Collections Overview

| Collection        | Purpose                           | Parent | Contains                            |
| ----------------- | --------------------------------- | ------ | ----------------------------------- |
| USERS             | User accounts with role hierarchy | Root   | -                                   |
| AI_AGENTS         | AI agent configurations           | Root   | -                                   |
| AI_BEHAVIOURS     | AI behavior/personality profiles  | Root   | -                                   |
| AI_KNOWLEDGE      | Knowledge base for AI agents      | Root   | Documents, FAQs, Products, Policies |
| WHATSAPP_DEVICES  | WhatsApp device connections       | Root   | -                                   |
| CONTACTS          | Customer/contact database         | Root   | -                                   |
| MESSAGE_TEMPLATES | Message templates for broadcasts  | Root   | -                                   |
| BROADCASTS        | Campaign broadcasts               | Root   | -                                   |
| CHATS             | Chat conversations                | Root   | MESSAGES (subcollection)            |
| AUDIT_LOGS        | Activity audit trail              | Root   | -                                   |

---

## Collection Details

### 1. USERS Collection

**Document ID:** Firebase Auth UID

**Purpose:** Store user account information with role-based hierarchy.

**Fields:**

| Field          | Type      | Required | Notes                                             |
| -------------- | --------- | -------- | ------------------------------------------------- |
| id             | string    | Yes      | User Firebase UID                                 |
| email          | string    | Yes      | Unique email address                              |
| name           | string    | Yes      | User display name                                 |
| role           | enum      | Yes      | 'superadmin' \| 'admin' \| 'supervisor' \| 'user' |
| photoURL       | string    | No       | Profile picture URL                               |
| phoneNumber    | string    | No       | Contact phone                                     |
| adminId        | string    | No       | Supervisor's admin ID (for role hierarchy)        |
| supervisorId   | string    | No       | Assigned supervisor ID (for role hierarchy)       |
| isActive       | boolean   | Yes      | Account status                                    |
| isVerified     | boolean   | Yes      | Email verification status                         |
| lastLoginAt    | timestamp | No       | Last login timestamp                              |
| lastActivityAt | timestamp | No       | Last activity timestamp                           |
| metadata       | object    | No       | Custom fields (department, jobTitle, etc.)        |
| createdAt      | timestamp | Yes      | Document creation timestamp                       |
| updatedAt      | timestamp | Yes      | Last update timestamp                             |

**Role Hierarchy:**

```
SUPERADMIN (Level 1)
  ├── ADMIN (Level 2)
  │   └── SUPERVISOR (Level 3)
  │       └── USER (Level 4)
```

**Example Document:**

```json
{
  "id": "user-uid-123",
  "email": "supervisor@ferdapp.com",
  "name": "John Supervisor",
  "role": "supervisor",
  "photoURL": "https://...",
  "phoneNumber": "+62812345678",
  "adminId": "admin-uid-456",
  "supervisorId": null,
  "isActive": true,
  "isVerified": true,
  "lastLoginAt": "2024-01-15T10:30:00Z",
  "lastActivityAt": "2024-01-15T10:35:00Z",
  "metadata": {
    "department": "Sales",
    "jobTitle": "Team Lead",
    "customFields": {}
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### 2. AI_AGENTS Collection

**Document ID:** Auto-generated

**Purpose:** Store AI agent configurations used by supervisors/users.

**Fields:**

| Field             | Type      | Required | Notes                                                                             |
| ----------------- | --------- | -------- | --------------------------------------------------------------------------------- |
| id                | string    | Yes      | Auto-generated ID                                                                 |
| userId            | string    | Yes      | Creator user ID (supervisor or user)                                              |
| name              | string    | Yes      | Agent name                                                                        |
| description       | string    | No       | Agent description                                                                 |
| provider          | enum      | Yes      | 'openai' \| 'gemini'                                                              |
| model             | enum      | Yes      | 'gpt-4' \| 'gpt-4-turbo' \| 'gpt-3.5-turbo' \| 'gemini-pro' \| 'gemini-1.5-flash' |
| apiKeyEncrypted   | string    | Yes      | Encrypted API key (admin SDK only)                                                |
| temperature       | number    | No       | 0-2, affects randomness (default: 0.7)                                            |
| maxTokens         | number    | No       | Response length limit (default: 2000)                                             |
| systemPrompt      | string    | No       | Custom system prompt                                                              |
| autoReplyEnabled  | boolean   | Yes      | Enable auto-reply feature                                                         |
| autoReplyKeywords | string[]  | No       | Keywords that trigger auto-reply                                                  |
| isActive          | boolean   | Yes      | Agent status                                                                      |
| totalMessages     | number    | No       | Cumulative message count                                                          |
| totalCosts        | number    | No       | Usage costs                                                                       |
| behaviourId       | string    | No       | Reference to AI_BEHAVIOURS doc                                                    |
| knowledgeId       | string    | No       | Reference to AI_KNOWLEDGE doc                                                     |
| createdAt         | timestamp | Yes      | Creation timestamp                                                                |
| updatedAt         | timestamp | Yes      | Update timestamp                                                                  |
| lastUsedAt        | timestamp | No       | Last usage timestamp                                                              |

**Example Document:**

```json
{
  "id": "agent-001",
  "userId": "user-uid-123",
  "name": "Customer Support Bot",
  "description": "Handles customer support inquiries",
  "provider": "openai",
  "model": "gpt-4-turbo",
  "apiKeyEncrypted": "encrypted-key-xyz",
  "temperature": 0.7,
  "maxTokens": 2000,
  "systemPrompt": "You are a helpful customer support agent...",
  "autoReplyEnabled": true,
  "autoReplyKeywords": ["help", "support", "issue"],
  "isActive": true,
  "totalMessages": 1250,
  "totalCosts": 45.5,
  "behaviourId": "behaviour-001",
  "knowledgeId": "knowledge-001",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z",
  "lastUsedAt": "2024-01-15T10:30:00Z"
}
```

---

### 3. AI_BEHAVIOURS Collection

**Document ID:** Auto-generated

**Purpose:** Define AI agent personality and communication guidelines.

**Fields:**

| Field                   | Type      | Required | Notes                                                   |
| ----------------------- | --------- | -------- | ------------------------------------------------------- |
| id                      | string    | Yes      | Auto-generated ID                                       |
| userId                  | string    | Yes      | Creator user ID                                         |
| name                    | string    | Yes      | Behaviour profile name                                  |
| personality             | string    | Yes      | e.g., "profesional tapi ramah"                          |
| communicationStyle      | string    | Yes      | 'verbose' \| 'concise' \| 'balanced'                    |
| tone                    | string    | Yes      | 'friendly' \| 'professional' \| 'humorous' \| 'serious' |
| responseGuidelines      | string[]  | Yes      | Array of response rules                                 |
| limitations             | string[]  | Yes      | What agent should NOT do                                |
| customInstructions      | string    | Yes      | Detailed custom instructions                            |
| shouldAskClarification  | boolean   | Yes      | Ask for clarification when unclear                      |
| shouldProvideExamples   | boolean   | Yes      | Include examples in responses                           |
| shouldIncludeDisclaimer | boolean   | Yes      | Add disclaimers to responses                            |
| disclaimerText          | string    | No       | Custom disclaimer text                                  |
| handoffKeywords         | string[]  | No       | Keywords for human handoff                              |
| handoffPrompt           | string    | No       | Message when handing off to human                       |
| createdAt               | timestamp | Yes      | Creation timestamp                                      |
| updatedAt               | timestamp | Yes      | Update timestamp                                        |

**Example Document:**

```json
{
  "id": "behaviour-001",
  "userId": "user-uid-123",
  "name": "Customer Support Professional",
  "personality": "Professional tetapi tetap ramah dan approachable",
  "communicationStyle": "balanced",
  "tone": "professional",
  "responseGuidelines": [
    "Selalu gunakan bahasa Indonesia yang sopan",
    "Mulai dengan greeting yang friendly",
    "Akhiri dengan penawaran bantuan lebih lanjut",
    "Gunakan bullet points untuk clarity"
  ],
  "limitations": [
    "Jangan memberikan legal advice",
    "Jangan buat janji tanpa verifikasi",
    "Jangan akses data pribadi customer secara langsung"
  ],
  "customInstructions": "Anda adalah agent customer support untuk perusahaan...",
  "shouldAskClarification": true,
  "shouldProvideExamples": true,
  "shouldIncludeDisclaimer": true,
  "disclaimerText": "For complex issues, we recommend contacting our support team directly.",
  "handoffKeywords": ["complain", "urgent", "legal"],
  "handoffPrompt": "Let me connect you with our specialist...",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

---

### 4. AI_KNOWLEDGE Collection

**Document ID:** Auto-generated

**Purpose:** Store knowledge base for AI agents (documents, FAQs, products,
policies).

**Fields:**

| Field                     | Type      | Required | Notes                   |
| ------------------------- | --------- | -------- | ----------------------- |
| id                        | string    | Yes      | Auto-generated ID       |
| userId                    | string    | Yes      | Creator user ID         |
| name                      | string    | Yes      | Knowledge base name     |
| description               | string    | No       | KB description          |
| documents                 | object[]  | Yes      | Array of documents      |
| documents[].id            | string    | Yes      | Document ID             |
| documents[].title         | string    | Yes      | Document title          |
| documents[].content       | string    | Yes      | Document content/text   |
| documents[].uploadedAt    | timestamp | Yes      | Upload timestamp        |
| documents[].url           | string    | No       | Source URL              |
| faqs                      | object[]  | Yes      | Array of FAQ items      |
| faqs[].id                 | string    | Yes      | FAQ ID                  |
| faqs[].question           | string    | Yes      | Question                |
| faqs[].answer             | string    | Yes      | Answer                  |
| faqs[].category           | string    | No       | FAQ category            |
| productInfo               | object[]  | Yes      | Array of products       |
| productInfo[].id          | string    | Yes      | Product ID              |
| productInfo[].name        | string    | Yes      | Product name            |
| productInfo[].description | string    | Yes      | Product description     |
| productInfo[].price       | number    | No       | Product price           |
| productInfo[].features    | string[]  | No       | Feature list            |
| productInfo[].specs       | object    | No       | Product specifications  |
| policies                  | object[]  | Yes      | Array of policies       |
| policies[].id             | string    | Yes      | Policy ID               |
| policies[].title          | string    | Yes      | Policy title            |
| policies[].content        | string    | Yes      | Policy content          |
| policies[].category       | string    | No       | Policy category         |
| policies[].effectiveDate  | timestamp | No       | Effective date          |
| vectorEmbeddingsEnabled   | boolean   | Yes      | Use vector embeddings   |
| lastTrainedAt             | timestamp | No       | Last training timestamp |
| totalDocuments            | number    | Yes      | Document count          |
| totalFAQs                 | number    | Yes      | FAQ count               |
| totalProducts             | number    | Yes      | Product count           |
| totalPolicies             | number    | Yes      | Policy count            |
| isActive                  | boolean   | Yes      | KB status               |
| createdAt                 | timestamp | Yes      | Creation timestamp      |
| updatedAt                 | timestamp | Yes      | Update timestamp        |

**Example Document:**

```json
{
  "id": "knowledge-001",
  "userId": "user-uid-123",
  "name": "Customer Service Knowledge Base",
  "description": "Comprehensive KB for customer support",
  "documents": [
    {
      "id": "doc-001",
      "title": "Refund Policy",
      "content": "Customers can request refunds within 30 days...",
      "uploadedAt": "2024-01-01T00:00:00Z",
      "url": "https://..."
    }
  ],
  "faqs": [
    {
      "id": "faq-001",
      "question": "Bagaimana cara melakukan refund?",
      "answer": "Hubungi customer service...",
      "category": "Refunds"
    }
  ],
  "productInfo": [
    {
      "id": "prod-001",
      "name": "Product A",
      "description": "This is product A",
      "price": 99.99,
      "features": ["Feature 1", "Feature 2"],
      "specs": {}
    }
  ],
  "policies": [
    {
      "id": "pol-001",
      "title": "Privacy Policy",
      "content": "We respect your privacy...",
      "category": "Legal",
      "effectiveDate": "2024-01-01T00:00:00Z"
    }
  ],
  "vectorEmbeddingsEnabled": true,
  "lastTrainedAt": "2024-01-15T00:00:00Z",
  "totalDocuments": 15,
  "totalFAQs": 50,
  "totalProducts": 25,
  "totalPolicies": 10,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

---

### 5. WHATSAPP_DEVICES Collection

**Document ID:** Auto-generated

**Purpose:** Track WhatsApp device connections and sessions.

**Fields:**

| Field                   | Type      | Required | Notes                                                 |
| ----------------------- | --------- | -------- | ----------------------------------------------------- |
| id                      | string    | Yes      | Auto-generated ID                                     |
| userId                  | string    | Yes      | Device owner user ID                                  |
| phoneNumber             | string    | Yes      | WhatsApp phone number                                 |
| deviceName              | string    | No       | Device name/label                                     |
| connectionStatus        | enum      | Yes      | 'connected' \| 'disconnected' \| 'pending' \| 'error' |
| isLoggedIn              | boolean   | Yes      | Login status                                          |
| qrCode                  | string    | No       | QR code for pairing                                   |
| qrCodeExpiresAt         | timestamp | No       | QR code expiration                                    |
| sessionDataEncrypted    | string    | No       | Encrypted session data                                |
| messageQuota.dailyLimit | number    | No       | Daily message limit                                   |
| messageQuota.dailyUsed  | number    | No       | Messages used today                                   |
| messageQuota.resetAt    | timestamp | No       | Quota reset time                                      |
| totalMessagesSent       | number    | No       | Total sent messages count                             |
| totalMessagesReceived   | number    | No       | Total received messages count                         |
| connectedAt             | timestamp | No       | Connection timestamp                                  |
| lastSeenAt              | timestamp | No       | Last activity timestamp                               |
| createdAt               | timestamp | Yes      | Creation timestamp                                    |
| updatedAt               | timestamp | Yes      | Update timestamp                                      |

**Example Document:**

```json
{
  "id": "device-001",
  "userId": "user-uid-123",
  "phoneNumber": "+62812345678",
  "deviceName": "My Business Phone",
  "connectionStatus": "connected",
  "isLoggedIn": true,
  "qrCode": null,
  "qrCodeExpiresAt": null,
  "sessionDataEncrypted": "encrypted-session-data",
  "messageQuota": {
    "dailyLimit": 1000,
    "dailyUsed": 450,
    "resetAt": "2024-01-16T00:00:00Z"
  },
  "totalMessagesSent": 5250,
  "totalMessagesReceived": 3100,
  "connectedAt": "2024-01-01T00:00:00Z",
  "lastSeenAt": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### 6. CONTACTS Collection

**Document ID:** Auto-generated

**Purpose:** Store customer/contact information managed by supervisors.

**Fields:**

| Field          | Type      | Required | Notes                                    |
| -------------- | --------- | -------- | ---------------------------------------- |
| id             | string    | Yes      | Auto-generated ID                        |
| supervisorId   | string    | Yes      | Supervisor managing this contact         |
| assignedUserId | string    | No       | User assigned to handle this contact     |
| name           | string    | Yes      | Contact name                             |
| phone          | string    | Yes      | WhatsApp phone number (unique)           |
| email          | string    | No       | Email address                            |
| companyName    | string    | No       | Company name                             |
| jobTitle       | string    | No       | Job title                                |
| tags           | string[]  | No       | Tags (e.g., ["vip", "lead", "customer"]) |
| category       | string    | No       | Category (e.g., "customer", "prospect")  |
| totalMessages  | number    | No       | Message count                            |
| totalReplies   | number    | No       | Reply count                              |
| lastMessageAt  | timestamp | No       | Last message timestamp                   |
| responseRate   | number    | No       | Response rate percentage                 |
| customFields   | object    | No       | Custom field data                        |
| isBlocked      | boolean   | No       | Blocked status                           |
| isActive       | boolean   | Yes      | Contact status                           |
| createdAt      | timestamp | Yes      | Creation timestamp                       |
| updatedAt      | timestamp | Yes      | Update timestamp                         |

**Example Document:**

```json
{
  "id": "contact-001",
  "supervisorId": "user-uid-123",
  "assignedUserId": "user-uid-456",
  "name": "Budi Santoso",
  "phone": "+62812345678",
  "email": "budi@example.com",
  "companyName": "PT Example",
  "jobTitle": "Sales Manager",
  "tags": ["vip", "customer"],
  "category": "customer",
  "totalMessages": 45,
  "totalReplies": 40,
  "lastMessageAt": "2024-01-15T10:30:00Z",
  "responseRate": 88.9,
  "customFields": {
    "source": "referral",
    "region": "Jakarta"
  },
  "isBlocked": false,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

### 7. MESSAGE_TEMPLATES Collection

**Document ID:** Auto-generated

**Purpose:** Store message templates for broadcast campaigns.

**Fields:**

| Field        | Type      | Required | Notes                                           |
| ------------ | --------- | -------- | ----------------------------------------------- |
| id           | string    | Yes      | Auto-generated ID                               |
| supervisorId | string    | Yes      | Creator supervisor ID                           |
| name         | string    | Yes      | Template name                                   |
| description  | string    | No       | Template description                            |
| category     | string    | No       | Template category                               |
| content      | string    | Yes      | Message content                                 |
| variables    | string[]  | No       | Template variables (e.g., ["name", "order_id"]) |
| mediaUrl     | string    | No       | Media URL if attached                           |
| mediaType    | enum      | No       | 'image' \| 'document' \| 'video'                |
| usageCount   | number    | No       | Times used count                                |
| isActive     | boolean   | Yes      | Template status                                 |
| tags         | string[]  | No       | Template tags                                   |
| createdAt    | timestamp | Yes      | Creation timestamp                              |
| updatedAt    | timestamp | Yes      | Update timestamp                                |

**Example Document:**

```json
{
  "id": "template-001",
  "supervisorId": "user-uid-123",
  "name": "Order Confirmation",
  "description": "Sent when order is confirmed",
  "category": "orders",
  "content": "Terima kasih {{name}}, pesanan Anda {{order_id}} telah dikonfirmasi...",
  "variables": ["name", "order_id"],
  "mediaUrl": null,
  "mediaType": null,
  "usageCount": 150,
  "isActive": true,
  "tags": ["order", "confirmation"],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

---

### 8. BROADCASTS Collection

**Document ID:** Auto-generated

**Purpose:** Store broadcast campaign information and status.

**Fields:**

| Field                    | Type      | Required | Notes                                                                      |
| ------------------------ | --------- | -------- | -------------------------------------------------------------------------- |
| id                       | string    | Yes      | Auto-generated ID                                                          |
| supervisorId             | string    | Yes      | Creator supervisor ID                                                      |
| title                    | string    | Yes      | Broadcast title                                                            |
| description              | string    | No       | Broadcast description                                                      |
| templateId               | string    | No       | Reference to MESSAGE_TEMPLATES                                             |
| messageContent.text      | string    | Yes      | Message text                                                               |
| messageContent.mediaUrl  | string    | No       | Media URL                                                                  |
| messageContent.mediaType | enum      | No       | 'image' \| 'document' \| 'video'                                           |
| assignedUserIds          | string[]  | Yes      | Users sending this broadcast                                               |
| recipientContactIds      | string[]  | No       | Specific contacts (if empty, all)                                          |
| status                   | enum      | Yes      | 'draft' \| 'scheduled' \| 'sending' \| 'completed' \| 'failed' \| 'paused' |
| scheduledAt              | timestamp | No       | Schedule time                                                              |
| startedAt                | timestamp | No       | Start time                                                                 |
| completedAt              | timestamp | No       | Completion time                                                            |
| statistics.total         | number    | Yes      | Total recipients                                                           |
| statistics.sent          | number    | Yes      | Sent count                                                                 |
| statistics.delivered     | number    | Yes      | Delivered count                                                            |
| statistics.failed        | number    | Yes      | Failed count                                                               |
| statistics.read          | number    | No       | Read count                                                                 |
| statistics.replied       | number    | No       | Reply count                                                                |
| failedRecipients         | object[]  | No       | Failed recipient details                                                   |
| retryFailed              | boolean   | Yes      | Retry failed sends                                                         |
| maxRetries               | number    | No       | Max retry attempts                                                         |
| createdAt                | timestamp | Yes      | Creation timestamp                                                         |
| updatedAt                | timestamp | Yes      | Update timestamp                                                           |

**Example Document:**

```json
{
  "id": "broadcast-001",
  "supervisorId": "user-uid-123",
  "title": "New Product Launch",
  "description": "Announcing our new product line",
  "templateId": null,
  "messageContent": {
    "text": "Kami dengan senang hati mengumumkan produk baru kami...",
    "mediaUrl": "https://...",
    "mediaType": "image"
  },
  "assignedUserIds": ["user-uid-456", "user-uid-789"],
  "recipientContactIds": ["contact-001", "contact-002"],
  "status": "completed",
  "scheduledAt": "2024-01-15T08:00:00Z",
  "startedAt": "2024-01-15T08:00:00Z",
  "completedAt": "2024-01-15T09:30:00Z",
  "statistics": {
    "total": 100,
    "sent": 98,
    "delivered": 95,
    "failed": 2,
    "read": 78,
    "replied": 25
  },
  "failedRecipients": [
    {
      "contactId": "contact-999",
      "phone": "+62899999999",
      "reason": "Invalid phone number"
    }
  ],
  "retryFailed": true,
  "maxRetries": 3,
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-01-15T09:30:00Z"
}
```

---

### 9. CHATS Collection

**Document ID:** Auto-generated

**Purpose:** Store chat conversations between contacts and users.

**Fields:**

| Field                | Type      | Required | Notes                                |
| -------------------- | --------- | -------- | ------------------------------------ |
| id                   | string    | Yes      | Auto-generated ID                    |
| contactId            | string    | Yes      | Reference to CONTACTS doc            |
| userId               | string    | Yes      | User handling this chat              |
| supervisorId         | string    | Yes      | Supervisor of the user               |
| deviceId             | string    | Yes      | WhatsApp device ID                   |
| status               | enum      | Yes      | 'active' \| 'archived' \| 'closed'   |
| isUnread             | boolean   | Yes      | Unread status                        |
| unreadCount          | number    | Yes      | Unread message count                 |
| lastMessage          | string    | No       | Last message text                    |
| lastMessageAt        | timestamp | No       | Last message timestamp               |
| lastMessageFrom      | enum      | No       | 'contact' \| 'user' \| 'ai'          |
| aiAgentId            | string    | No       | Reference to AI_AGENTS if AI handled |
| isAIHandled          | boolean   | Yes      | Currently AI handled                 |
| aiHandledSince       | timestamp | No       | When AI took over                    |
| humanHandoffNeeded   | boolean   | No       | Needs human intervention             |
| humanHandoffReason   | string    | No       | Reason for handoff                   |
| totalMessages        | number    | Yes      | Total message count                  |
| totalUserMessages    | number    | Yes      | User message count                   |
| totalContactMessages | number    | Yes      | Contact message count                |
| totalAIMessages      | number    | No       | AI message count                     |
| tags                 | string[]  | No       | Chat tags                            |
| notes                | string    | No       | Chat notes                           |
| previouslyAssignedTo | string[]  | No       | Assignment history                   |
| createdAt            | timestamp | Yes      | Creation timestamp                   |
| updatedAt            | timestamp | Yes      | Update timestamp                     |

**Subcollection: MESSAGES**

| Field             | Type      | Required | Notes                                                 |
| ----------------- | --------- | -------- | ----------------------------------------------------- |
| id                | string    | Yes      | Auto-generated ID                                     |
| chatId            | string    | Yes      | Parent chat ID                                        |
| senderId          | string    | Yes      | Sender user/contact/ai ID                             |
| senderType        | enum      | Yes      | 'contact' \| 'user' \| 'ai'                           |
| senderName        | string    | No       | Sender display name                                   |
| type              | enum      | Yes      | 'text' \| 'image' \| 'document' \| 'video' \| 'audio' |
| content           | string    | Yes      | Message content                                       |
| mediaUrl          | string    | No       | Media URL                                             |
| mediaType         | string    | No       | Media MIME type                                       |
| status            | enum      | Yes      | 'sent' \| 'delivered' \| 'read' \| 'failed'           |
| aiAgentId         | string    | No       | AI agent if from AI                                   |
| aiConfidence      | number    | No       | AI confidence 0-100                                   |
| whatsappMessageId | string    | No       | WhatsApp message ID                                   |
| createdAt         | timestamp | Yes      | Creation timestamp                                    |
| updatedAt         | timestamp | No       | Update timestamp                                      |

**Example CHATS Document:**

```json
{
  "id": "chat-001",
  "contactId": "contact-001",
  "userId": "user-uid-456",
  "supervisorId": "user-uid-123",
  "deviceId": "device-001",
  "status": "active",
  "isUnread": false,
  "unreadCount": 0,
  "lastMessage": "Baik, terima kasih infonya",
  "lastMessageAt": "2024-01-15T10:30:00Z",
  "lastMessageFrom": "contact",
  "aiAgentId": "agent-001",
  "isAIHandled": false,
  "aiHandledSince": null,
  "humanHandoffNeeded": false,
  "humanHandoffReason": null,
  "totalMessages": 25,
  "totalUserMessages": 10,
  "totalContactMessages": 15,
  "totalAIMessages": 5,
  "tags": ["sales", "pending"],
  "notes": "Customer interested in product A",
  "previouslyAssignedTo": [],
  "createdAt": "2024-01-15T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Example MESSAGES Document:**

```json
{
  "id": "msg-001",
  "chatId": "chat-001",
  "senderId": "contact-001",
  "senderType": "contact",
  "senderName": "Budi Santoso",
  "type": "text",
  "content": "Halo, apa kabar?",
  "mediaUrl": null,
  "mediaType": null,
  "status": "read",
  "aiAgentId": null,
  "aiConfidence": null,
  "whatsappMessageId": "wamid.xxx",
  "createdAt": "2024-01-15T10:25:00Z",
  "updatedAt": null
}
```

---

### 10. AUDIT_LOGS Collection

**Document ID:** Auto-generated

**Purpose:** Track all system activities for compliance and debugging.

**Fields:**

| Field        | Type      | Required | Notes                            |
| ------------ | --------- | -------- | -------------------------------- |
| id           | string    | Yes      | Auto-generated ID                |
| userId       | string    | Yes      | User performing action           |
| action       | string    | Yes      | Action performed                 |
| resource     | string    | Yes      | Resource affected                |
| resourceId   | string    | No       | Specific resource ID             |
| changes      | object    | No       | Before/after changes             |
| status       | enum      | Yes      | 'success' \| 'failed' \| 'error' |
| errorMessage | string    | No       | Error details                    |
| ipAddress    | string    | No       | Request IP                       |
| userAgent    | string    | No       | User agent string                |
| createdAt    | timestamp | Yes      | Creation timestamp               |

---

## Relationships

### Hierarchy Relationships

```
USERS (Superadmin/Admin/Supervisor/User)
├── adminId → USERS (for supervisors)
└── supervisorId → USERS (for regular users)
```

### Data Relationships

```
AI_AGENTS
├── userId → USERS
├── behaviourId → AI_BEHAVIOURS
└── knowledgeId → AI_KNOWLEDGE

AI_BEHAVIOURS
└── userId → USERS

AI_KNOWLEDGE
└── userId → USERS

WHATSAPP_DEVICES
└── userId → USERS

CONTACTS
├── supervisorId → USERS
└── assignedUserId → USERS

MESSAGE_TEMPLATES
└── supervisorId → USERS

BROADCASTS
├── supervisorId → USERS
├── templateId → MESSAGE_TEMPLATES
└── assignedUserIds[] → USERS[]

CHATS
├── contactId → CONTACTS
├── userId → USERS
├── supervisorId → USERS
├── deviceId → WHATSAPP_DEVICES
└── aiAgentId → AI_AGENTS

CHATS/MESSAGES (subcollection)
├── chatId → CHATS (parent)
├── senderId → USERS | CONTACTS
└── aiAgentId → AI_AGENTS
```

---

## Indexes

### Recommended Composite Indexes

```
USERS:
- (supervisorId, Ascending) + (createdAt, Descending)
- (adminId, Ascending) + (role, Ascending)
- (isActive, Ascending) + (createdAt, Descending)

CONTACTS:
- (supervisorId, Ascending) + (isActive, Ascending)
- (supervisorId, Ascending) + (createdAt, Descending)
- (assignedUserId, Ascending) + (isActive, Ascending)

BROADCASTS:
- (supervisorId, Ascending) + (status, Ascending)
- (supervisorId, Ascending) + (createdAt, Descending)
- (status, Ascending) + (scheduledAt, Ascending)

CHATS:
- (supervisorId, Ascending) + (status, Ascending)
- (supervisorId, Ascending) + (updatedAt, Descending)
- (userId, Ascending) + (status, Ascending)
- (contactId, Ascending) + (createdAt, Descending)

AI_AGENTS:
- (userId, Ascending) + (isActive, Ascending)
- (userId, Ascending) + (createdAt, Descending)
```

---

## Security Rules Summary

### Access Levels by Role

| Operation        | Superadmin | Admin   | Supervisor | User         |
| ---------------- | ---------- | ------- | ---------- | ------------ |
| Read All Users   | ✓          | ✓ (org) | ✓ (team)   | ✗            |
| Create User      | ✓          | ✓       | ✗          | ✗            |
| Manage Templates | ✓          | ✓       | ✓          | ✗            |
| Create Broadcast | ✓          | ✓       | ✓          | ✗            |
| Handle Chat      | ✓          | ✓       | ✓          | ✓            |
| Access AI Agent  | ✓          | ✓       | ✓ (own)    | ✓ (own)      |
| Manage Contact   | ✓          | ✓       | ✓          | ✓ (assigned) |

---

## Data Migrations

### Initial Setup Script

```typescript
// scripts/init-firestore.ts
import admin from 'firebase-admin'

async function initializeFirestore() {
  const db = admin.firestore()

  // Create collections
  const collections = [
    'USERS',
    'AI_AGENTS',
    'AI_BEHAVIOURS',
    'AI_KNOWLEDGE',
    'WHATSAPP_DEVICES',
    'CONTACTS',
    'MESSAGE_TEMPLATES',
    'BROADCASTS',
    'CHATS',
    'AUDIT_LOGS',
  ]

  for (const collection of collections) {
    const doc = await db.collection(collection).doc('__init__').set({
      initialized: true,
      timestamp: new Date(),
    })
    console.log(`✓ Initialized ${collection}`)
  }
}

initializeFirestore()
```

---

## Performance Considerations

1. **Pagination**: Always use pagination for list queries (limit to 20-100 docs)
2. **Indexing**: Composite indexes required for multi-field queries
3. **Subcollections**: MESSAGES stored as subcollection under CHATS for better
   scaling
4. **Denormalization**: Some data is denormalized (e.g., statistics) for query
   performance
5. **Real-time Listeners**: Use `limit()` and `where()` clauses to reduce
   listener overhead

---

## Backup & Recovery

- Enable automatic backups in Firebase Console
- Test restore process quarterly
- Keep audit logs for compliance (90-day minimum retention)
