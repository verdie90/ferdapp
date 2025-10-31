# FerdApp - WhatsApp + AI Agent Management Platform

Aplikasi Next.js + Firebase untuk mengelola WhatsApp Cloud API, WhatsApp
Business API, AI Agents, dan Broadcast dengan sistem RBAC hierarki (Superadmin →
Admin → Supervisor → User).

## 🎯 Fitur Utama

### Hierarki & RBAC

- **Superadmin**: Mengelola semua organisasi dan admin
- **Admin**: Mengelola supervisor dan pengaturan organisasi
- **Supervisor**: Membuat user, template, broadcast, dan AI agents
- **User**: Mengirim pesan dan mengelola akun WhatsApp pribadi
- **AI Agent**: Auto-reply dan handling chat dengan personality custom

### Integrasi WhatsApp

- ✅ WhatsApp Cloud API (Meta)
- ✅ WhatsApp Business API (Self-hosted)
- ✅ Webhook untuk incoming messages
- ✅ Message history dan tracking
- ✅ Template management

### AI Agents

- ✅ Integrasi OpenAI (GPT-4, GPT-3.5)
- ✅ Integrasi Google Gemini
- ✅ Custom personality dan knowledge base
- ✅ Auto-reply rules
- ✅ Conversation history

### Campaign & Broadcasting

- ✅ Message templates
- ✅ Broadcast scheduling
- ✅ Contact management
- ✅ Delivery tracking
- ✅ Analytics

## 📋 Prerequisites

- Node.js 18+ dan npm/yarn
- Firebase project (https://firebase.google.com)
- WhatsApp Business Account (untuk Cloud API)
- OpenAI atau Gemini API key (opsional)

## 🚀 Setup & Installation

### 1. Clone dan Setup Project

```bash
git clone <repository-url>
cd ferdapp
npm install
```

### 2. Firebase Setup

#### 2.1 Buat Firebase Project

1. Buka https://console.firebase.google.com
2. Create new project
3. Enable Firestore Database dan Authentication

#### 2.2 Dapatkan Credentials

**Client Config:**

1. Go to Project Settings → General
2. Copy semua field di bawah "Your web app's Firebase config"

**Admin SDK Key:**

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy seluruh JSON

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan credentials:

```env
# Firebase (dari Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Admin SDK (dari Service Account)
FIREBASE_ADMIN_SDK_KEY='{"type":"service_account",...}'

# WhatsApp Cloud API
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_API_TOKEN=your_api_token
WHATSAPP_WEBHOOK_TOKEN=verify_token_any_string

# AI Providers
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=your_gemini_key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_AUTH_SECRET=$(openssl rand -base64 32)
```

### 4. Setup Firestore Collections

Database schema sudah didokumentasikan di `/src/db/SCHEMA.md`

**Collections yang perlu dibuat:**

- `users` - User accounts
- `roles` - Role definitions
- `permissions` - Permission definitions
- `organizations` - Organisasi
- `whatsapp_accounts` - Integrasi WhatsApp
- `message_templates` - Message templates
- `broadcasts` - Campaign broadcasts
- `ai_agents` - AI agent configs
- `contacts` - WhatsApp contacts

Lihat `/src/db/SCHEMA.md` untuk detail structure setiap collection.

### 5. Jalankan Development Server

```bash
npm run dev
# atau
yarn dev
```

Buka http://localhost:3000

## 📁 Folder Structure

```
src/
├── app/              # Next.js App Router
│   ├── api/         # API routes
│   ├── auth/        # Auth pages
│   ├── admin/       # Admin dashboard
│   ├── supervisor/  # Supervisor dashboard
│   └── user/        # User dashboard
├── components/      # Reusable React components
├── config/          # Firebase & API configs
├── constants/       # Constants & enums
├── contexts/        # React contexts (Auth)
├── db/              # Database utilities
├── features/        # Feature-specific components
│   ├── admin/
│   ├── supervisor/
│   ├── user/
│   └── superadmin/
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
├── middleware.ts    # Next.js middleware
├── services/        # External API services
├── types/           # TypeScript types
└── utils/           # Helper functions
```

## 🔑 Key Concepts

### Authentication & Authorization

#### Auth Flow

1. User login dengan email/password
2. Firebase Auth handle authentication
3. User data fetch dari Firestore `users` collection
4. Role & permissions check

#### Protected Routes

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { UserRole } from '@/types'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.SUPERADMIN]}>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
```

#### Use Auth Hook

```tsx
'use client'

import { useAuth, useRole } from '@/contexts/AuthContext'
import { UserRole } from '@/types'

