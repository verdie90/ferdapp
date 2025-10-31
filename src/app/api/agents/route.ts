import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { AIAgent } from '@/types/firestore'
import { COLLECTIONS, ERROR_CODES } from '@/constants'

/**
 * GET /api/agents
 * List AI agents for current user
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

    const pageSize = parseInt(request.nextUrl.searchParams.get('pageSize') || '20')
    const pageToken = request.nextUrl.searchParams.get('pageToken')

    let query = getAdminDb()
      .collection(COLLECTIONS.AI_AGENTS)
      .where('userId', '==', auth.uid)
      .orderBy('createdAt', 'desc')
      .limit(pageSize + 1)

    if (pageToken) {
      const lastDoc = await getAdminDb()
        .collection(COLLECTIONS.AI_AGENTS)
        .doc(pageToken)
        .get()
      query = query.startAfter(lastDoc)
    }

    const snapshot = await query.get()
    const agents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<AIAgent & { id: string }>

    const hasMore = agents.length > pageSize
    const data = hasMore ? agents.slice(0, pageSize) : agents
    const nextPageToken = hasMore ? data[data.length - 1]?.id : undefined

    return NextResponse.json(
      {
        success: true,
        agents: data,
        nextPageToken,
        count: data.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agents
 * Create new AI agent
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
    const {
      name,
      description,
      provider,
      model,
      apiKeyEncrypted,
      temperature,
      maxTokens,
      systemPrompt,
      autoReplyEnabled,
      autoReplyKeywords,
      behaviourId,
      knowledgeId,
    } = body

    // Validate required fields
    if (!name || !provider || !model || !apiKeyEncrypted) {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Validate temperature range
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      return NextResponse.json(
        {
          error: 'INVALID_TEMPERATURE',
          message: 'Temperature must be between 0 and 2',
        },
        { status: 400 }
      )
    }

    // Create agent document
    const agentRef = getAdminDb().collection(COLLECTIONS.AI_AGENTS).doc()
    const agent: Omit<AIAgent, 'id'> = {
      userId: auth.uid,
      name,
      description: description || '',
      provider,
      model,
      apiKeyEncrypted,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2000,
      systemPrompt: systemPrompt || '',
      autoReplyEnabled: autoReplyEnabled || false,
      autoReplyKeywords: autoReplyKeywords || [],
      behaviourId,
      knowledgeId,
      isActive: true,
      totalMessages: 0,
      totalCosts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await agentRef.set(agent)

    // Log audit
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'CREATE_AGENT',
        resource: 'AI_AGENTS',
        resourceId: agentRef.id,
        changes: { name, description, provider, model, temperature, maxTokens },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        agentId: agentRef.id,
        agent: { id: agentRef.id, ...agent },
        message: 'Agent created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
