import { NextRequest } from 'next/server'
import { getAdminAuth, getAdminDb } from '@/config/firebase-admin'
import { COLLECTIONS } from '@/constants'
import { FerdUser } from '@/types/firestore'

/**
 * Verify Firebase token and get user data
 */
export async function verifyFirebaseToken(
  request: NextRequest
): Promise<{ uid: string; user: FerdUser } | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.slice(7)

    // Verify token
    const decodedToken = await getAdminAuth().verifyIdToken(token)
    const uid = decodedToken.uid

    // Get user data from Firestore
    const userDoc = await getAdminDb()
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .get()

    if (!userDoc.exists) {
      return null
    }

    return {
      uid,
      user: userDoc.data() as FerdUser,
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: FerdUser,
  requiredRoles: string[]
): boolean {
  return requiredRoles.includes(user.role || 'user')
}

/**
 * Check if user can manage WABA
 */
export function canManageWaba(user: FerdUser): boolean {
  return user.role === 'superadmin' || user.role === 'admin'
}

/**
 * Check if user can access phone number
 */
export function canAccessPhone(
  user: FerdUser,
  phoneOwnerId: string
): boolean {
  if (user.role === 'superadmin' || user.role === 'admin') {
    return true
  }
  return user.id === phoneOwnerId
}
