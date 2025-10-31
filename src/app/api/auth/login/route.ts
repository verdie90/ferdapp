import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, addDoc, Firestore } from 'firebase/firestore'
import { COLLECTIONS } from '@/constants'
import { isValidEmail, verifyPassword } from '@/utils/auth-utils'

// Initialize Firebase for server-side
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let db: Firestore | undefined
try {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig)
    db = getFirestore(app)
  } else {
    db = getFirestore(getApps()[0])
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error)
}

/**
 * POST /api/auth/login
 * Login user with email/password and return token
 * Uses bcrypt password verification from Firestore
 */
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Database not initialized' },
        { status: 500 }
      )
    }

    const { email, password } = await request.json()

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get user from Firestore by email
    try {
      const userQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', email.toLowerCase())
      )
      const userSnapshot = await getDocs(userQuery)

      if (userSnapshot.empty) {
        return NextResponse.json(
          { error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' },
          { status: 401 }
        )
      }

      const userData = userSnapshot.docs[0].data()
      const userId = userSnapshot.docs[0].id

      // Check if user is active
      if (!userData.isActive) {
        return NextResponse.json(
          { error: 'ACCOUNT_DISABLED', message: 'Your account has been disabled' },
          { status: 403 }
        )
      }

      // Get bcrypt hash from Firestore
      const storedHash = userData.passwordHash
      if (!storedHash) {
        console.error('No password hash found for user:', userId)
        return NextResponse.json(
          { error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' },
          { status: 401 }
        )
      }

      // Verify password using bcrypt
      try {
        const passwordMatch = await verifyPassword(password, storedHash)
        if (!passwordMatch) {
          // Log failed login attempt
          await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
            userId,
            action: 'LOGIN_FAILED_INVALID_PASSWORD',
            resource: 'USERS',
            resourceId: userId,
            changes: {
              email: userData.email,
              reason: 'Invalid password',
            },
            timestamp: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          })

          return NextResponse.json(
            { error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' },
            { status: 401 }
          )
        }
      } catch (verifyError) {
        console.error('Error verifying password:', verifyError)
        return NextResponse.json(
          { error: 'EXTERNAL_API_ERROR', message: 'Failed to verify password' },
          { status: 500 }
        )
      }

      // Update last login
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
        })
      } catch (updateError) {
        console.error('Error updating last login:', updateError)
      }

      // Audit log - successful login
      await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        userId,
        action: 'USER_LOGIN',
        resource: 'USERS',
        resourceId: userId,
        changes: {
          email: userData.email,
        },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

      // Generate token (userId base64 encoded)
      const token = Buffer.from(JSON.stringify({ userId, email: userData.email, role: userData.role })).toString('base64')

      return NextResponse.json(
        {
          success: true,
          token,
          user: {
            id: userId,
            email: userData.email,
            name: userData.name,
            username: userData.username,
            role: userData.role,
          },
          message: 'Login successful',
        },
        { status: 200 }
      )
    } catch (queryError) {
      console.error('Database query error:', queryError)
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Failed to process login' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      {
        error: 'EXTERNAL_API_ERROR',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}
