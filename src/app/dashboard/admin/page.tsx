'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { getAuthToken, getStoredUser } from '@/utils/auth-client'

interface AdminStats {
  teamMembers: number
  activeWABAs: number
  phoneNumbers: number
  messageTemplates: number
  sentThisMonth: number
  failureRate: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user] = useState(getStoredUser())
  const [stats] = useState<AdminStats>({
    teamMembers: 12,
    activeWABAs: 3,
    phoneNumbers: 8,
    messageTemplates: 24,
    sentThisMonth: 12540,
    failureRate: 1.2,
  })

  useEffect(() => {
    console.log('[AdminDashboard] useEffect running')
    
    // Check if authenticated
    const token = getAuthToken()
    console.log('[AdminDashboard] Token check:', !!token)
    
    if (!token) {
      console.log('[AdminDashboard] No token, redirecting to login')
      router.push('/auth/login')
      return
    }

    const storedUser = getStoredUser()
    console.log('[AdminDashboard] Stored user:', storedUser)
    
    if (!storedUser) {
      console.log('[AdminDashboard] No stored user, redirecting to login')
      router.push('/auth/login')
      return
    }

    // Check if user role matches
    console.log('[AdminDashboard] User role:', storedUser.role, 'Expected: admin')
    
    if (storedUser.role !== 'admin') {
      const redirectUrl = `/dashboard/${storedUser.role}`
      console.log('[AdminDashboard] Role mismatch, redirecting to:', redirectUrl)
      router.push(redirectUrl)
      return
    }

    console.log('[AdminDashboard] All checks passed')
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
      title="Team & Account Management"
      subtitle="Manage team members, WABAs, phone numbers, and templates"
      userRole={user.role}
      userName={user.name}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Team Members</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.teamMembers}</p>
            </div>
            <div className="text-4xl text-blue-500">👨‍💼</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active WABAs</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.activeWABAs}</p>
            </div>
            <div className="text-4xl text-green-500">📱</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Phone Numbers</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.phoneNumbers}</p>
            </div>
            <div className="text-4xl text-purple-500">☎️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Message Templates</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.messageTemplates}</p>
            </div>
            <div className="text-4xl text-orange-500">📄</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Messages Sent</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {(stats.sentThisMonth / 1000).toFixed(1)}K
              </p>
            </div>
            <div className="text-4xl text-blue-600">📤</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Failure Rate</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.failureRate}%</p>
            </div>
            <div className="text-4xl text-red-500">⚠️</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-left">
              ➕ Add Team Member
            </button>
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-left">
              ➕ Register WABA
            </button>
            <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-left">
              ➕ Add Phone Number
            </button>
            <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-left">
              ➕ Create Template
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">WABA Verification</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">Verified</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Phone Quality Rating</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">Excellent</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">API Limits</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">80% Used</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Billing Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">Active</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