export function Header() {
  const { currentUser, isAuthenticated } = useAuth()
  const hasRole = useRole()

  if (!isAuthenticated) return <div>Not authenticated</div>

  const isAdmin = hasRole([UserRole.ADMIN, UserRole.SUPERADMIN])

  return (
    <header>
      <h1>Welcome {currentUser?.displayName}</h1>
      {isAdmin && <button>Admin Panel</button>}
    </header>
  )
}
```

### RBAC Utilities

```typescript
import { hasPermission, canManageUser } from '@/utils/rbac'
import { UserRole } from '@/types'

// Check permission
if (hasPermission(user.role, 'templates', 'create')) {
  // User can create templates
}

// Check if user can manage another user
if (canManageUser(currentUser, targetUser)) {
  // Can manage target user
}
```

### Database Operations

```typescript
import {
  createDocument,
  getDocument,
  updateDocument,
  queryDocuments,
} from '@/db/operations'
import { User, UserRole } from '@/types'
import { COLLECTIONS } from '@/constants'

// Create
await createDocument<User>(COLLECTIONS.USERS, uid, {
  email: 'user@example.com',
  role: UserRole.USER,
  // ...
})

// Read
const user = await getDocument<User>(COLLECTIONS.USERS, uid)

// Update
await updateDocument<User>(COLLECTIONS.USERS, uid, {
  displayName: 'New Name',
})

// Query
const result = await queryDocuments<User>(
  COLLECTIONS.USERS,
  [
    { field: 'organizationId', operator: '==', value: orgId },
    { field: 'isActive', operator: '==', value: true },
  ],
  'createdAt',
  'desc',
  1,
  20
)
```

## 🔗 API Routes

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout

### Users

- `GET /api/users` - List users (paginated)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user (admin/supervisor only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Roles

- `GET /api/roles` - List roles
- `POST /api/roles` - Create custom role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### WhatsApp

- `POST /api/whatsapp/accounts` - Connect WhatsApp account
- `GET /api/whatsapp/accounts` - List accounts
- `POST /api/whatsapp/send` - Send message
- `POST /api/whatsapp/webhook` - Receive webhook

### Templates

- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Broadcasts

- `GET /api/broadcasts` - List broadcasts
- `POST /api/broadcasts` - Create broadcast
- `PUT /api/broadcasts/:id` - Update broadcast
- `POST /api/broadcasts/:id/send` - Send broadcast
- `GET /api/broadcasts/:id/analytics` - Get analytics

### AI Agents

- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

## 🔌 WhatsApp Integration

### Setup WhatsApp Cloud API

1. Dapatkan WhatsApp Business Account ID
2. Buat phone number dan app
3. Generate access token
4. Setup webhook verification

### Incoming Message Webhook

Webhook endpoint: `POST /api/whatsapp/webhook`

## 🤖 AI Agent Setup

### OpenAI Integration

```typescript
import axios from 'axios'

const response = await axios.post(
  'https://api.openai.com/v1/chat/completions',
  {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: agent.config.systemPrompt },
      { role: 'user', content: userMessage },
    ],
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  }
)
```

## 🧪 Development

### Lint & Type Check

```bash
npm run lint
npm run type-check
```

### Build

```bash
npm run build
```

## 📊 Database Firestore Indexes

Buat indexes di Firestore Console untuk optimize queries (lihat
`/src/db/SCHEMA.md` untuk list lengkap).

## 🔒 Security Best Practices

1. Never commit `.env.local` - sudah di `.gitignore`
2. Implement Firestore Rules untuk role-based access
3. Verify Firebase token di setiap API endpoint
4. Encrypt sensitive data di database
5. Use HTTPS untuk production

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel deploy --prod
```

Add environment variables di Vercel Dashboard.

### Firebase Hosting

```bash
npm run build
firebase deploy
```

## 📖 Documentation

- Database Schema: `/src/db/SCHEMA.md`
- Type Definitions: `/src/types/index.ts`
- RBAC Utilities: `/src/utils/rbac.ts`
- Database Operations: `/src/db/operations.ts`

## 🆘 Troubleshooting

### Firebase Connection Issues

- Check `.env.local` configuration
- Verify Firebase project is active
- Check Firestore is enabled

### WhatsApp Webhook Not Receiving

- Verify webhook URL is publicly accessible
- Check webhook token configuration
- Verify phone number is correct

### AI Agent Errors

- Check API keys are valid
- Verify rate limits are not exceeded
- Check system prompt configuration

## 📄 License

MIT - Gratis untuk personal & commercial use

---

**Created**: 2024 | **Updated**: October 31, 2024
