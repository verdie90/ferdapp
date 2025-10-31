import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import {
  WhatsAppWebhook,
  WebhookEventType,
  WhatsAppMessage,
  MessageDirection,
  MessageStatus,
  MessageType,
} from '@/types/whatsapp'
import { COLLECTIONS } from '@/constants'
import { generateWebhookSignature } from '@/utils/whatsapp-utils'

const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || ''
const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || ''

/**
 * GET /api/webhook/whatsapp
 * Meta webhook challenge verification
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const mode = searchParams.get('hub.mode')
    const verifyToken = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode !== 'subscribe' || verifyToken !== WEBHOOK_VERIFY_TOKEN) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    return NextResponse.json(challenge, { status: 200 })
  } catch (error) {
    console.error('Webhook verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

/**
 * POST /api/webhook/whatsapp
 * Receive and process webhook events from Meta
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('X-Hub-Signature-256')

    // Verify webhook signature
    if (signature && WEBHOOK_SECRET) {
      const expected = `sha256=${generateWebhookSignature(body, WEBHOOK_SECRET)}`
      if (signature !== expected) {
        console.warn('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    const payload = JSON.parse(body)

    // Extract webhook info
    const { entry } = payload

    if (!entry || entry.length === 0) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Process each entry
    for (const entryData of entry) {
      const { changes } = entryData

      if (!changes) continue

      for (const change of changes) {
        const { field, value } = change

        // Store webhook in database
        const webhookDoc: Omit<WhatsAppWebhook, 'id'> = {
          wabaId: entryData.id as string,
          eventType: determineEventType(field),
          eventId: value.id as string,
          payload: value,
          processed: false,
          retryCount: 0,
          maxRetries: 3,
          sourceIp: request.headers.get('x-forwarded-for') || 'unknown',
          webhookSignature: signature || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          receivedAt: new Date(),
        }

        const webhookRef = await getAdminDb()
          .collection(COLLECTIONS.WHATSAPP_WEBHOOKS)
          .add(webhookDoc)

        // Process webhook asynchronously
        processWebhookEvent(webhookRef.id, value, field).catch((error) => {
          console.error('Error processing webhook:', error)
        })
      }
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ success: false }, { status: 200 }) // Return 200 to stop retries
  }
}

/**
 * Determine event type from webhook field and value
 */
function determineEventType(
  field: string
): WebhookEventType {
  if (field === 'messages') {
    return WebhookEventType.MESSAGE
  }
  if (field === 'message_status') {
    return WebhookEventType.MESSAGE_STATUS
  }
  if (field === 'template_status_update') {
    return WebhookEventType.TEMPLATE_STATUS
  }
  if (field === 'account_alert') {
    return WebhookEventType.ACCOUNT_ALERT
  }
  if (field === 'phone_number_quality_update') {
    return WebhookEventType.PHONE_NUMBER_QUALITY_UPDATE
  }

  return WebhookEventType.MESSAGE
}

/**
 * Process webhook event asynchronously
 */
async function processWebhookEvent(
  webhookId: string,
  value: Record<string, unknown>,
  field: string
): Promise<void> {
  try {
    if (field === 'messages') {
      await processMessageEvent(value)
    } else if (field === 'message_status') {
      await processStatusEvent(value)
    } else if (field === 'template_status_update') {
      await processTemplateStatusEvent(value)
    }

    // Mark webhook as processed
    await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_WEBHOOKS)
      .doc(webhookId)
      .update({
        processed: true,
        processedAt: new Date(),
      })
  } catch (error) {
    console.error('Error processing webhook event:', error)

    // Increment retry count
    const webhook = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_WEBHOOKS)
      .doc(webhookId)
      .get()

    const data = webhook.data()
    const retryCount = (data?.retryCount || 0) + 1
    const maxRetries = data?.maxRetries || 3

    if (retryCount < maxRetries) {
      // Schedule retry
      const nextRetryAt = new Date()
      nextRetryAt.setSeconds(nextRetryAt.getSeconds() + Math.pow(2, retryCount) * 60) // Exponential backoff

      await getAdminDb()
        .collection(COLLECTIONS.WHATSAPP_WEBHOOKS)
        .doc(webhookId)
        .update({
          retryCount,
          nextRetryAt,
          processingError: (error as Error).message,
        })
    } else {
      // Mark as failed
      await getAdminDb()
        .collection(COLLECTIONS.WHATSAPP_WEBHOOKS)
        .doc(webhookId)
        .update({
          processed: false,
          processingError: `Max retries reached: ${(error as Error).message}`,
        })
    }
  }
}

/**
 * Process inbound message event
 */
async function processMessageEvent(value: Record<string, unknown>): Promise<void> {
  const messages = (value.messages as Array<Record<string, unknown>>) || []

  for (const msg of messages) {
    const messageId = msg.id as string
    const phoneNumberId = msg.from as string
    const timestamp = msg.timestamp as number
    const messageData = (msg as Record<string, unknown>).text ||
      (msg as Record<string, unknown>).image ||
      (msg as Record<string, unknown>).document || { body: 'Unknown' }

    // Create message document
    const messageDoc: Omit<WhatsAppMessage, 'id'> = {
      phoneNumberId,
      wabaId: (value as Record<string, Record<string, unknown>>).metadata?.phone_number_id as string,
      userId: 'webhook', // System user for incoming messages
      messageId,
      direction: MessageDirection.INBOUND,
      type: MessageType.TEXT,
      content: messageData,
      status: MessageStatus.DELIVERED,
      timestamp: new Date(timestamp * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Save message
    await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_MESSAGES)
      .add(messageDoc)

    // Update contact statistics
    const contactsQuery = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_CONTACTS)
      .where('phoneNumber', '==', phoneNumberId)
      .limit(1)
      .get()

    if (!contactsQuery.empty) {
      const contactId = contactsQuery.docs[0].id
      const contact = contactsQuery.docs[0].data()

      await getAdminDb()
        .collection(COLLECTIONS.WHATSAPP_CONTACTS)
        .doc(contactId)
        .update({
          'statistics.totalMessages': (contact?.statistics?.totalMessages || 0) + 1,
          'statistics.lastMessageAt': new Date(),
        })
    }
  }
}

/**
 * Process message status update event
 */
async function processStatusEvent(value: Record<string, unknown>): Promise<void> {
  const statuses = (value.statuses as Array<Record<string, unknown>>) || []

  for (const status of statuses) {
    const messageId = status.id as string
    const statusValue = status.status as string

    // Find and update message
    const messagesQuery = await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_MESSAGES)
      .where('messageId', '==', messageId)
      .limit(1)
      .get()

    if (!messagesQuery.empty) {
      const msgId = messagesQuery.docs[0].id

      await getAdminDb()
        .collection(COLLECTIONS.WHATSAPP_MESSAGES)
        .doc(msgId)
        .update({
          status: statusValue,
          updatedAt: new Date(),
        })
    }
  }
}

/**
 * Process template status update event
 */
async function processTemplateStatusEvent(
  value: Record<string, unknown>
): Promise<void> {
  const templateStatus = value.status as string
  const templateId = value.id as string

  // Find and update template
  const templatesQuery = await getAdminDb()
    .collection(COLLECTIONS.WHATSAPP_TEMPLATES)
    .where('templateId', '==', templateId)
    .limit(1)
    .get()

  if (!templatesQuery.empty) {
    const tplId = templatesQuery.docs[0].id

    await getAdminDb()
      .collection(COLLECTIONS.WHATSAPP_TEMPLATES)
      .doc(tplId)
      .update({
        status: templateStatus,
        updatedAt: new Date(),
      })
  }
}
