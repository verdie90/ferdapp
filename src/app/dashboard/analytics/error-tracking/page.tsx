'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'

interface ErrorLog {
  id: string
  timestamp: string
  type: string
  message: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  phoneId?: string
  userId?: string
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING'
}

export default function ErrorTrackingPage() {
  const router = useRouter()
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState({ name: '', role: '' })
  const [filter, setFilter] = useState<'all' | 'critical' | 'error' | 'warning'>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const userResponse = await fetch('/api/auth/login', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!userResponse.ok) throw new Error('Auth failed')
        const userData = await userResponse.json()

        if (userData.user.role !== 'admin' && userData.user.role !== 'superadmin') {
          router.push('/dashboard/' + userData.user.role)
          return
        }

        setUser({
          name: userData.user.name,
          role: userData.user.role,
        })

        // Mock error data
        const mockErrors: ErrorLog[] = [
          {
            id: 'err-001',
            timestamp: '2025-10-31 14:32:15',
            type: 'WEBHOOK_SIGNATURE_MISMATCH',
            message: 'Invalid webhook signature received for phone +1-555-0100',
            severity: 'CRITICAL',
            phoneId: '+1-555-0100',
            status: 'ACTIVE',
          },
          {
            id: 'err-002',
            timestamp: '2025-10-31 13:45:22',
            type: 'API_RATE_LIMIT',
            message: 'Rate limit exceeded for account',
            severity: 'ERROR',
            status: 'INVESTIGATING',
          },
          {
            id: 'err-003',
            timestamp: '2025-10-31 12:15:08',
            type: 'MESSAGE_DELIVERY_FAILED',
            message: 'Message delivery failed: Invalid recipient number',
            severity: 'WARNING',
            userId: 'user-123',
            status: 'RESOLVED',
          },
          {
            id: 'err-004',
            timestamp: '2025-10-31 11:22:33',
            type: 'TOKEN_EXPIRATION',
            message: 'Phone access token expired for +1-555-0200',
            severity: 'ERROR',
            phoneId: '+1-555-0200',
            status: 'RESOLVED',
          },
          {
            id: 'err-005',
            timestamp: '2025-10-31 10:05:14',
            type: 'SECURITY_RULE_VIOLATION',
            message: 'Unauthorized access attempt to WHATSAPP_BUSINESS_ACCOUNTS collection',
            severity: 'CRITICAL',
            userId: 'user-456',
            status: 'ACTIVE',
          },
          {
            id: 'err-006',
            timestamp: '2025-10-30 22:18:45',
            type: 'DATABASE_WRITE_FAILED',
            message: 'Failed to write metrics to WHATSAPP_METRICS collection',
            severity: 'ERROR',
            status: 'INVESTIGATING',
          },
        ]
        setErrors(mockErrors)
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const filteredErrors = errors.filter((err) => {
    if (filter === 'all') return true
    return err.severity === filter.toUpperCase()
  })

  const criticalCount = errors.filter((e) => e.severity === 'CRITICAL' && e.status === 'ACTIVE').length
  const errorCount = errors.filter((e) => e.severity === 'ERROR' && e.status === 'ACTIVE').length
  const warningCount = errors.filter((e) => e.severity === 'WARNING' && e.status === 'ACTIVE').length
  const resolvedCount = errors.filter((e) => e.status === 'RESOLVED').length

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-l-4 border-red-500'
      case 'ERROR':
        return 'bg-orange-100 text-orange-700 border-l-4 border-orange-500'
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-700 border-l-4 border-yellow-500'
      default:
        return 'bg-blue-100 text-blue-700 border-l-4 border-blue-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-red-100 text-red-700'
      case 'INVESTIGATING':
        return 'bg-yellow-100 text-yellow-700'
      case 'RESOLVED':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <DashboardLayout
      title="Error Tracking & System Monitoring"
      subtitle="Real-time error tracking and security incident monitoring"
      userRole={user.role}
      userName={user.name}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Critical Issues</p>
          <p className="text-4xl font-bold text-red-600 mt-2">{criticalCount}</p>
          <p className="text-xs text-gray-500 mt-2">Requires immediate attention</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Errors</p>
          <p className="text-4xl font-bold text-orange-600 mt-2">{errorCount}</p>
          <p className="text-xs text-gray-500 mt-2">Active errors</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Warnings</p>
          <p className="text-4xl font-bold text-yellow-600 mt-2">{warningCount}</p>
          <p className="text-xs text-gray-500 mt-2">Warning level</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Resolved</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{resolvedCount}</p>
          <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          All ({errors.length})
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'critical'
              ? 'bg-red-500 text-white'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          Critical ({criticalCount})
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'error'
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          Errors ({errorCount})
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'warning'
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          Warnings ({warningCount})
        </button>
      </div>

      {/* Error Log */}
      <div className="space-y-4">
        {filteredErrors.length > 0 ? (
          filteredErrors.map((error) => (
            <div
              key={error.id}
              className={`p-6 rounded-lg ${getSeverityColor(error.severity)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{error.type}</h3>
                  <p className="text-sm mt-1 opacity-90">{error.message}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ml-4 ${getStatusBadge(error.status)}`}>
                  {error.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm opacity-75 pt-3 border-t border-current border-opacity-20">
                <div>
                  <span className="font-medium">ID:</span> {error.id}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {error.timestamp}
                </div>
                {error.phoneId && (
                  <div>
                    <span className="font-medium">Phone:</span> {error.phoneId}
                  </div>
                )}
                {error.userId && (
                  <div>
                    <span className="font-medium">User:</span> {error.userId}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors text-sm font-medium">
                  View Details
                </button>
                {error.status !== 'RESOLVED' && (
                  <button className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded transition-colors text-sm font-medium">
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-lg text-center">
            <p className="text-gray-500">No errors found in this category</p>
          </div>
        )}
      </div>

      {/* System Health Alert */}
      <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-3">🚨 System Alert</h3>
        <p className="text-red-800 mb-4">
          {criticalCount > 0
            ? `${criticalCount} critical issue(s) detected. Immediate action required.`
            : 'All systems operational. No critical issues detected.'}
        </p>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <>
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                Escalate
              </button>
              <button className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                Contact Support
              </button>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
