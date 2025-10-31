import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { COLLECTIONS, ERROR_CODES } from '@/constants'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * GET /api/contacts/[id]
 * Get a specific contact
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await verifyFirebaseToken(request)
    if (!auth) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const { id } = params

    const contactDoc = await getAdminDb()
      .collection(COLLECTIONS.CONTACTS)
      .doc(id)
      .get()

    if (!contactDoc.exists) {
      return NextResponse.json(
        { error: ERROR_CODES.NOT_FOUND },
        { status: 404 }
      )
    }

    const contact = contactDoc.data()

    return NextResponse.json({
      success: true,
      contact: {
        id: contactDoc.id,
        ...contact,
      },
    })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/contacts/[id]
 * Update a contact
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await verifyFirebaseToken(request)
    if (!auth) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const { id } = params
    const updates = await request.json()

    // Get current contact
    const contactDoc = await getAdminDb()
      .collection(COLLECTIONS.CONTACTS)
      .doc(id)
      .get()

    if (!contactDoc.exists) {
      return NextResponse.json(
        { error: ERROR_CODES.NOT_FOUND },
        { status: 404 }
      )
    }

    // Prevent updating supervisor and phone (immutable fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { supervisorId, phone, ...mutableFields } = updates
    const fieldsToUpdate = {
      ...mutableFields,
      updatedAt: new Date(),
    }

    // Update contact
    await getAdminDb()
      .collection(COLLECTIONS.CONTACTS)
      .doc(id)
      .update(fieldsToUpdate)

    // Audit log
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'UPDATE_CONTACT',
        resource: 'CONTACTS',
        resourceId: id,
        changes: mutableFields,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully',
    })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contacts/[id]
 * Soft delete a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auth = await verifyFirebaseToken(request)
    if (!auth) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const { id } = params

    // Get contact
    const contactDoc = await getAdminDb()
      .collection(COLLECTIONS.CONTACTS)
      .doc(id)
      .get()

    if (!contactDoc.exists) {
      return NextResponse.json(
        { error: ERROR_CODES.NOT_FOUND },
        { status: 404 }
      )
    }

    // Soft delete
    await getAdminDb()
      .collection(COLLECTIONS.CONTACTS)
      .doc(id)
      .update({
        isActive: false,
        updatedAt: new Date(),
      })

    // Audit log
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'DELETE_CONTACT',
        resource: 'CONTACTS',
        resourceId: id,
        changes: { isActive: false },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
