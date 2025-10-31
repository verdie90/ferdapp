'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'

interface MessageMetrics {
  date: string
  sent: number
  delivered: number
  read: number
  failed: number
}

export default function MessageMetricsPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<MessageMetrics[]>([])
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

        setUser({
          name: userData.user.name,
          role: userData.user.role,
        })

        // Mock data for last 7 days
        const mockData: MessageMetrics[] = [
          { date: 'Oct 25', sent: 7200, delivered: 6984, read: 6700, failed: 216 },
          { date: 'Oct 26', sent: 7450, delivered: 7216, read: 6894, failed: 234 },
          { date: 'Oct 27', sent: 8100, delivered: 7857, read: 7502, failed: 243 },
          { date: 'Oct 28', sent: 7800, delivered: 7548, read: 7214, failed: 252 },
          { date: 'Oct 29', sent: 8500, delivered: 8245, read: 7884, failed: 255 },
          { date: 'Oct 30', sent: 8900, delivered: 8633, read: 8245, failed: 267 },
          { date: 'Oct 31', sent: 9370, delivered: 9080, read: 8665, failed: 290 },
        ]
        setMetrics(mockData)
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

  const totals = metrics.reduce(
    (acc, m) => ({
      sent: acc.sent + m.sent,
      delivered: acc.delivered + m.delivered,
      read: acc.read + m.read,
      failed: acc.failed + m.failed,
    }),
    { sent: 0, delivered: 0, read: 0, failed: 0 }
  )

  const avgDeliveryRate = ((totals.delivered / totals.sent) * 100).toFixed(1)
  const avgReadRate = ((totals.read / totals.delivered) * 100).toFixed(1)
  const avgFailureRate = ((totals.failed / totals.sent) * 100).toFixed(2)

  return (
    <DashboardLayout
      title="Message Metrics"
      subtitle="Daily message performance tracking and trends"
      userRole={user.role}
      userName={user.name}
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total Sent</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totals.sent.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Avg Delivery Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{avgDeliveryRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Avg Read Rate</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{avgReadRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Avg Failure Rate</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{avgFailureRate}%</p>
        </div>
      </div>

      {/* Daily Detailed Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Daily Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Sent</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Delivered</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Read</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Failed</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Delivery Rate</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, idx) => {
                const deliveryRate = ((metric.delivered / metric.sent) * 100).toFixed(1)
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800 font-medium">{metric.date}</td>
                    <td className="px-6 py-4 text-gray-700">{metric.sent.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-700">{metric.delivered.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-700">{metric.read.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-600 font-medium">{metric.failed}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        parseFloat(deliveryRate) >= 95
                          ? 'bg-green-100 text-green-700'
                          : parseFloat(deliveryRate) >= 90
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {deliveryRate}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
