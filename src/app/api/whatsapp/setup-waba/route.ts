import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import { verifyFirebaseToken, canManageWaba } from '@/utils/api-auth'
import { WhatsAppBusinessAccount } from '@/types/whatsapp'
import { COLLECTIONS, ERROR_CODES } from '@/constants'

/**
 * POST /api/whatsapp/setup-waba
 * Setup a new WhatsApp Business Account (WABA)
 * Requires: SUPERADMIN or ADMIN role
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

    // Check authorization
    if (!canManageWaba(auth.user)) {
      return NextResponse.json(
        { error: ERROR_CODES.UNAUTHORIZED },
        { status: 403 }
      )
    }

    // Parse request body
    const { accountId, businessId, name, currency, timezone } =
      await request.json()

    // Validate required fields
    if (!accountId || !businessId || !name || !currency || !timezone) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Check if WABA already exists
    const existing = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_BUSINESS_ACCOUNTS)
      .where('accountId', '==', accountId)
      .limit(1)
      .get()

    if (!existing.empty) {
      return NextResponse.json(
        { error: ERROR_CODES.ALREADY_EXISTS },
        { status: 409 }
      )
    }

    // Create WABA document
    const waba: Omit<WhatsAppBusinessAccount, 'id'> = {
      accountId,
      businessId,
      ownerId: auth.uid,
      name,
      currency,
      timezone,
      isActive: false,
      verificationStatus: 'pending',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add to Firestore
    const docRef = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_BUSINESS_ACCOUNTS)
      .add(waba)

    // Audit log
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'SETUP_WABA',
        resource: 'WHATSAPP_BUSINESS_ACCOUNTS',
        resourceId: docRef.id,
        changes: { accountId, businessId, name },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        wabaId: docRef.id,
        message: 'WABA created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error setting up WABA:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}

/**
 * GET /api/whatsapp/setup-waba
 * List all WABAs accessible to user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyFirebaseToken(request)
    if (!auth) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    let query: FirebaseFirestore.Query

    // Superadmin/admin sees all, others see only their WABAs
    if (auth.user.role === 'superadmin' || auth.user.role === 'admin') {
      query = getAdminDb().collection(COLLECTIONS.WHATSAPP_BUSINESS_ACCOUNTS)
    } else {
      query = getAdminDb()
        .collection(COLLECTIONS.WHATSAPP_BUSINESS_ACCOUNTS)
        .where('ownerId', '==', auth.uid)
    }

    const snapshot = await query.get()
    const wabas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({
      success: true,
      count: wabas.length,
      wabas,
    })
  } catch (error) {
    console.error('Error fetching WABAs:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
