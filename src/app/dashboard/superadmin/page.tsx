'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'
import { getAuthToken, getStoredUser } from '@/utils/auth-client'

interface DashboardStats {
  totalUsers: number
  totalOrganizations: number
  activeWABAs: number
  messagesThisMonth: number
  successRate: number
  avgResponseTime: number
}

interface User {
  role: string
  name: string
}

export default function SuperadminDashboard() {
  const router = useRouter()
  const [user] = useState<User | null>(() => {
    const storedUser = getStoredUser()
    if (!getAuthToken() || !storedUser || storedUser.role !== 'superadmin') {
      return null
    }
    return storedUser
  })
  const [stats] = useState<DashboardStats>({
    totalUsers: 1250,
    totalOrganizations: 45,
    activeWABAs: 89,
    messagesThisMonth: 54320,
    successRate: 98.7,
    avgResponseTime: 2.3,
  })

  useEffect(() => {
    const storedUser = getStoredUser()
    
    // Check if authenticated
    if (!getAuthToken()) {
      router.push('/auth/login')
      return
    }

    if (!storedUser) {
      router.push('/auth/login')
      return
    }

    // Check if user role matches
    if (storedUser.role !== 'superadmin') {
      router.push(`/dashboard/${storedUser.role}`)
      return
    }
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
      title="System Overview"
      subtitle="Monitor all users, organizations, and messaging metrics"
      userRole={user.role}
      userName={user.name}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalUsers}</p>
            </div>
            <div className="text-4xl text-blue-500">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Organizations</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrganizations}</p>
            </div>
            <div className="text-4xl text-green-500">🏢</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active WABAs</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.activeWABAs}</p>
            </div>
            <div className="text-4xl text-purple-500">📱</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Messages This Month</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {(stats.messagesThisMonth / 1000).toFixed(1)}K
              </p>
            </div>
            <div className="text-4xl text-orange-500">💬</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.successRate}%</p>
            </div>
            <div className="text-4xl text-green-600">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats.avgResponseTime}s</p>
            </div>
            <div className="text-4xl text-blue-600">⚡</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-medium text-gray-800">New Organization Created</p>
              <p className="text-sm text-gray-500">TechCorp Pty Ltd</p>
            </div>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-medium text-gray-800">WABA Verified</p>
              <p className="text-sm text-gray-500">Account ID: 123456789</p>
            </div>
            <span className="text-sm text-gray-500">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">System Alert</p>
              <p className="text-sm text-gray-500">High message volume detected</p>
            </div>
            <span className="text-sm text-gray-500">8 hours ago</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
