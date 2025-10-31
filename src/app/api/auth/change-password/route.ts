import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/config/firebase-admin'
import { COLLECTIONS, ERROR_CODES } from '@/constants'
import {
  verifyFirebaseToken,
} from '@/utils/api-auth'
import {
  verifyPassword,
  hashPassword,
  isStrongPassword,
} from '@/utils/auth-utils'

/**
 * POST /api/auth/change-password
 * Change user password with bcrypt hashing
 * Requires authentication token
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyFirebaseToken(request)
    if (!auth) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Validate new password matches confirm password
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'PASSWORD_MISMATCH', message: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate new password is strong
    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        {
          error: 'WEAK_PASSWORD',
          message:
            'Password must have 8+ chars, uppercase, number, and special char',
        },
        { status: 400 }
      )
    }

    // Validate new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          error: 'SAME_PASSWORD',
          message: 'New password must be different from current password',
        },
        { status: 400 }
      )
    }

    // Get user from Firestore
    const userDoc = await getAdminDb()
      .collection(COLLECTIONS.USERS)
      .doc(auth.uid)
      .get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: ERROR_CODES.USER_NOT_FOUND },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    if (!userData) {
      return NextResponse.json(
        { error: ERROR_CODES.USER_NOT_FOUND },
        { status: 404 }
      )
    }

    const storedHash = userData.metadata?.customFields?.passwordHash

    if (!storedHash) {
      return NextResponse.json(
        { error: 'INVALID_STATE', message: 'Password hash not found' },
        { status: 500 }
      )
    }

    // Verify current password using bcrypt
    try {
      const passwordMatch = await verifyPassword(currentPassword, storedHash)
      if (!passwordMatch) {
        // Log failed attempt
        await getAdminDb()
          .collection(COLLECTIONS.AUDIT_LOGS)
          .add({
            userId: auth.uid,
            action: 'PASSWORD_CHANGE_FAILED',
            resource: 'USERS',
            resourceId: auth.uid,
            changes: {
              reason: 'Invalid current password',
            },
            timestamp: new Date(),
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          })

        return NextResponse.json(
          { error: 'INVALID_CURRENT_PASSWORD' },
          { status: 401 }
        )
      }
    } catch (verifyError) {
      console.error('Error verifying password:', verifyError)
      return NextResponse.json(
        { error: ERROR_CODES.EXTERNAL_API_ERROR },
        { status: 500 }
      )
    }

    // Hash new password with bcrypt
    let newHash: string
    try {
      newHash = await hashPassword(newPassword)
    } catch (hashError) {
      console.error('Password hashing error:', hashError)
      return NextResponse.json(
        { error: 'PASSWORD_CHANGE_FAILED' },
        { status: 500 }
      )
    }

    // Update password in Firebase Authentication
    try {
      await getAdminAuth().updateUser(auth.uid, {
        password: newPassword,
      })
    } catch (firebaseError: unknown) {
      const error = firebaseError as { code?: string; message?: string }
      console.error('Error updating Firebase password:', error)
      return NextResponse.json(
        { error: ERROR_CODES.EXTERNAL_API_ERROR },
        { status: 500 }
      )
    }

    // Update password hash in Firestore
    try {
      await getAdminDb()
        .collection(COLLECTIONS.USERS)
        .doc(auth.uid)
        .update({
          'metadata.customFields.passwordHash': newHash,
          'metadata.customFields.passwordUpdatedAt': new Date(),
          updatedAt: new Date(),
        })
    } catch (firestoreError) {
      console.error('Error updating Firestore password:', firestoreError)
      return NextResponse.json(
        { error: ERROR_CODES.EXTERNAL_API_ERROR },
        { status: 500 }
      )
    }

    // Log successful password change
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'PASSWORD_CHANGED',
        resource: 'USERS',
        resourceId: auth.uid,
        changes: {
          passwordUpdatedAt: new Date(),
        },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
