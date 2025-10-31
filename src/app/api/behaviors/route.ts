import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { getAdminDb } from '@/config/firebase-admin'
import { COLLECTIONS } from '@/constants'
import type { AIBehaviour } from '@/types/firestore'

/**
 * GET /api/behaviors
 * List all behaviors for the current user with pagination
 * Query params: pageSize (default: 20), pageToken (optional)
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyFirebaseToken(req)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(req.url)
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20'), 100)
    const pageToken = url.searchParams.get('pageToken')

    let query = getAdminDb()
      .collection(COLLECTIONS.AI_BEHAVIOURS)
      .where('userId', '==', auth.uid)
      .orderBy('createdAt', 'desc')
      .limit(pageSize + 1)

    if (pageToken) {
      const lastDocSnapshot = await getAdminDb()
        .collection(COLLECTIONS.AI_BEHAVIOURS)
        .doc(pageToken)
        .get()
      if (lastDocSnapshot.exists) {
        query = query.startAfter(lastDocSnapshot)
      }
    }

    const snapshot = await query.get()
    const behaviours: (AIBehaviour & { id: string })[] = []
    let nextPageToken: string | null = null

    snapshot.docs.forEach((doc, index) => {
      if (index < pageSize) {
        behaviours.push({ id: doc.id, ...doc.data() } as AIBehaviour & { id: string })
      } else if (index === pageSize) {
        nextPageToken = doc.id
      }
    })

    return NextResponse.json(
      {
        behaviours,
        count: behaviours.length,
        nextPageToken,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('GET /api/behaviors error:', error)
    return NextResponse.json({ error: 'Failed to fetch behaviors' }, { status: 500 })
  }
}

/**
 * POST /api/behaviors
 * Create a new AI behavior
 * Body: {
 *   name: string (required)
 *   personality: string (required)
 *   communicationStyle: string (required)
 *   tone: string (required)
 *   responseGuidelines: string[] (optional)
 *   limitations: string[] (optional)
 *   customInstructions: string (optional)
 *   shouldAskClarification: boolean (optional)
 *   shouldProvideExamples: boolean (optional)
 *   shouldIncludeDisclaimer: boolean (optional)
 *   disclaimerText: string (optional)
 *   handoffKeywords: string[] (optional)
 *   handoffPrompt: string (optional)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyFirebaseToken(req)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    const { name, personality, communicationStyle, tone } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    if (!personality || typeof personality !== 'string' || personality.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid personality' }, { status: 400 })
    }

    if (!communicationStyle || typeof communicationStyle !== 'string' || communicationStyle.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid communicationStyle' }, { status: 400 })
    }

    if (!tone || typeof tone !== 'string' || tone.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid tone' }, { status: 400 })
    }

    // Create behavior document
    const behaviourData: Omit<AIBehaviour, 'id'> = {
      userId: auth.uid,
      name: name.trim(),
      personality: personality.trim(),
      communicationStyle: communicationStyle.trim(),
      tone: tone.trim(),
      responseGuidelines: Array.isArray(body.responseGuidelines) ? body.responseGuidelines : [],
      limitations: Array.isArray(body.limitations) ? body.limitations : [],
      customInstructions: body.customInstructions ? String(body.customInstructions).trim() : '',
      shouldAskClarification: body.shouldAskClarification === true,
      shouldProvideExamples: body.shouldProvideExamples === true,
      shouldIncludeDisclaimer: body.shouldIncludeDisclaimer === true,
      disclaimerText: body.disclaimerText ? String(body.disclaimerText).trim() : undefined,
      handoffKeywords: Array.isArray(body.handoffKeywords) ? body.handoffKeywords : undefined,
      handoffPrompt: body.handoffPrompt ? String(body.handoffPrompt).trim() : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await getAdminDb().collection(COLLECTIONS.AI_BEHAVIOURS).add(behaviourData)

    // Log audit
    await getAdminDb().collection(COLLECTIONS.AUDIT_LOGS).add({
      userId: auth.uid,
      action: 'CREATE_BEHAVIOUR',
      resource: 'AI_BEHAVIOUR',
      resourceId: docRef.id,
      changes: { created: behaviourData },
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json(
      {
        behaviourId: docRef.id,
        behaviour: { ...behaviourData, id: docRef.id },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('POST /api/behaviors error:', error)
    return NextResponse.json({ error: 'Failed to create behavior' }, { status: 500 })
  }
}

