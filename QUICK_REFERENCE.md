# FerdApp - Quick Reference

## Project Created ✅

**Date**: October 31, 2024  
**Stack**: Next.js 16 + Firebase + TypeScript + Tailwind CSS  
**Location**: `/d/Github/ferdapp`

---

## 📦 What's Included

### Core Setup

- ✅ Next.js 16 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS styling
- ✅ ESLint configuration
- ✅ Firebase Admin SDK & Client SDK

### Project Structure

```
src/
├── app/          → Pages & API routes
├── components/   → React components
├── config/       → Firebase configs
├── constants/    → Enums & constants
├── contexts/     → Auth context
├── db/           → Firestore operations
├── features/     → Feature components
├── middleware.ts → Auth middleware
├── types/        → TypeScript types
└── utils/        → Helper functions
```

### Key Files

| File                           | Purpose                        |
| ------------------------------ | ------------------------------ |
| `src/types/index.ts`           | All TypeScript interfaces      |
| `src/constants/index.ts`       | Collections, RBAC, error codes |
| `src/db/operations.ts`         | Database CRUD utilities        |
| `src/db/SCHEMA.md`             | Database schema documentation  |
| `src/contexts/AuthContext.tsx` | Auth state & hooks             |
| `src/utils/rbac.ts`            | RBAC permission utilities      |
| `src/middleware.ts`            | Auth middleware                |
| `README.md`                    | Main documentation             |
| `SETUP_GUIDE.md`               | This setup guide               |
| `.env.example`                 | Environment variables template |

---

## 🚀 Quick Start

### 1. Setup Firebase

```
Go to: https://console.firebase.google.com
- Create project
- Enable Firestore & Auth
- Copy credentials to .env.local
```

### 2. Install & Run

```bash
npm install
npm run dev
# Visit: http://localhost:3000
```

### 3. Create First User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "displayName": "John Doe",
    "role": "superadmin"
  }'
```

---

## 📚 Common Tasks

### Import Types

```typescript
import { User, UserRole, Organization, Broadcast } from '@/types'
```

### Import Database Operations

```typescript
import {
  createDocument,
  getDocument,
  queryDocuments,
  updateDocument,
  deleteDocument,
} from '@/db/operations'
import { COLLECTIONS } from '@/constants'
```

### Check Authentication

```typescript
'use client'
import { useAuth, useRole } from '@/contexts/AuthContext'

const { currentUser, isAuthenticated } = useAuth()
const hasRole = useRole()
```

### Check Permissions

```typescript
import { hasPermission, canManageUser } from '@/utils/rbac'

if (hasPermission(user.role, 'templates', 'create')) {
  // Can create templates
}
```

### Create Protected Page

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { UserRole } from '@/types'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={UserRole.ADMIN}>
      <Dashboard />
    </ProtectedRoute>
  )
}
```

---

## 🔐 RBAC Hierarchy

```
Superadmin (Level 1)
  ├── Manage: admins, organizations
  └── Permissions: create, read, update, delete, manage

Admin (Level 2)
  ├── Manage: supervisors, users, organization settings
  └── Permissions: create, read, update, delete

Supervisor (Level 3)
  ├── Manage: users, templates, broadcasts, contacts, ai_agents
  └── Permissions: create, read, update, delete

User (Level 4)
  ├── Manage: own profile, own WhatsApp account
  └── Permissions: read, update

AI Agent (Level 5)
  ├── Manage: (none)
  └── Permissions: read
```

---

## 📊 Firestore Collections

15 collections ready:

1. `users` - User accounts
2. `roles` - Role definitions
3. `permissions` - Permission definitions
4. `organizations` - Organizations
5. `role_assignments` - User role mappings
6. `whatsapp_accounts` - WhatsApp integrations
7. `whatsapp_messages` - Message history
8. `ai_agents` - AI agent configs
9. `ai_conversations` - Conversation history
10. `response_rules` - Auto-reply rules
11. `message_templates` - Message templates
12. `broadcasts` - Campaign broadcasts
13. `contacts` - WhatsApp contacts
14. `audit_logs` - Audit trail
15. `webhook_logs` - Webhook events

See `/src/db/SCHEMA.md` for full schema.

---

## 🛠️ Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript
```

---

## 🔧 Environment Variables

### Required

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_ADMIN_SDK_KEY=...
```

### Optional

```env
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_API_TOKEN=...
OPENAI_API_KEY=...
GEMINI_API_KEY=...
```

---

## 📱 API Routes Structure

### Auth

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
```

### Users

```
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```

### Roles

```
GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id
```

### Templates

```
GET    /api/templates
POST   /api/templates
PUT    /api/templates/:id
DELETE /api/templates/:id
```

### Broadcasts

```
GET    /api/broadcasts
POST   /api/broadcasts
PUT    /api/broadcasts/:id
POST   /api/broadcasts/:id/send
```

### AI Agents

```
GET    /api/agents
POST   /api/agents
PUT    /api/agents/:id
DELETE /api/agents/:id
```

### WhatsApp

```
GET    /api/whatsapp/accounts
POST   /api/whatsapp/send
POST   /api/whatsapp/webhook
```

---

## ⚡ Performance Tips

1. Use React hooks for state management
2. Implement pagination with `queryDocuments`
3. Use Firestore indexes for complex queries
4. Batch operations with `batchWrite`
5. Lazy load components with `React.lazy`
6. Cache static data

---

## 🔒 Security Reminders

- ✅ Never commit `.env.local`
- ✅ Validate all user inputs
- ✅ Check permissions on server-side
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Encrypt sensitive data
- ✅ Add audit logging

---

## 📞 Need Help?

1. Check `/src/db/SCHEMA.md` for database schema
2. See `README.md` for detailed documentation
3. Review `SETUP_GUIDE.md` for setup steps
4. Check `/src/types/index.ts` for type definitions
5. See `/src/utils/rbac.ts` for RBAC examples

---

## 🎯 Next Development Steps

1. ✅ Setup Firebase credentials
2. ✅ Create auth pages (login, register)
3. ✅ Create dashboards (by role)
4. ✅ Implement API routes
5. ✅ Create UI components
6. ✅ Integrate WhatsApp
7. ✅ Setup AI agents

---

**Ready to build!** 🚀  
Run `npm run dev` to start developing.
