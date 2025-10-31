import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { getAdminDb } from '@/config/firebase-admin'
import { COLLECTIONS } from '@/constants'
import type { AIKnowledge } from '@/types/firestore'

type RouteParams = {
  params: {
    knowledgeId: string
  }
}

/**
 * GET /api/knowledge/[knowledgeId]
 * Retrieve a specific knowledge base by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyFirebaseToken(req)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { knowledgeId } = params

    if (!knowledgeId || typeof knowledgeId !== 'string') {
      return NextResponse.json({ error: 'Invalid knowledgeId' }, { status: 400 })
    }

    const knowledgeSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_KNOWLEDGE)
      .doc(knowledgeId)
      .get()

    if (!knowledgeSnapshot.exists) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
    }

    const knowledge = knowledgeSnapshot.data() as AIKnowledge

    // Verify ownership
    if (knowledge.userId !== auth.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json(
      {
        knowledge: { ...knowledge, id: knowledgeId },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('GET /api/knowledge/[knowledgeId] error:', error)
    return NextResponse.json({ error: 'Failed to fetch knowledge base' }, { status: 500 })
  }
}

/**
 * PUT /api/knowledge/[knowledgeId]
 * Update a specific knowledge base
 * Body: {
 *   name?: string
 *   description?: string
 *   documents?: array of { title, content, url? }
 *   faqs?: array of { question, answer, category? }
 *   productInfo?: array of { name, description, price?, features?, specs? }
 *   policies?: array of { title, content, category?, effectiveDate? }
 *   isActive?: boolean
 * }
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyFirebaseToken(req)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { knowledgeId } = params

    if (!knowledgeId || typeof knowledgeId !== 'string') {
      return NextResponse.json({ error: 'Invalid knowledgeId' }, { status: 400 })
    }

    const knowledgeSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_KNOWLEDGE)
      .doc(knowledgeId)
      .get()

    if (!knowledgeSnapshot.exists) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
    }

    const knowledge = knowledgeSnapshot.data() as AIKnowledge

    // Verify ownership
    if (knowledge.userId !== auth.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()

    // Build update object
    const updateData: Partial<AIKnowledge> = {}

    if ('name' in body && body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
      }
      updateData.name = body.name.trim()
    }

    if ('description' in body && body.description !== undefined) {
      updateData.description = body.description ? String(body.description).trim() : undefined
    }

    if ('isActive' in body && body.isActive !== undefined) {
      updateData.isActive = body.isActive === true
    }

    // Handle documents array
    if ('documents' in body && body.documents !== undefined) {
      if (!Array.isArray(body.documents)) {
        return NextResponse.json({ error: 'Invalid documents' }, { status: 400 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const documents = body.documents.map((doc: any, index: number) => ({
        id: doc.id || `doc-${Date.now()}-${index}`,
        title: String(doc.title || '').trim() || 'Untitled',
        content: String(doc.content || '').trim(),
        uploadedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt : new Date(),
        url: doc.url ? String(doc.url).trim() : undefined,
      }))

      updateData.documents = documents
      updateData.totalDocuments = documents.length
    }

    // Handle FAQs array
    if ('faqs' in body && body.faqs !== undefined) {
      if (!Array.isArray(body.faqs)) {
        return NextResponse.json({ error: 'Invalid faqs' }, { status: 400 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const faqs = body.faqs.map((faq: any, index: number) => ({
        id: faq.id || `faq-${Date.now()}-${index}`,
        question: String(faq.question || '').trim() || 'Untitled',
        answer: String(faq.answer || '').trim(),
        category: faq.category ? String(faq.category).trim() : undefined,
      }))

      updateData.faqs = faqs
      updateData.totalFAQs = faqs.length
    }

    // Handle product info array
    if ('productInfo' in body && body.productInfo !== undefined) {
      if (!Array.isArray(body.productInfo)) {
        return NextResponse.json({ error: 'Invalid productInfo' }, { status: 400 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productInfo = body.productInfo.map((product: any, index: number) => ({
        id: product.id || `product-${Date.now()}-${index}`,
        name: String(product.name || '').trim() || 'Untitled',
        description: String(product.description || '').trim(),
        price: product.price ? Number(product.price) : undefined,
        features: Array.isArray(product.features) ? product.features : undefined,
        specs: product.specs && typeof product.specs === 'object' ? product.specs : undefined,
      }))

      updateData.productInfo = productInfo
      updateData.totalProducts = productInfo.length
    }

    // Handle policies array
    if ('policies' in body && body.policies !== undefined) {
      if (!Array.isArray(body.policies)) {
        return NextResponse.json({ error: 'Invalid policies' }, { status: 400 })
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const policies = body.policies.map((policy: any, index: number) => ({
        id: policy.id || `policy-${Date.now()}-${index}`,
        title: String(policy.title || '').trim() || 'Untitled',
        content: String(policy.content || '').trim(),
        category: policy.category ? String(policy.category).trim() : undefined,
        effectiveDate: policy.effectiveDate instanceof Date ? policy.effectiveDate : undefined,
      }))

      updateData.policies = policies
      updateData.totalPolicies = policies.length
    }

    // Add timestamp
    updateData.updatedAt = new Date()

    // Update document
    await getAdminDb()
      .collection(COLLECTIONS.AI_KNOWLEDGE)
      .doc(knowledgeId)
      .update(updateData)

    // Log audit
    await getAdminDb().collection(COLLECTIONS.AUDIT_LOGS).add({
      userId: auth.uid,
      action: 'UPDATE_KNOWLEDGE',
      resource: 'AI_KNOWLEDGE',
      resourceId: knowledgeId,
      changes: { updated: updateData },
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    })

    // Fetch updated document
    const updatedSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_KNOWLEDGE)
      .doc(knowledgeId)
      .get()

    const updatedKnowledge = updatedSnapshot.data() as AIKnowledge

    return NextResponse.json(
      {
        knowledge: { ...updatedKnowledge, id: knowledgeId },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('PUT /api/knowledge/[knowledgeId] error:', error)
    return NextResponse.json({ error: 'Failed to update knowledge base' }, { status: 500 })
  }
}

/**
 * DELETE /api/knowledge/[knowledgeId]
 * Delete a specific knowledge base
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyFirebaseToken(req)
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { knowledgeId } = params

    if (!knowledgeId || typeof knowledgeId !== 'string') {
      return NextResponse.json({ error: 'Invalid knowledgeId' }, { status: 400 })
    }

    const knowledgeSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_KNOWLEDGE)
      .doc(knowledgeId)
      .get()

    if (!knowledgeSnapshot.exists) {
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 })
    }

    const knowledge = knowledgeSnapshot.data() as AIKnowledge

    // Verify ownership
    if (knowledge.userId !== auth.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete document
    await getAdminDb()
      .collection(COLLECTIONS.AI_KNOWLEDGE)
      .doc(knowledgeId)
      .delete()

    // Log audit
    await getAdminDb().collection(COLLECTIONS.AUDIT_LOGS).add({
      userId: auth.uid,
      action: 'DELETE_KNOWLEDGE',
      resource: 'AI_KNOWLEDGE',
      resourceId: knowledgeId,
      changes: { deleted: knowledge },
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json(
      { message: 'Knowledge base deleted successfully' },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { message: string }
    if (err.message === 'AUTH_REQUIRED') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('DELETE /api/knowledge/[knowledgeId] error:', error)
    return NextResponse.json({ error: 'Failed to delete knowledge base' }, { status: 500 })
  }
}
