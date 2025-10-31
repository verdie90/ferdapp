'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredUser, getAuthToken, apiLogout } from '@/utils/auth-client'

interface UserStats {
  assignedContacts: number
  messagesSent: number
  responsesReceived: number
  averageRating: number
}

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(getStoredUser())
  const [stats] = useState<UserStats>({
    assignedContacts: 3,
    messagesSent: 28,
    responsesReceived: 25,
    averageRating: 4.8,
  })
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mockContacts = [
    { id: '1', name: 'Acme Corporation', phone: '+1-555-0100', lastMessage: 'Thank you!' },
    { id: '2', name: 'TechHub Inc', phone: '+1-555-0200', lastMessage: 'When is delivery?' },
    { id: '3', name: 'Global Services', phone: '+1-555-0300', lastMessage: 'Confirmed' },
  ]

  useEffect(() => {
    // Check if user is authenticated
    if (!getAuthToken()) {
      router.push('/auth/login')
      return
    }

    const storedUser = getStoredUser()
    if (!storedUser) {
      router.push('/auth/login')
      return
    }

    // Check if user role matches
    if (storedUser.role !== 'user') {
      router.push(`/dashboard/${storedUser.role}`)
      return
    }

    setUser(storedUser)
  }, [router])

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await apiLogout()
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome, {user.name}!</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {isLoading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow h-full flex flex-col">
              {/* Chat Header */}
              <div className="border-b p-4 bg-blue-50">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedContact
                    ? mockContacts.find((c) => c.id === selectedContact)?.name || 'Select a contact'
                    : 'Select a contact to start messaging'}
                </h3>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {selectedContact ? (
                  <div className="space-y-4">
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg max-w-xs">
                        Hi! How can I help you today?
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                        I need to check my order status
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg max-w-xs">
                        Of course! Let me look that up for you.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select a contact from the list to view messages
                  </div>
                )}
              </div>

              {/* Message Input */}
              {selectedContact && (
                <div className="border-t p-4 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 text-sm">Assigned Contacts</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.assignedContacts}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Messages Sent</p>
                  <p className="text-2xl font-bold text-green-600">{stats.messagesSent}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Responses</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.responsesReceived}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">⭐ {stats.averageRating}</p>
                </div>
              </div>
            </div>

            {/* Contacts List */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">My Contacts</h3>
              <div className="space-y-2">
                {mockContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedContact === contact.id
                        ? 'bg-blue-100 border-l-4 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-medium text-gray-800">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{contact.lastMessage}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
