import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { createDocument } from '@/db/operations';
import { User, UserRole, ApiResponse } from '@/types';
import { COLLECTIONS } from '@/constants';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const { email, password, displayName, role } = body;

    // Validation
    if (!email || !password || !displayName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Email, password, and display name are required',
          },
        },
        { status: 400 }
      );
    }

    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    // Create user document in Firestore
    const newUser: User = {
      uid,
      email,
      displayName,
      role: role || UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createDocument<User>(COLLECTIONS.USERS, uid, newUser);

    return NextResponse.json(
      {
        success: true,
        data: {
          uid,
          email,
          displayName,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const err = error as Record<string, unknown>;
    console.error('Registration error:', err);

    // Handle Firebase specific errors
    if (err.code === 'auth/email-already-in-use') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'This email is already registered',
          },
        },
        { status: 409 }
      );
    }

    if (err.code === 'auth/weak-password') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Password must be at least 6 characters',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register user',
          details:
            process.env.NODE_ENV === 'development'
              ? { error: String(err?.message || err) }
              : undefined,
        },
      },
      { status: 500 }
    );
  }
}
