import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import { verifyFirebaseToken, canAccessPhone } from '@/utils/api-auth'
import {
  WhatsAppMessage,
  MessageType,
  MessageStatus,
  MessageDirection,
} from '@/types/whatsapp'
import { COLLECTIONS, ERROR_CODES } from '@/constants'
import {
  decryptValue,
} from '@/utils/whatsapp-utils'

const META_API_VERSION = 'v18.0'
const META_API_URL = `https://graph.instagram.com/${META_API_VERSION}`

/**
 * POST /api/whatsapp/send-message
 * Send a WhatsApp message via Meta API
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

    // Parse request body
    const { phoneId, recipientPhone, messageType, content, templateName } =
      await request.json()

    // Validate required fields
    if (!phoneId || !recipientPhone || !messageType || !content) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Get phone number document
    const phoneDoc = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_PHONE_NUMBERS)
      .doc(phoneId)
      .get()

    if (!phoneDoc.exists) {
      return NextResponse.json(
        { error: ERROR_CODES.NOT_FOUND },
        { status: 404 }
      )
    }

    const phoneData = phoneDoc.data()

    // Check authorization
    if (!canAccessPhone(auth.user, phoneData?.userId)) {
      return NextResponse.json(
        { error: ERROR_CODES.UNAUTHORIZED },
        { status: 403 }
      )
    }

    // Decrypt access token
    let accessToken: string
    try {
      accessToken = decryptValue(phoneData?.accessTokenEncrypted)
    } catch (error) {
      console.error('Failed to decrypt access token:', error)
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Build Meta API request payload
    const metaPayload = buildMetaPayload(
      recipientPhone,
      messageType,
      content,
      templateName
    )

    // Call Meta API
    const metaResponse = await fetch(
      `${META_API_URL}/${phoneData?.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
      }
    )

    const metaData = await metaResponse.json()

    if (!metaResponse.ok) {
      // Log error to WHATSAPP_ERRORS collection
      await getAdminDb()
        .collection(COLLECTIONS.WHATSAPP_ERRORS)
        .add({
          phoneNumberId: phoneData?.phoneNumberId,
          errorCode: metaData.error?.code,
          errorMessage: metaData.error?.message,
          context: {
            action: 'SEND_MESSAGE',
            recipientPhone,
            messageType,
          },
          timestamp: new Date(),
          resolved: false,
        })

      return NextResponse.json(
        {
          error: ERROR_CODES.EXTERNAL_API_ERROR,
          details: metaData.error?.message,
        },
        { status: 400 }
      )
    }

    const messageId = metaData.messages?.[0]?.id

    // Create message document
    const messageDoc: Omit<WhatsAppMessage, 'id'> = {
      phoneNumberId: phoneData?.phoneNumberId,
      wabaId: phoneData?.wabaId,
      userId: auth.uid,
      messageId,
      direction: MessageDirection.OUTBOUND,
      type: messageType as MessageType,
      content,
      status: MessageStatus.SENT,
      templateName: templateName || undefined,
      cost: {
        currency: 'USD',
        pricePerMessage: 0.004,
        totalCost: 0.004,
        billingCategory: 'STANDARD',
      },
      metadata: {
        conversationId: undefined,
        tags: [],
      },
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save message to Firestore
    const msgRef = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_MESSAGES)
      .add(messageDoc)

    // Update phone statistics
    await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_PHONE_NUMBERS)
      .doc(phoneId)
      .update({
        'statistics.totalMessagesSent':
          (phoneData?.statistics?.totalMessagesSent || 0) + 1,
        updatedAt: new Date(),
      })

    // Audit log
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'SEND_MESSAGE',
        resource: 'WHATSAPP_MESSAGES',
        resourceId: msgRef.id,
        changes: {
          phoneId,
          recipientPhone,
          messageType,
        },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        messageId: msgRef.id,
        metaMessageId: messageId,
        message: 'Message sent successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}

/**
 * Build Meta API payload from message content
 */
function buildMetaPayload(
  recipientPhone: string,
  messageType: string,
  content: unknown,
  templateName?: string
): Record<string, unknown> {
  const base = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone.replace(/\D/g, ''),
  }

  if (messageType === MessageType.TEMPLATE && templateName) {
    return {
      ...base,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en_US',
        },
        ...(typeof content === 'object' && content !== null && content),
      },
    }
  }

  if (messageType === MessageType.TEXT) {
    return {
      ...base,
      type: 'text',
      text: {
        preview_url: false,
        body: typeof content === 'string' ? content : JSON.stringify(content),
      },
    }
  }

  // Default: text message
  return {
    ...base,
    type: 'text',
    text: {
      preview_url: false,
      body: JSON.stringify(content),
    },
  }
}
