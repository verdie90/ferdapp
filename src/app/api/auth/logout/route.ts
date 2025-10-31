import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/config/firebase-admin'
import { COLLECTIONS, ERROR_CODES } from '@/constants'

/**
 * POST /api/auth/logout
 * Logout user and revoke tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    // Verify token
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

    // Revoke all tokens for user
    try {
      await getAdminAuth().revokeRefreshTokens(userId)
    } catch (error) {
      console.warn('Could not revoke tokens:', error)
      // Continue even if revoke fails
    }

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
        action: 'USER_LOGOUT',
        resource: 'USERS',
        resourceId: userId,
        changes: {},
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json({
      success: true,
      message: 'Logout successful',
    })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
