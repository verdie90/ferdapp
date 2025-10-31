import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/config/firebase-admin'
import { verifyFirebaseToken } from '@/utils/api-auth'
import { AIAgent, AIBehaviour, AIKnowledge } from '@/types/firestore'
import { COLLECTIONS, ERROR_CODES } from '@/constants'

interface ConversationRequest {
  agentId: string
  message: string
  contactId?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

/**
 * POST /api/agents/[agentId]/conversation
 * Send message to AI agent and get response
 */
export async function POST(
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

    const body: ConversationRequest = await request.json()
    const { message, contactId, conversationHistory } = body

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: ERROR_CODES.INVALID_INPUT },
        { status: 400 }
      )
    }

    // Get agent
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

    const agent = agentSnapshot.data() as AIAgent

    // Check ownership and active status
    if (agent.userId !== auth.uid) {
      return NextResponse.json(
        { error: ERROR_CODES.UNAUTHORIZED },
        { status: 403 }
      )
    }

    if (!agent.isActive) {
      return NextResponse.json(
        { error: 'AGENT_INACTIVE' },
        { status: 400 }
      )
    }

    // Build system prompt with behavior injection
    let enhancedSystemPrompt = agent.systemPrompt || 'You are a helpful assistant.'

    if (agent.behaviourId) {
      const behaviourSnapshot = await getAdminDb()
        .collection(COLLECTIONS.AI_BEHAVIOURS)
        .doc(agent.behaviourId)
        .get()

      if (behaviourSnapshot.exists) {
        const behaviour = behaviourSnapshot.data() as AIBehaviour
        enhancedSystemPrompt += `\n\nPersonality: ${behaviour.personality}`
        enhancedSystemPrompt += `\nCommunication Style: ${behaviour.communicationStyle}`
        enhancedSystemPrompt += `\nTone: ${behaviour.tone}`

        if (behaviour.responseGuidelines && behaviour.responseGuidelines.length > 0) {
          enhancedSystemPrompt += `\n\nGuidelines:\n${behaviour.responseGuidelines.join('\n')}`
        }

        if (behaviour.limitations && behaviour.limitations.length > 0) {
          enhancedSystemPrompt += `\n\nLimitations (Do NOT do these):\n${behaviour.limitations.join('\n')}`
        }

        if (behaviour.customInstructions) {
          enhancedSystemPrompt += `\n\nCustom Instructions:\n${behaviour.customInstructions}`
        }

        if (behaviour.shouldIncludeDisclaimer && behaviour.disclaimerText) {
          enhancedSystemPrompt += `\n\nDisclaimer: ${behaviour.disclaimerText}`
        }
      }
    }

    // Build knowledge context if available
    if (agent.knowledgeId) {
      const knowledgeSnapshot = await getAdminDb()
        .collection(COLLECTIONS.AI_KNOWLEDGE)
        .doc(agent.knowledgeId)
        .get()

      if (knowledgeSnapshot.exists) {
        const knowledge = knowledgeSnapshot.data() as AIKnowledge
        const knowledgeText = [
          ...knowledge.documents.map((d) => `${d.title}: ${d.content}`),
          ...knowledge.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`),
          ...knowledge.productInfo.map((p) => `Product: ${p.name} - ${p.description}`),
          ...knowledge.policies.map((p) => `${p.title}: ${p.content}`),
        ].join('\n\n')
        
        enhancedSystemPrompt += `\n\nRelevant Knowledge Base:\n${knowledgeText}`
      }
    }

    // Build messages for API call
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const messages = [
      ...( conversationHistory || []),
      { role: 'user' as const, content: message },
    ]

    // TODO: In production, call actual AI API (OpenAI, Gemini, etc.)
    // This is a mock response for demonstration using the enhanced system prompt
    const mockResponse = `I understand you said: "${message}". This is a mock response from the AI agent "${agent.name}" (${agent.provider}/${agent.model}). System: ${enhancedSystemPrompt.substring(0, 50)}...`

    // Save conversation to database
    const conversationRef = getAdminDb()
      .collection(COLLECTIONS.AI_AGENTS)
      .doc(params.agentId)
      .collection('CONVERSATIONS')
      .doc()

    await conversationRef.set({
      userId: auth.uid,
      contactId: contactId,
      userMessage: message,
      agentResponse: mockResponse,
      temperature: agent.temperature,
      tokensUsed: 150,
      costEstimate: 0.0015,
      timestamp: new Date(),
    })

    // Update agent message count
    await getAdminDb()
      .collection(COLLECTIONS.AI_AGENTS)
      .doc(params.agentId)
      .update({
        totalMessages: (agent.totalMessages || 0) + 1,
        lastUsedAt: new Date(),
      })

    // Log audit
    await getAdminDb()
      .collection(COLLECTIONS.AUDIT_LOGS)
      .add({
        userId: auth.uid,
        action: 'AGENT_MESSAGE',
        resource: 'AI_AGENTS',
        resourceId: params.agentId,
        changes: {
          messageLength: message.length,
          responseLength: mockResponse.length,
          contactId,
        },
        timestamp: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      })

    return NextResponse.json(
      {
        success: true,
        response: mockResponse,
        conversationId: conversationRef.id,
        metadata: {
          agentName: agent.name,
          model: agent.model,
          temperature: agent.temperature,
          tokensUsed: 150,
          costEstimate: 0.0015,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing conversation:', error)
    return NextResponse.json(
      { error: ERROR_CODES.EXTERNAL_API_ERROR },
      { status: 500 }
    )
  }
}
