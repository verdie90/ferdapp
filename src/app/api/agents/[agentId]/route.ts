import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { AIAgent } from '@/types/firestore'
import { COLLECTIONS, ERROR_CODES } from '@/constants'

/**
 * GET /api/agents/[agentId]
 * Get specific agent by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const auth = await verifyFirebaseToken(request)
    if (!auth) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const agentSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_AGENTS)
      .doc(params.agentId)
      .get()

    if (!agentSnapshot.exists) {
      return NextResponse.json(
        { error: 'AGENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    const agentData = agentSnapshot.data() as AIAgent

    // Check ownership
    if (agentData.userId !== auth.uid) {
      return NextResponse.json(
        { error: ERROR_CODES.UNAUTHORIZED },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        agent: {
          ...agentData,
          id: agentSnapshot.id,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching agent:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/agents/[agentId]
 * Update agent
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const auth = await verifyFirebaseToken(request)
    if (!auth) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const agentSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_AGENTS)
      .doc(params.agentId)
      .get()

    if (!agentSnapshot.exists) {
      return NextResponse.json(
        { error: 'AGENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    const agentData = agentSnapshot.data() as AIAgent

    // Check ownership
    if (agentData.userId !== auth.uid) {
      return NextResponse.json(
        { error: ERROR_CODES.UNAUTHORIZED },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      temperature,
      maxTokens,
      systemPrompt,
      autoReplyEnabled,
      autoReplyKeywords,
      behaviourId,
      knowledgeId,
      isActive,
    } = body

    // Build update object with only provided fields
    const updateData: Partial<AIAgent> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (temperature !== undefined) {
      if (temperature < 0 || temperature > 2) {
        return NextResponse.json(
          {
            error: 'INVALID_TEMPERATURE',
            message: 'Temperature must be between 0 and 2',
          },
          { status: 400 }
        )
      }
      updateData.temperature = temperature
    }
    if (maxTokens !== undefined) updateData.maxTokens = maxTokens
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt
    if (autoReplyEnabled !== undefined) updateData.autoReplyEnabled = autoReplyEnabled
    if (autoReplyKeywords !== undefined) updateData.autoReplyKeywords = autoReplyKeywords
    if (behaviourId !== undefined) updateData.behaviourId = behaviourId
    if (knowledgeId !== undefined) updateData.knowledgeId = knowledgeId
    if (isActive !== undefined) updateData.isActive = isActive

    updateData.updatedAt = new Date()

    await getAdminDb()
      .collection(COLLECTIONS.AI_AGENTS)
      .doc(params.agentId)
      .update(updateData)

    // Log audit
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'UPDATE_AGENT',
        resource: 'AI_AGENTS',
        resourceId: params.agentId,
        changes: updateData,
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        agent: {
          ...agentData,
          ...updateData,
          id: params.agentId,
        },
        message: 'Agent updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating agent:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/agents/[agentId]
 * Delete agent
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { agentId: string } }
) {
  try {
    const auth = await verifyFirebaseToken(request)
    if (!auth) {
      return NextResponse.json(
        { error: ERROR_CODES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const agentSnapshot = await getAdminDb()
      .collection(COLLECTIONS.AI_AGENTS)
      .doc(params.agentId)
      .get()

    if (!agentSnapshot.exists) {
      return NextResponse.json(
        { error: 'AGENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    const agentData = agentSnapshot.data() as AIAgent

    // Check ownership
    if (agentData.userId !== auth.uid) {
      return NextResponse.json(
        { error: ERROR_CODES.UNAUTHORIZED },
        { status: 403 }
      )
    }

    // Soft delete by marking inactive
    await getAdminDb()
      .collection(COLLECTIONS.AI_AGENTS)
      .doc(params.agentId)
      .update({
        isActive: false,
        updatedAt: new Date(),
      })

    // Log audit
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'DELETE_AGENT',
        resource: 'AI_AGENTS',
        resourceId: params.agentId,
        changes: { isActive: false },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        message: 'Agent deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
