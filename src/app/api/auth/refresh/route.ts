import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/config/firebase-admin'
import { COLLECTIONS, ERROR_CODES } from '@/constants'

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
export async function POST(request: NextRequest) {
  try {
    // Get current token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    // Verify current token
    let userId: string
    try {
      const decodedToken = await getAdminAuth().verifyIdToken(token)
      userId = decodedToken.uid
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    // Get user data
    const userDoc = await getAdminDb()
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: ERROR_CODES.USER_NOT_FOUND },
        { status: 404 }
      )
    }

    const userData = userDoc.data()

    // Check if user is active
    if (!userData?.isActive) {
      return NextResponse.json(
        { error: 'ACCOUNT_DISABLED' },
        { status: 403 }
      )
    }

    // Create new custom token
    try {
      const newToken = await getAdminAuth().createCustomToken(userId, {
        email: userData?.email,
        role: userData?.role,
      })

      // Update last activity
      await getAdminDb()
        .collection(COLLECTIONS.USERS)
        .doc(userId)
        .update({
          lastActivityAt: new Date(),
        })

      // Audit log
      await getAdminDb()
        .collection(COLLECTIONS.AUDIT_LOGS)
        .add({
          userId,
          action: 'TOKEN_REFRESHED',
          resource: 'USERS',
          resourceId: userId,
          changes: {},
          timestamp: new Date(),
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        })

      return NextResponse.json({
        success: true,
        token: newToken,
        user: {
          id: userId,
          email: userData?.email,
          name: userData?.name,
          role: userData?.role,
        },
      })
    } catch (error) {
      console.error('Error creating new token:', error)
      return NextResponse.json(
        { error: ERROR_CODES.EXTERNAL_API_ERROR },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
