# FerdApp - Setup Guide & Project Overview

## ✅ Project Setup Complete!

Workspace FerdApp telah berhasil dibuat dengan struktur lengkap untuk aplikasi
WhatsApp + AI Agent Management dengan sistem RBAC hierarki.

---

## 📊 Project Structure Overview

### Core Architecture

```
ferdapp/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API Routes
│   │   │   ├── auth/register/    # User registration
│   │   │   ├── users/           # User management
│   │   │   ├── roles/           # Role management
│   │   │   ├── whatsapp/        # WhatsApp integration
│   │   │   ├── agents/          # AI agents
│   │   │   ├── templates/       # Message templates
│   │   │   └── broadcasts/      # Campaign broadcasts
│   │   ├── auth/             # Auth pages (login, register, forgot-password)
│   │   ├── admin/            # Admin dashboard (Superadmin & Admin)
│   │   ├── supervisor/       # Supervisor dashboard
│   │   ├── user/             # User dashboard
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   │
│   ├── components/           # Reusable React components
│   │   └── ProtectedRoute.tsx    # Protected route wrapper
│   │
│   ├── config/               # Configuration files
│   │   ├── firebase.ts       # Firebase client config
│   │   └── firebase-admin.ts # Firebase admin SDK config
│   │
│   ├── constants/            # Constants & Enums
│   │   └── index.ts          # Collections, RBAC hierarchy, error codes
│   │
│   ├── contexts/             # React Contexts
│   │   └── AuthContext.tsx   # Auth state & hooks (useAuth, useRole)
│   │
│   ├── db/                   # Database Utilities
│   │   ├── operations.ts     # CRUD operations (Firestore)
│   │   └── SCHEMA.md         # Database schema documentation
│   │
│   ├── features/             # Feature-specific components
│   │   ├── admin/            # Admin features
│   │   ├── superadmin/       # Superadmin features
│   │   ├── supervisor/       # Supervisor features
│   │   └── user/             # User features
│   │
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── middleware.ts         # Next.js middleware (auth check)
│   ├── services/             # External API services (OpenAI, Gemini, WhatsApp)
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts          # All interfaces & enums
│   ├── utils/                # Helper functions
│   │   └── rbac.ts           # RBAC utility functions
│   │
│   └── ...
│
├── public/                   # Static assets
├── .env.example              # Environment variables template
├── .env.local                # Environment variables (DO NOT COMMIT)
├── README.md                 # Project documentation
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── next.config.ts            # Next.js config
└── eslint.config.mjs         # ESLint config
```

---

## 🔑 Key Features Implemented

### ✅ Completed

- [x] Next.js 16 with TypeScript & Tailwind CSS
- [x] Firebase Auth & Firestore setup
- [x] Database schema with 15 collections
- [x] RBAC hierarchy (Superadmin → Admin → Supervisor → User → AI Agent)
- [x] Auth context & protected routes
- [x] RBAC utilities & permission checking
- [x] Database operations (CRUD, query, batch)
- [x] API route structure
- [x] Environment variables setup
- [x] Comprehensive documentation

### 🎯 Next Steps to Implement

1. **Dashboard Pages**

   - `/app/admin/page.tsx` - Admin dashboard
   - `/app/supervisor/page.tsx` - Supervisor dashboard
   - `/app/user/page.tsx` - User dashboard
   - `/app/superadmin/page.tsx` - Superadmin dashboard

2. **Auth Pages**

   - `/app/auth/login/page.tsx` - Login
   - `/app/auth/register/page.tsx` - Register
   - `/app/auth/forgot-password/page.tsx` - Forgot password

3. **API Endpoints** (Create route handlers)

   - `POST /api/users` - Create user
   - `GET /api/users` - List users
   - `GET /api/users/:id` - Get user
   - `PUT /api/users/:id` - Update user
   - `DELETE /api/users/:id` - Delete user
   - Similar for roles, templates, broadcasts, agents, etc.

4. **WhatsApp Integration**

   - Setup webhook endpoint
   - Message history tracking
   - Template management
   - Broadcast scheduling

5. **AI Agent Features**

   - OpenAI integration
   - Gemini integration
   - Conversation history
   - Auto-reply rules

6. **UI Components**
   - Navigation/Sidebar
   - Data tables
   - Forms
   - Modals

---

## 🚀 Getting Started

### 1. Setup Firebase

```bash
# Create Firebase project
# 1. Go to https://console.firebase.google.com
# 2. Create new project
# 3. Enable Firestore and Authentication
# 4. Get credentials (see below)
```

### 2. Configure Environment Variables

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your Firebase credentials:
# - Get from Firebase Console > Project Settings
# - Admin SDK from Firebase Console > Service Accounts
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## 📁 File Guide

### Types & Constants

- **`/src/types/index.ts`** - All TypeScript interfaces

  - User, Role, Organization, WhatsAppAccount, AIAgent, Broadcast, etc.
  - Complete with all properties and relationships

- **`/src/constants/index.ts`** - Constants & enums
  - Collection names
  - RBAC hierarchy definitions
  - Error codes
  - Pagination defaults

### Database

- **`/src/db/operations.ts`** - Database utilities

  - `createDocument(collection, id, data)` - Create
  - `getDocument(collection, id)` - Read
  - `updateDocument(collection, id, data)` - Update
  - `deleteDocument(collection, id)` - Delete
  - `queryDocuments(collection, filters, orderBy, page, limit)` - Query
  - `batchWrite(operations)` - Batch operations

- **`/src/db/SCHEMA.md`** - Database documentation
  - All 15 collections structure
  - Field definitions
  - Indexes needed
  - Firestore security rules template

### Authentication

- **`/src/contexts/AuthContext.tsx`** - Auth provider & hooks

  - `useAuth()` - Get current user & auth state
  - `useRole()` - Check user roles

