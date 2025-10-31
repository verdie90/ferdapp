import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { Contact } from '@/types/firestore'
import { COLLECTIONS, ERROR_CODES } from '@/constants'

/**
 * POST /api/contacts
 * Create a new contact
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

    const {
      supervisorId,
      assignedUserId,
      name,
      phone,
      email,
      companyName,
      jobTitle,
      tags,
      category,
    } = await request.json()

    // Validate required fields
    if (!name || !phone || !supervisorId) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Check if contact already exists (by phone)
    const existing = await getAdminDb()
      .collection(COLLECTIONS.CONTACTS)
      .where('phone', '==', phone)
      .limit(1)
      .get()

    if (!existing.empty) {
      return NextResponse.json(
        { error: 'CONTACT_ALREADY_EXISTS' },
        { status: 409 }
      )
    }

    // Create contact document
    const contactData: Omit<Contact, 'id'> = {
      supervisorId,
      assignedUserId,
      name,
      phone,
      email,
      companyName,
      jobTitle,
      tags: tags || [],
      category,
      totalMessages: 0,
      customFields: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    const docRef = await getAdminDb()
      .collection(COLLECTIONS.CONTACTS)
      .add(contactData)

    // Audit log
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'CREATE_CONTACT',
        resource: 'CONTACTS',
        resourceId: docRef.id,
        changes: { name, phone, email, supervisorId },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        contactId: docRef.id,
        message: 'Contact created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}

/**
 * GET /api/contacts
 * List all contacts with pagination
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

    // Get pagination params
    const { searchParams } = new URL(request.url)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const pageToken = searchParams.get('pageToken')
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')

    let query = getAdminDb()
      .collection(COLLECTIONS.CONTACTS)
      .where('isActive', '==', true)

    // Apply filters
    if (tag) {
      query = query.where('tags', 'array-contains', tag)
    }

    // Order by creation date
    query = query.orderBy('createdAt', 'desc').limit(pageSize + 1)

    // Apply pagination
    if (pageToken) {
      const lastDoc = await getAdminDb()
        .collection(COLLECTIONS.CONTACTS)
        .doc(pageToken)
        .get()
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc)
      }
    }

    const snapshot = await query.get()
    const contacts = snapshot.docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Contact & { id: string }))

    // Get next page token
    const nextPageToken =
      snapshot.docs.length > pageSize
        ? snapshot.docs[pageSize - 1].id
        : undefined

    // Apply search filter in memory (since Firestore doesn't support full-text search)
    const filtered = search
      ? contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search) ||
            c.email?.toLowerCase().includes(search.toLowerCase())
        )
      : contacts

    return NextResponse.json({
      success: true,
      count: filtered.length,
      contacts: filtered,
      nextPageToken,
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
