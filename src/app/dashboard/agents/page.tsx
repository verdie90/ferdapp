'use client'

import { useEffect, useState } from 'react'
import type { AIAgent } from '@/types/firestore'

interface Agent extends AIAgent {
  id: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: 'openai' as 'openai' | 'gemini',
    model: 'gpt-4',
    apiKeyEncrypted: '',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '',
    autoReplyEnabled: false,
    autoReplyKeywords: '',
    behaviourId: '',
    knowledgeId: '',
  })

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error('Failed to fetch agents')
      const data = await res.json()
      setAgents(data.agents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        provider: formData.provider,
        model: formData.model,
        apiKeyEncrypted: formData.apiKeyEncrypted,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
        systemPrompt: formData.systemPrompt,
        autoReplyEnabled: formData.autoReplyEnabled,
        autoReplyKeywords: formData.autoReplyKeywords
          ? formData.autoReplyKeywords.split(',').map((k) => k.trim())
          : [],
        behaviourId: formData.behaviourId || undefined,
        knowledgeId: formData.knowledgeId || undefined,
      }

      if (editingId) {
        // Update agent
        const res = await fetch(`/api/agents/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update agent')
        setSuccess('Agent updated successfully')
      } else {
        // Create agent
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create agent')
        setSuccess('Agent created successfully')
      }

      // Reset form and fetch updated list
      setShowForm(false)
      setEditingId(null)
      resetForm()
      fetchAgents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleEdit = (agent: Agent) => {
    setFormData({
      name: agent.name,
      description: agent.description || '',
      provider: agent.provider,
      model: agent.model,
      apiKeyEncrypted: agent.apiKeyEncrypted,
      temperature: agent.temperature || 0.7,
      maxTokens: agent.maxTokens || 2000,
      systemPrompt: agent.systemPrompt || '',
      autoReplyEnabled: agent.autoReplyEnabled,
      autoReplyKeywords: agent.autoReplyKeywords?.join(', ') || '',
      behaviourId: agent.behaviourId || '',
      knowledgeId: agent.knowledgeId || '',
    })
    setEditingId(agent.id)
    setShowForm(true)
  }

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return

    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete agent')
      setSuccess('Agent deleted successfully')
      fetchAgents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      provider: 'openai',
      model: 'gpt-4',
      apiKeyEncrypted: '',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '',
      autoReplyEnabled: false,
      autoReplyKeywords: '',
      behaviourId: '',
      knowledgeId: '',
    })
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">Loading agents...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">AI Agents</h1>
            <p className="text-gray-400 mt-1">Manage your AI agents</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(!showForm)
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            {showForm ? 'Cancel' : 'Create Agent'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-900 border border-green-700 rounded-lg text-green-200">{success}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          {showForm && (
            <div className="lg:col-span-1 bg-gray-800 rounded-lg p-6 h-fit">
              <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Agent' : 'Create Agent'}</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Provider *</label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value as 'openai' | 'gemini' })}
                      className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Gemini</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Model *</label>
                    <select
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">API Key (encrypted) *</label>
                  <input
                    type="password"
                    required
                    value={formData.apiKeyEncrypted}
                    onChange={(e) => setFormData({ ...formData, apiKeyEncrypted: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Temperature (0-2)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Tokens</label>
                    <input
                      type="number"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">System Prompt</label>
                  <textarea
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none resize-none h-20"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.autoReplyEnabled}
                      onChange={(e) => setFormData({ ...formData, autoReplyEnabled: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable auto-reply</span>
                  </label>
                </div>

                {formData.autoReplyEnabled && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Auto-reply Keywords (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.autoReplyKeywords}
                      onChange={(e) => setFormData({ ...formData, autoReplyKeywords: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                      placeholder="e.g., help, support, pricing"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Behavior ID (optional)</label>
                  <input
                    type="text"
                    value={formData.behaviourId}
                    onChange={(e) => setFormData({ ...formData, behaviourId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none text-xs"
                    placeholder="Paste behavior ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Knowledge Base ID (optional)</label>
                  <input
                    type="text"
                    value={formData.knowledgeId}
                    onChange={(e) => setFormData({ ...formData, knowledgeId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none text-xs"
                    placeholder="Paste knowledge base ID"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition font-medium"
                >
                  {editingId ? 'Update Agent' : 'Create Agent'}
                </button>
              </form>
            </div>
          )}

          {/* Agents List Section */}
          <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
            {agents.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                <p className="text-lg mb-2">No agents yet</p>
                <p className="text-sm">Create your first AI agent to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {agents.map((agent) => (
                  <div key={agent.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                        {agent.description && <p className="text-gray-400 text-sm">{agent.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(agent)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Provider</span>
                        <p className="font-medium capitalize">{agent.provider}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Model</span>
                        <p className="font-medium">{agent.model}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Temperature</span>
                        <p className="font-medium">{agent.temperature || 0.7}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Messages</span>
                        <p className="font-medium">{agent.totalMessages || 0}</p>
                      </div>
                    </div>

                    {(agent.behaviourId || agent.knowledgeId) && (
                      <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2 text-xs">
                        {agent.behaviourId && (
                          <span className="px-2 py-1 bg-purple-900 text-purple-200 rounded">
                            Behavior: {agent.behaviourId.substring(0, 8)}...
                          </span>
                        )}
                        {agent.knowledgeId && (
                          <span className="px-2 py-1 bg-cyan-900 text-cyan-200 rounded">
                            Knowledge: {agent.knowledgeId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
