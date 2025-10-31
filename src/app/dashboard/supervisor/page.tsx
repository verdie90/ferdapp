'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { getAuthToken, getStoredUser } from '@/utils/auth-client'

interface SupervisorStats {
  totalContacts: number
  activeChats: number
  messagesThisWeek: number
  responseRate: number
  teamMembers: number
  avgResolutionTime: number
}

export default function SupervisorDashboard() {
  const router = useRouter()
  const [user] = useState(getStoredUser())
  const [stats] = useState<SupervisorStats>({
    totalContacts: 450,
    activeChats: 12,
    messagesThisWeek: 3200,
    responseRate: 96.5,
    teamMembers: 5,
    avgResolutionTime: 4.2,
  })

  useEffect(() => {
    console.log('[SupervisorDashboard] useEffect running')
    
    // Check if authenticated
    const token = getAuthToken()
    console.log('[SupervisorDashboard] Token check:', !!token)
    
    if (!token) {
      console.log('[SupervisorDashboard] No token, redirecting to login')
      router.push('/auth/login')
      return
    }

    const storedUser = getStoredUser()
    console.log('[SupervisorDashboard] Stored user:', storedUser)
    
    if (!storedUser) {
      console.log('[SupervisorDashboard] No stored user, redirecting to login')
      router.push('/auth/login')
      return
    }

    // Check if user role matches
    console.log('[SupervisorDashboard] User role:', storedUser.role, 'Expected: supervisor')
    
    if (storedUser.role !== 'supervisor') {
      const redirectUrl = `/dashboard/${storedUser.role}`
      console.log('[SupervisorDashboard] Role mismatch, redirecting to:', redirectUrl)
      router.push(redirectUrl)
      return
    }

    console.log('[SupervisorDashboard] All checks passed')
  }, [router])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Contact & Campaign Management"
      subtitle="Manage contacts, send campaigns, and monitor team performance"
      userRole={user.role}
      userName={user.name}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Contacts</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalContacts}</p>
            </div>
            <div className="text-4xl text-blue-500">📋</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Chats</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.activeChats}</p>
            </div>
            <div className="text-4xl text-green-500">💬</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Messages This Week</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {(stats.messagesThisWeek / 1000).toFixed(1)}K
              </p>
            </div>
            <div className="text-4xl text-purple-500">📊</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Response Rate</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.responseRate}%</p>
            </div>
            <div className="text-4xl text-orange-500">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Team Members</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.teamMembers}</p>
            </div>
            <div className="text-4xl text-blue-600">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Resolution Time</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.avgResolutionTime}h</p>
            </div>
            <div className="text-4xl text-green-600">⚡</div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Alice Johnson</span>
                <span className="font-semibold text-blue-600">145 msgs</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Bob Smith</span>
                <span className="font-semibold text-blue-600">128 msgs</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Carol Lee</span>
                <span className="font-semibold text-blue-600">112 msgs</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left">
              ➕ Import Contacts
            </button>
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-left">
              📢 Create Campaign
            </button>
            <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-left">
              📊 View Reports
            </button>
            <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-left">
              👥 Manage Team
            </button>
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Conversations</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-medium text-gray-800">+1-555-0123</p>
              <p className="text-sm text-gray-500">John Doe - 2 messages</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">Active</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-medium text-gray-800">+1-555-0456</p>
              <p className="text-sm text-gray-500">Jane Smith - 5 messages</p>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">Waiting</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">+1-555-0789</p>
              <p className="text-sm text-gray-500">Bob Wilson - 1 message</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">New</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
