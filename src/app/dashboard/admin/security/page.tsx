'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'

interface SecurityEvent {
  id: string
  timestamp: string
  eventType: string
  description: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  userId?: string
  ipAddress: string
  action: string
}

interface SecurityMetrics {
  failedAuthAttempts: number
  unauthorizedAccess: number
  ruleViolations: number
  suspiciousActivities: number
  totalEvents: number
}

export default function SecurityMonitoringPage() {
  const router = useRouter()
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedAuthAttempts: 0,
    unauthorizedAccess: 0,
    ruleViolations: 0,
    suspiciousActivities: 0,
    totalEvents: 0,
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState({ name: '', role: '' })

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

        // Mock security events
        const mockEvents: SecurityEvent[] = [
          {
            id: 'sec-001',
            timestamp: '2025-10-31 14:35:12',
            eventType: 'UNAUTHORIZED_ACCESS',
            description: 'Unauthorized attempt to access WHATSAPP_BUSINESS_ACCOUNTS',
            severity: 'HIGH',
            userId: 'user-456',
            ipAddress: '192.168.1.50',
            action: 'BLOCKED',
          },
          {
            id: 'sec-002',
            timestamp: '2025-10-31 13:22:45',
            eventType: 'FAILED_AUTH',
            description: 'Multiple failed login attempts (5 attempts)',
            severity: 'HIGH',
            ipAddress: '203.0.113.45',
            action: 'ACCOUNT_LOCKED',
          },
          {
            id: 'sec-003',
            timestamp: '2025-10-31 12:10:20',
            eventType: 'ROLE_VIOLATION',
            description: 'User attempted to perform admin-only action',
            severity: 'MEDIUM',
            userId: 'user-123',
            ipAddress: '192.168.1.100',
            action: 'DENIED',
          },
          {
            id: 'sec-004',
            timestamp: '2025-10-31 11:45:33',
            eventType: 'SUSPICIOUS_ACTIVITY',
            description: 'Rapid API requests detected (100+ requests/min)',
            severity: 'MEDIUM',
            userId: 'user-789',
            ipAddress: '198.51.100.12',
            action: 'RATE_LIMITED',
          },
          {
            id: 'sec-005',
            timestamp: '2025-10-31 10:15:08',
            eventType: 'UNAUTHORIZED_ACCESS',
            description: 'Attempt to access other user\'s contact data',
            severity: 'HIGH',
            userId: 'user-321',
            ipAddress: '192.168.1.75',
            action: 'BLOCKED',
          },
          {
            id: 'sec-006',
            timestamp: '2025-10-30 20:05:22',
            eventType: 'PRIVILEGED_ACTION',
            description: 'Superadmin deleted multiple users',
            severity: 'LOW',
            userId: 'admin-001',
            ipAddress: '192.168.1.10',
            action: 'LOGGED',
          },
        ]

        setEvents(mockEvents)
        setMetrics({
          failedAuthAttempts: 8,
          unauthorizedAccess: 3,
          ruleViolations: 2,
          suspiciousActivities: 1,
          totalEvents: mockEvents.length,
        })
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

  const highSeverityCount = events.filter((e) => e.severity === 'HIGH').length

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-700'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700'
      case 'LOW':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BLOCKED':
      case 'ACCOUNT_LOCKED':
      case 'DENIED':
        return 'bg-red-100 text-red-700'
      case 'RATE_LIMITED':
        return 'bg-yellow-100 text-yellow-700'
      case 'LOGGED':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <DashboardLayout
      title="Security Monitoring & Incident Response"
      subtitle="Real-time security events and audit trail"
      userRole={user.role}
      userName={user.name}
    >
      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Failed Auth Attempts</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{metrics.failedAuthAttempts}</p>
          <p className="text-xs text-gray-500 mt-2">Today</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-gray-500 text-sm">Unauthorized Access</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{metrics.unauthorizedAccess}</p>
          <p className="text-xs text-gray-500 mt-2">Blocked attempts</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <p className="text-gray-500 text-sm">Rule Violations</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{metrics.ruleViolations}</p>
          <p className="text-xs text-gray-500 mt-2">Last 24h</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-gray-500 text-sm">Suspicious Activities</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{metrics.suspiciousActivities}</p>
          <p className="text-xs text-gray-500 mt-2">Rate limited</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-500 text-sm">Total Events</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{metrics.totalEvents}</p>
          <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
        </div>
      </div>

      {/* Security Status */}
      <div className={`p-6 rounded-lg mb-8 ${
        highSeverityCount > 0
          ? 'bg-red-50 border border-red-200'
          : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`text-lg font-semibold ${
              highSeverityCount > 0 ? 'text-red-900' : 'text-green-900'
            }`}>
              {highSeverityCount > 0 ? '⚠️ Security Alert' : '✅ System Secure'}
            </h3>
            <p className={`text-sm mt-1 ${
              highSeverityCount > 0 ? 'text-red-800' : 'text-green-800'
            }`}>
              {highSeverityCount > 0
                ? `${highSeverityCount} high-severity security event(s) detected`
                : 'No high-severity security events detected'}
            </p>
          </div>
          {highSeverityCount > 0 && (
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
              Review Incidents
            </button>
          )}
        </div>
      </div>

      {/* Security Events Log */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Security Events</h3>
        </div>

        <div className="divide-y">
          {events.map((event) => (
            <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{event.eventType}</h4>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getSeverityColor(event.severity)}`}>
                    {event.severity}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${getActionColor(event.action)}`}>
                    {event.action}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-3 border-t">
                <div>
                  <span className="font-medium">Timestamp:</span> {event.timestamp}
                </div>
                <div>
                  <span className="font-medium">IP Address:</span> {event.ipAddress}
                </div>
                {event.userId && (
                  <div>
                    <span className="font-medium">User ID:</span> {event.userId}
                  </div>
                )}
                <div>
                  <span className="font-medium">Event ID:</span> {event.id}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors">
                  View Details
                </button>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors">
                  Block IP
                </button>
                <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors">
                  Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Best Practices */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🔒 Security Best Practices</h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Review failed authentication attempts regularly and enable MFA for all admin accounts</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Monitor unauthorized access attempts and whitelist trusted IP addresses</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Implement rate limiting to prevent API abuse and DDoS attacks</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Review audit logs regularly for suspicious activities and rule violations</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Maintain strict RBAC policies and regularly review user permissions</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Enable webhook signature verification for all incoming Meta API webhooks</span>
          </li>
        </ul>
      </div>
    </DashboardLayout>
  )
}
