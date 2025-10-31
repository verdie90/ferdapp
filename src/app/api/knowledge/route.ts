import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { getAdminDb } from '@/config/firebase-admin'
import { COLLECTIONS } from '@/constants'
import type { AIKnowledge } from '@/types/firestore'

/**
 * GET /api/knowledge
 * List all knowledge bases for the current user with pagination
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
      .collection(COLLECTIONS.AI_KNOWLEDGE)
      .where('userId', '==', auth.uid)
      .orderBy('createdAt', 'desc')
      .limit(pageSize + 1)

    if (pageToken) {
      const lastDocSnapshot = await getAdminDb()
        .collection(COLLECTIONS.AI_KNOWLEDGE)
        .doc(pageToken)
        .get()
      if (lastDocSnapshot.exists) {
        query = query.startAfter(lastDocSnapshot)
      }
    }

    const snapshot = await query.get()
    const knowledge: (AIKnowledge & { id: string })[] = []
    let nextPageToken: string | null = null

    snapshot.docs.forEach((doc, index) => {
      if (index < pageSize) {
        knowledge.push({ id: doc.id, ...doc.data() } as AIKnowledge & { id: string })
      } else if (index === pageSize) {
        nextPageToken = doc.id
      }
    })

    return NextResponse.json(
      {
        knowledge,
        count: knowledge.length,
        nextPageToken,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('GET /api/knowledge error:', error)
    return NextResponse.json({ error: 'Failed to fetch knowledge bases' }, { status: 500 })
  }
}

/**
 * POST /api/knowledge
 * Create a new knowledge base
 * Body: {
 *   name: string (required)
 *   description: string (optional)
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
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    // Create knowledge base document
    const knowledgeData: Omit<AIKnowledge, 'id'> = {
      userId: auth.uid,
      name: name.trim(),
      description: body.description ? String(body.description).trim() : undefined,
      documents: [],
      faqs: [],
      productInfo: [],
      policies: [],
      vectorEmbeddingsEnabled: false,
      totalDocuments: 0,
      totalFAQs: 0,
      totalProducts: 0,
      totalPolicies: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const docRef = await getAdminDb().collection(COLLECTIONS.AI_KNOWLEDGE).add(knowledgeData)

    // Log audit
    await getAdminDb().collection(COLLECTIONS.AUDIT_LOGS).add({
      userId: auth.uid,
      action: 'CREATE_KNOWLEDGE',
      resource: 'AI_KNOWLEDGE',
      resourceId: docRef.id,
      changes: { created: knowledgeData },
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json(
      {
        knowledgeId: docRef.id,
        knowledge: { ...knowledgeData, id: docRef.id },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('POST /api/knowledge error:', error)
    return NextResponse.json({ error: 'Failed to create knowledge base' }, { status: 500 })
  }
}
