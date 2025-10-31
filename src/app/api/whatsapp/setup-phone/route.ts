import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import { verifyFirebaseToken, canManageWaba } from '@/utils/api-auth'
import { WhatsAppPhoneNumber, WhatsAppQualityRating } from '@/types/whatsapp'
import { COLLECTIONS, ERROR_CODES } from '@/constants'
import {
  encryptValue,
  isValidPhoneNumber,
  generateVerifyToken,
} from '@/utils/whatsapp-utils'

/**
 * POST /api/whatsapp/setup-phone
 * Setup a WhatsApp phone number for a WABA
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
    const {
      wabaId,
      phoneNumber,
      phoneNumberId,
      accessToken,
      webhookUrl,
      verifyToken,
    } = await request.json()

    // Validate required fields
    if (
      !wabaId ||
      !phoneNumber ||
      !phoneNumberId ||
      !accessToken ||
      !webhookUrl
    ) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Validate phone number format
    if (!isValidPhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Verify WABA exists and user can access it
    const wabaDoc = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_BUSINESS_ACCOUNTS)
      .doc(wabaId)
      .get()

    if (!wabaDoc.exists) {
      return NextResponse.json(
        { error: ERROR_CODES.NOT_FOUND },
        { status: 404 }
      )
    }

    const wabaData = wabaDoc.data()
    if (
      wabaData?.ownerId !== auth.uid &&
      auth.user.role !== 'superadmin'
    ) {
      return NextResponse.json(
        { error: ERROR_CODES.UNAUTHORIZED },
        { status: 403 }
      )
    }

    // Check if phone number already exists
    const existing = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_PHONE_NUMBERS)
      .where('phoneNumberId', '==', phoneNumberId)
      .limit(1)
      .get()

    if (!existing.empty) {
      return NextResponse.json(
        { error: ERROR_CODES.ALREADY_EXISTS },
        { status: 409 }
      )
    }

    // Encrypt access token
    const accessTokenEncrypted = encryptValue(accessToken)

    // Create phone number document
    const phoneDoc: Omit<WhatsAppPhoneNumber, 'id'> = {
      wabaId,
      userId: auth.uid,
      phoneNumber,
      phoneNumberId,
      displayName: phoneNumber,
      qualityRating: WhatsAppQualityRating.YELLOW,
      verified: false,
      isActive: true,
      webhookUrl,
      webhookVerifyToken: verifyToken || generateVerifyToken(),
      accessTokenEncrypted,
      messagingLimit: {
        dailyLimit: 80,
        dailyUsed: 0,
        resetAt: new Date(),
      },
      statistics: {
        totalMessagesSent: 0,
        totalMessagesReceived: 0,
        totalTemplatesSent: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add to Firestore
    const docRef = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_PHONE_NUMBERS)
      .add(phoneDoc)

    // Audit log
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'SETUP_PHONE',
        resource: 'WHATSAPP_PHONE_NUMBERS',
        resourceId: docRef.id,
        changes: {
          phoneNumber,
          phoneNumberId,
          wabaId,
        },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        phoneId: docRef.id,
        message: 'Phone number setup successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error setting up phone:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}

/**
 * GET /api/whatsapp/setup-phone?wabaId=...
 * List all phone numbers for a WABA
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

    // Get wabaId from query params
    const { searchParams } = new URL(request.url)
    const wabaId = searchParams.get('wabaId')

    if (!wabaId) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Verify WABA exists and user can access it
    const wabaDoc = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_BUSINESS_ACCOUNTS)
      .doc(wabaId)
      .get()

    if (!wabaDoc.exists) {
      return NextResponse.json(
        { error: ERROR_CODES.NOT_FOUND },
        { status: 404 }
      )
    }

    const wabaData = wabaDoc.data()
    if (
      wabaData?.ownerId !== auth.uid &&
      auth.user.role !== 'superadmin' &&
      auth.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: ERROR_CODES.UNAUTHORIZED },
        { status: 403 }
      )
    }

    // Get all phone numbers for this WABA
    const snapshot = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_PHONE_NUMBERS)
      .where('wabaId', '==', wabaId)
      .get()

    const phones = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Don't expose encrypted token
        accessTokenEncrypted: undefined,
      }
    })

    return NextResponse.json({
      success: true,
      count: phones.length,
      phones,
    })
  } catch (error) {
    console.error('Error fetching phones:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
