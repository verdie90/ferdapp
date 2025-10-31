'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'

interface MetricsData {
  messagesAnalytics: {
    total: number
    sent: number
    delivered: number
    read: number
    failed: number
  }
  deliveryStats: {
    rate: number
    avgDeliveryTime: number
  }
  costData: {
    dailyAvg: number
    monthlyTotal: number
    estimatedMonthly: number
  }
}

export default function AnalyticsDashboard() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<MetricsData>({
    messagesAnalytics: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
    deliveryStats: { rate: 0, avgDeliveryTime: 0 },
    costData: { dailyAvg: 0, monthlyTotal: 0, estimatedMonthly: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState({ name: '', role: '' })
  const [timeRange, setTimeRange] = useState('30')

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

        // Mock analytics data - in production, fetch from API
        setMetrics({
          messagesAnalytics: {
            total: 54320,
            sent: 52100,
            delivered: 50420,
            read: 48300,
            failed: 1680,
          },
          deliveryStats: {
            rate: 96.8,
            avgDeliveryTime: 2.3,
          },
          costData: {
            dailyAvg: 42.5,
            monthlyTotal: 1275,
            estimatedMonthly: 1360,
          },
        })
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const { messagesAnalytics, deliveryStats, costData } = metrics
  const readRate = messagesAnalytics.total > 0
    ? ((messagesAnalytics.read / messagesAnalytics.total) * 100).toFixed(1)
    : 0

  return (
    <DashboardLayout
      title="Analytics Dashboard"
      subtitle="Comprehensive metrics, cost tracking, and performance analysis"
      userRole={user.role}
      userName={user.name}
    >
      {/* Time Range Selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTimeRange('7')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            timeRange === '7'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setTimeRange('30')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            timeRange === '30'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          30 Days
        </button>
        <button
          onClick={() => setTimeRange('90')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            timeRange === '90'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border hover:bg-gray-50'
          }`}
        >
          90 Days
        </button>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total Messages</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {(messagesAnalytics.total / 1000).toFixed(1)}K
          </p>
          <p className="text-xs text-gray-500 mt-2">↑ 12% from last period</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Delivery Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{deliveryStats.rate}%</p>
          <p className="text-xs text-gray-500 mt-2">↑ 2.3% improvement</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Read Rate</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{readRate}%</p>
          <p className="text-xs text-gray-500 mt-2">↑ 3.1% improvement</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Avg Delivery Time</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{deliveryStats.avgDeliveryTime}s</p>
          <p className="text-xs text-gray-500 mt-2">↓ 0.5s faster</p>
        </div>
      </div>

      {/* Message Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Message Status Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">Delivered</span>
                <span className="text-gray-700 font-semibold">{messagesAnalytics.delivered}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: `${(messagesAnalytics.delivered / messagesAnalytics.total) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {((messagesAnalytics.delivered / messagesAnalytics.total) * 100).toFixed(1)}%
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">Read</span>
                <span className="text-gray-700 font-semibold">{messagesAnalytics.read}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{
                    width: `${(messagesAnalytics.read / messagesAnalytics.total) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {((messagesAnalytics.read / messagesAnalytics.total) * 100).toFixed(1)}%
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700 font-medium">Failed</span>
                <span className="text-gray-700 font-semibold">{messagesAnalytics.failed}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{
                    width: `${(messagesAnalytics.failed / messagesAnalytics.total) * 100}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {((messagesAnalytics.failed / messagesAnalytics.total) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Hourly Distribution Chart Placeholder */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Messages by Hour (Peak Times)</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="w-12 text-gray-700 text-sm">00:00</span>
              <div className="flex-1 bg-gray-200 h-8 rounded flex items-center" style={{ width: '20%' }}>
                <div className="bg-blue-500 h-full rounded" style={{ width: '30%' }}></div>
              </div>
              <span className="text-gray-600 text-sm">234 msgs</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-12 text-gray-700 text-sm">06:00</span>
              <div className="flex-1 bg-gray-200 h-8 rounded flex items-center">
                <div className="bg-blue-500 h-full rounded" style={{ width: '75%' }}></div>
              </div>
              <span className="text-gray-600 text-sm">3,421 msgs</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-12 text-gray-700 text-sm">12:00</span>
              <div className="flex-1 bg-gray-200 h-8 rounded flex items-center">
                <div className="bg-blue-500 h-full rounded" style={{ width: '100%' }}></div>
              </div>
              <span className="text-gray-600 text-sm">5,842 msgs</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-12 text-gray-700 text-sm">18:00</span>
              <div className="flex-1 bg-gray-200 h-8 rounded flex items-center">
                <div className="bg-blue-500 h-full rounded" style={{ width: '85%' }}></div>
              </div>
              <span className="text-gray-600 text-sm">4,932 msgs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Cost Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-700">Daily Average</span>
              <span className="text-2xl font-bold text-blue-600">${costData.dailyAvg.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-700">This Month (Current)</span>
              <span className="text-2xl font-bold text-green-600">${costData.monthlyTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <span className="text-gray-700">Estimated Monthly</span>
              <span className="text-2xl font-bold text-orange-600">${costData.estimatedMonthly.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Cost Per Message</span>
              <span className="text-xl font-bold text-purple-600">
                ${(costData.monthlyTotal / messagesAnalytics.total).toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Quality Rating by Phone</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <p className="font-medium text-gray-800">+1-555-0100</p>
                <p className="text-xs text-gray-500">Primary Phone</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">Excellent</p>
                <p className="text-sm text-gray-500">98.5%</p>
              </div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <p className="font-medium text-gray-800">+1-555-0200</p>
                <p className="text-xs text-gray-500">Secondary</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">Good</p>
                <p className="text-sm text-gray-500">94.2%</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">+1-555-0300</p>
                <p className="text-xs text-gray-500">Testing</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-600">Fair</p>
                <p className="text-sm text-gray-500">87.1%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
