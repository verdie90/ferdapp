import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { getAdminDb } from '@/config/firebase-admin'
import { COLLECTIONS } from '@/constants'
import type { AIBehaviour } from '@/types/firestore'

type RouteParams = {
  params: {
    behaviourId: string
  }
}

/**
 * GET /api/behaviors/[behaviourId]
 * Retrieve a specific behavior by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyFirebaseToken(req)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { behaviourId } = params

    if (!behaviourId || typeof behaviourId !== 'string') {
      return NextResponse.json({ error: 'Invalid behaviourId' }, { status: 400 })
    }

    const behaviourSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_BEHAVIOURS)
      .doc(behaviourId)
      .get()

    if (!behaviourSnapshot.exists) {
      return NextResponse.json({ error: 'Behavior not found' }, { status: 404 })
    }

    const behaviour = behaviourSnapshot.data() as AIBehaviour

    // Verify ownership
    if (behaviour.userId !== auth.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(
      {
        behaviour: { ...behaviour, id: behaviourId },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('GET /api/behaviors/[behaviourId] error:', error)
    return NextResponse.json({ error: 'Failed to fetch behavior' }, { status: 500 })
  }
}

/**
 * PUT /api/behaviors/[behaviourId]
 * Update a specific behavior
 * Body: Partial behavior update (only include fields to update)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyFirebaseToken(req)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { behaviourId } = params

    if (!behaviourId || typeof behaviourId !== 'string') {
      return NextResponse.json({ error: 'Invalid behaviourId' }, { status: 400 })
    }

    const behaviourSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_BEHAVIOURS)
      .doc(behaviourId)
      .get()

    if (!behaviourSnapshot.exists) {
      return NextResponse.json({ error: 'Behavior not found' }, { status: 404 })
    }

    const behaviour = behaviourSnapshot.data() as AIBehaviour

    // Verify ownership
    if (behaviour.userId !== auth.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()

    // Build update object with only provided fields
    const updateData: Partial<AIBehaviour> = {}

    if ('name' in body && body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      }
      updateData.name = body.name.trim()
    }

    if ('personality' in body && body.personality !== undefined) {
      if (typeof body.personality !== 'string' || body.personality.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid personality' }, { status: 400 })
      }
      updateData.personality = body.personality.trim()
    }

    if ('communicationStyle' in body && body.communicationStyle !== undefined) {
      if (typeof body.communicationStyle !== 'string' || body.communicationStyle.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid communicationStyle' }, { status: 400 })
      }
      updateData.communicationStyle = body.communicationStyle.trim()
    }

    if ('tone' in body && body.tone !== undefined) {
      if (typeof body.tone !== 'string' || body.tone.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid tone' }, { status: 400 })
      }
      updateData.tone = body.tone.trim()
    }

    if ('responseGuidelines' in body && body.responseGuidelines !== undefined) {
      if (!Array.isArray(body.responseGuidelines)) {
        return NextResponse.json({ error: 'Invalid responseGuidelines' }, { status: 400 })
      }
      updateData.responseGuidelines = body.responseGuidelines
    }

    if ('limitations' in body && body.limitations !== undefined) {
      if (!Array.isArray(body.limitations)) {
        return NextResponse.json({ error: 'Invalid limitations' }, { status: 400 })
      }
      updateData.limitations = body.limitations
    }

    if ('customInstructions' in body && body.customInstructions !== undefined) {
      updateData.customInstructions = String(body.customInstructions).trim()
    }

    if ('shouldAskClarification' in body && body.shouldAskClarification !== undefined) {
      updateData.shouldAskClarification = body.shouldAskClarification === true
    }

    if ('shouldProvideExamples' in body && body.shouldProvideExamples !== undefined) {
      updateData.shouldProvideExamples = body.shouldProvideExamples === true
    }

    if ('shouldIncludeDisclaimer' in body && body.shouldIncludeDisclaimer !== undefined) {
      updateData.shouldIncludeDisclaimer = body.shouldIncludeDisclaimer === true
    }

    if ('disclaimerText' in body && body.disclaimerText !== undefined) {
      updateData.disclaimerText = body.disclaimerText ? String(body.disclaimerText).trim() : undefined
    }

    if ('handoffKeywords' in body && body.handoffKeywords !== undefined) {
      if (body.handoffKeywords !== null && !Array.isArray(body.handoffKeywords)) {
        return NextResponse.json({ error: 'Invalid handoffKeywords' }, { status: 400 })
      }
      updateData.handoffKeywords = body.handoffKeywords || undefined
    }

    if ('handoffPrompt' in body && body.handoffPrompt !== undefined) {
      updateData.handoffPrompt = body.handoffPrompt ? String(body.handoffPrompt).trim() : undefined
    }

    // Add timestamp
    updateData.updatedAt = new Date()

    // Update document
    await getAdminDb()
      .collection(COLLECTIONS.AI_BEHAVIOURS)
      .doc(behaviourId)
      .update(updateData)

    // Log audit
    await getAdminDb().collection(COLLECTIONS.AUDIT_LOGS).add({
      userId: auth.uid,
      action: 'UPDATE_BEHAVIOUR',
      resource: 'AI_BEHAVIOUR',
      resourceId: behaviourId,
      changes: { updated: updateData },
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    })

    // Fetch updated document
    const updatedSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_BEHAVIOURS)
      .doc(behaviourId)
      .get()

    const updatedBehaviour = updatedSnapshot.data() as AIBehaviour

    return NextResponse.json(
      {
        behaviour: { ...updatedBehaviour, id: behaviourId },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('PUT /api/behaviors/[behaviourId] error:', error)
    return NextResponse.json({ error: 'Failed to update behavior' }, { status: 500 })
  }
}

/**
 * DELETE /api/behaviors/[behaviourId]
 * Delete a specific behavior
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyFirebaseToken(req)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { behaviourId } = params

    if (!behaviourId || typeof behaviourId !== 'string') {
      return NextResponse.json({ error: 'Invalid behaviourId' }, { status: 400 })
    }

    const behaviourSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_BEHAVIOURS)
      .doc(behaviourId)
      .get()

    if (!behaviourSnapshot.exists) {
      return NextResponse.json({ error: 'Behavior not found' }, { status: 404 })
    }

    const behaviour = behaviourSnapshot.data() as AIBehaviour

    // Verify ownership
    if (behaviour.userId !== auth.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete document
    await getAdminDb()
      .collection(COLLECTIONS.AI_BEHAVIOURS)
      .doc(behaviourId)
      .delete()

    // Log audit
    await getAdminDb().collection(COLLECTIONS.AUDIT_LOGS).add({
      userId: auth.uid,
      action: 'DELETE_BEHAVIOUR',
      resource: 'AI_BEHAVIOUR',
      resourceId: behaviourId,
      changes: { deleted: behaviour },
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json(
      { message: 'Behavior deleted successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('DELETE /api/behaviors/[behaviourId] error:', error)
    return NextResponse.json({ error: 'Failed to delete behavior' }, { status: 500 })
  }
}