- **`/src/utils/rbac.ts`** - RBAC utilities

  - `hasPermission(role, resource, action)` - Check permission
  - `canManageUser(currentUser, targetUser)` - Hierarchy check
  - `getAvailableActions(role, resource)` - Get allowed actions
  - `isValidRoleAssignment(creatorRole, newUserRole)` - Validate role assignment

- **`/src/components/ProtectedRoute.tsx`** - Route protection

  - Wraps components to check auth & roles

- **`/src/middleware.ts`** - Auth middleware
  - Redirects unauthenticated users to login

### Configuration

- **`/src/config/firebase.ts`** - Firebase client SDK
- **`/src/config/firebase-admin.ts`** - Firebase admin SDK (for server-side)

---

## 📚 Usage Examples

### Check Authentication

```tsx
'use client'
import { useAuth, useRole } from '@/contexts/AuthContext'
import { UserRole } from '@/types'

export function Dashboard() {
  const { currentUser, isAuthenticated, loading } = useAuth()
  const hasRole = useRole()

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please login</div>

  const isAdmin = hasRole([UserRole.ADMIN, UserRole.SUPERADMIN])

  return (
    <div>
      <h1>Welcome {currentUser?.displayName}</h1>
      {isAdmin && <button>Admin Panel</button>}
    </div>
  )
}
```

### Create Protected Page

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { UserRole } from '@/types'

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
```

### Database Operations

```typescript
import { createDocument, queryDocuments } from '@/db/operations'
import { User, UserRole } from '@/types'
import { COLLECTIONS } from '@/constants'

// Create user
await createDocument<User>(COLLECTIONS.USERS, uid, {
  email: 'user@example.com',
  displayName: 'John Doe',
  role: UserRole.USER,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
})

// Query users
const { data, pagination } = await queryDocuments<User>(
  COLLECTIONS.USERS,
  [
    { field: 'organizationId', operator: '==', value: orgId },
    { field: 'isActive', operator: '==', value: true },
  ],
  'createdAt',
  'desc',
  1, // page
  20 // limit
)
```

### Check Permissions

```typescript
import { hasPermission, canManageUser } from '@/utils/rbac'

// Check if user can create templates
if (hasPermission(user.role, 'templates', 'create')) {
  // Allowed
}

// Check if user can manage another user
if (canManageUser(currentUser, targetUser)) {
  // Can manage
}
```

---

## 🔗 API Routes Structure

All routes should follow this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get current user from auth token
    // Check permissions
    // Process request
    return NextResponse.json({ success: true, data: ... });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'ERROR_CODE', message: '...' } },
      { status: 500 }
    );
  }
}
```

---

## 🔒 Security Checklist

- [ ] Setup Firestore Security Rules (in SCHEMA.md)
- [ ] Add rate limiting to API endpoints
- [ ] Encrypt sensitive data in database
- [ ] Implement CSRF protection
- [ ] Add request validation (use Zod)
- [ ] Setup HTTPS for production
- [ ] Add audit logging
- [ ] Implement refresh token rotation

---

## 📊 Firestore Collections Ready

1. **users** - User accounts with role & organization
2. **roles** - Role definitions with permissions
3. **permissions** - Available permissions by resource
4. **organizations** - Company/organization info
5. **role_assignments** - User-role-org mappings
6. **whatsapp_accounts** - WhatsApp integrations
7. **whatsapp_messages** - Message history
8. **ai_agents** - AI agent configurations
9. **ai_conversations** - Conversation history
10. **response_rules** - AI auto-reply rules
11. **message_templates** - Message templates
12. **broadcasts** - Campaign broadcasts
13. **contacts** - WhatsApp contacts
14. **audit_logs** - Activity audit trail
15. **webhook_logs** - Webhook event logs

See `/src/db/SCHEMA.md` for complete schema details.

---

## 🧪 Testing the Setup

```bash
# Run type checking
npm run lint

# Build for production
npm run build

# Run development server
npm run dev
```

---

## 📖 Documentation Files

- **README.md** - Main project documentation
- **src/db/SCHEMA.md** - Database schema & Firestore setup
- **src/types/index.ts** - Type definitions with comments
- **src/utils/rbac.ts** - RBAC utility functions

---

## 🆘 Troubleshooting

### Firebase Connection Error

```
Error: Firebase configuration missing
```

**Solution**: Check `.env.local` has all required Firebase variables

### TypeScript Errors

```
Type 'X' is not assignable to type 'Y'
```

**Solution**: Check `/src/types/index.ts` for correct interfaces

### Auth Context Not Working

```
Error: useAuth must be used within AuthProvider
```

**Solution**: Wrap app with `<AuthProvider>` in `/src/app/layout.tsx`

---

## 🎯 Recommended Next Steps

1. **Create Auth Pages**

   - Login form with Firebase Auth
   - Registration form
   - Password reset

2. **Implement Dashboards**

   - Layout with sidebar navigation
   - Role-based menu items
   - User profile card

3. **Setup API Routes**

   - User CRUD operations
   - Role management
   - Permission checking middleware

4. **Create UI Components**

   - Data tables with pagination
   - Forms with validation
   - Modals & dialogs

5. **Integrate WhatsApp**

   - Webhook receiver
   - Message sender
   - Contact list

6. **Setup AI Agents**
   - OpenAI integration
   - Gemini integration
   - Conversation handler

---

## 📞 Support Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hooks](https://react.dev/reference/react)

---

## 📝 Notes

- All files are ready to extend
- Type definitions are complete
- Database operations are abstracted
- RBAC is ready to use
- Auth context is setup
- Ready for dashboard development

**Created**: October 31, 2024 **Status**: ✅ Development Ready
