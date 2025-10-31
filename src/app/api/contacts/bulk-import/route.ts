import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { Contact } from '@/types/firestore'
import { COLLECTIONS, ERROR_CODES } from '@/constants'

/**
 * POST /api/contacts/bulk-import
 * Bulk import contacts from CSV or JSON
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyFirebaseToken(request)
    if (!auth) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contacts, supervisorId } = body

    // Validate input
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    if (!supervisorId) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Limit batch to 500 items
    if (contacts.length > 500) {
      return NextResponse.json(
        {
          error: 'BATCH_TOO_LARGE',
          message: 'Maximum 500 contacts per import',
        },
        { status: 400 }
      )
    }

    // Validate and prepare contacts
    const batch = getAdminDb().batch()
    const validContacts: Array<Omit<Contact, 'id'>> = []
    const errors: Array<{ index: number; error: string }> = []

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]

      // Validate required fields
      if (!contact.name || !contact.phone) {
        errors.push({
          index: i,
          error: 'Missing required fields: name, phone',
        })
        continue
      }

      // Check for duplicates within batch
      const isDuplicate = validContacts.some((c) => c.phone === contact.phone)
      if (isDuplicate) {
        errors.push({
          index: i,
          error: 'Duplicate phone number in batch',
        })
        continue
      }

      validContacts.push({
        supervisorId,
        assignedUserId: contact.assignedUserId,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        companyName: contact.companyName,
        jobTitle: contact.jobTitle,
        tags: contact.tags || [],
        category: contact.category,
        totalMessages: 0,
        customFields: contact.customFields || {},
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      })
    }

    // Check for existing contacts in database
    const existingPhones = new Set<string>()
    for (const contact of validContacts) {
      const existing = await getAdminDb()
        .collection(COLLECTIONS.CONTACTS)
        .where('phone', '==', contact.phone)
        .limit(1)
        .get()

      if (!existing.empty) {
        existingPhones.add(contact.phone)
      }
    }

    // Filter out duplicates
    const contactsToAdd = validContacts.filter(
      (c) => !existingPhones.has(c.phone)
    )

    // Add contacts via batch
    for (const contact of contactsToAdd) {
      const docRef = getAdminDb()
        .collection(COLLECTIONS.CONTACTS)
        .doc()
      batch.set(docRef, contact as Omit<Contact, 'id'>)
    }

    // Commit batch
    await batch.commit()

    // Audit log
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'BULK_IMPORT_CONTACTS',
        resource: 'CONTACTS',
        resourceId: 'bulk-import',
        changes: {
          totalRequested: contacts.length,
          totalImported: contactsToAdd.length,
          totalSkipped: validContacts.length - contactsToAdd.length,
          errors: errors.length,
        },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        imported: contactsToAdd.length,
        skipped: validContacts.length - contactsToAdd.length,
        errors: errors.length > 0 ? errors : undefined,
        message: `Imported ${contactsToAdd.length} contacts`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error importing contacts:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
