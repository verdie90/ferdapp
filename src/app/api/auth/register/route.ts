import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, setDoc, doc, addDoc, Firestore } from 'firebase/firestore'
import {
  hashPassword,
  isValidEmail,
  isValidUsername,
  isStrongPassword,
} from '@/utils/auth-utils'
import { COLLECTIONS } from '@/constants'

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
 * POST /api/auth/register
 * Register a new user account with bcrypt password hashing in Firestore
 */
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Database not initialized' },
        { status: 500 }
      )
    }

    let email, password, name, username, role

    try {
      const body = await request.json()
      email = body.email
      password = body.password
      name = body.name
      username = body.username
      role = body.role || 'user'
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Validate inputs
    if (!email || !password || !name || !username) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL', message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate username
    if (!isValidUsername(username)) {
      return NextResponse.json(
        {
          error: 'INVALID_USERNAME',
          message: 'Username must be 3-20 characters, alphanumeric with underscore only',
        },
        { status: 400 }
      )
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        {
          error: 'WEAK_PASSWORD',
          message: 'Password must have 8+ chars, uppercase, number, and special char',
        },
        { status: 400 }
      )
    }

    // Check if email already exists in Firestore
    try {
      const emailQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', email.toLowerCase())
      )
      const emailSnapshot = await getDocs(emailQuery)

      if (!emailSnapshot.empty) {
        return NextResponse.json(
          { error: 'EMAIL_ALREADY_EXISTS', message: 'Email already registered' },
          { status: 409 }
        )
      }
    } catch (queryError) {
      console.error('Error checking email:', queryError)
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Failed to check email availability' },
        { status: 500 }
      )
    }

    // Check if username already exists
    try {
      const usernameQuery = query(
        collection(db, COLLECTIONS.USERS),
        where('username', '==', username.toLowerCase())
      )
      const usernameSnapshot = await getDocs(usernameQuery)

      if (!usernameSnapshot.empty) {
        return NextResponse.json(
          { error: 'USERNAME_TAKEN', message: 'Username already taken' },
          { status: 409 }
        )
      }
    } catch (queryError) {
      console.error('Error checking username:', queryError)
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: 'Failed to check username availability' },
        { status: 500 }
      )
    }

    // Hash password using bcrypt
    let passwordHash: string
    try {
      passwordHash = await hashPassword(password)
    } catch (hashError) {
      console.error('Password hashing error:', hashError)
      return NextResponse.json(
        { error: 'REGISTRATION_FAILED', message: 'Failed to process password' },
        { status: 500 }
      )
    }

    // Generate user ID (using timestamp + random)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Create user document in Firestore
    try {
      const userData = {
        id: userId,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        name,
        role: role || 'user',
        passwordHash, // Bcrypt hash stored in Firestore
        isActive: true,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          registeredFrom: request.headers.get('user-agent') || 'unknown',
          registeredIp: request.headers.get('x-forwarded-for') || 'unknown',
          passwordUpdatedAt: new Date(),
        },
      }

      // Save user to Firestore
      await setDoc(doc(db, COLLECTIONS.USERS, userId), userData)

      // Audit log
      await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        userId,
        action: 'USER_REGISTERED',
        resource: 'USERS',
        resourceId: userId,
        changes: {
          email: email.toLowerCase(),
          name,
          role: role || 'user',
        },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

      // Generate a simple token (userId base64 encoded for now)
      const token = Buffer.from(JSON.stringify({ userId, email, role })).toString('base64')

      return NextResponse.json(
        {
          success: true,
          token,
          userId,
          message: 'User registered successfully',
          user: {
            id: userId,
            email: userData.email,
            name: userData.name,
            username: userData.username,
            role: userData.role,
          },
        },
        { status: 201 }
      )
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'REGISTRATION_FAILED', message: 'Failed to create user' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Registration error:', error)
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
