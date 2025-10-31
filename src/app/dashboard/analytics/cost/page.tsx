'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'

interface CostData {
  date: string
  messagesCount: number
  cost: number
}

export default function CostTrackingPage() {
  const router = useRouter()
  const [costs, setCosts] = useState<CostData[]>([])
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

        // Mock cost data
        const mockData: CostData[] = [
          { date: 'Oct 25', messagesCount: 7200, cost: 28.8 },
          { date: 'Oct 26', messagesCount: 7450, cost: 29.8 },
          { date: 'Oct 27', messagesCount: 8100, cost: 32.4 },
          { date: 'Oct 28', messagesCount: 7800, cost: 31.2 },
          { date: 'Oct 29', messagesCount: 8500, cost: 34.0 },
          { date: 'Oct 30', messagesCount: 8900, cost: 35.6 },
          { date: 'Oct 31', messagesCount: 9370, cost: 37.48 },
        ]
        setCosts(mockData)
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

  const totalCost = costs.reduce((sum, c) => sum + c.cost, 0)
  const totalMessages = costs.reduce((sum, c) => sum + c.messagesCount, 0)
  const avgCostPerMessage = (totalCost / totalMessages).toFixed(4)
  const dailyAvgNum = parseFloat((totalCost / costs.length).toFixed(2))
  const estimatedMonthly = (dailyAvgNum * 30).toFixed(2)

  return (
    <DashboardLayout
      title="Cost Tracking"
      subtitle="Daily cost analysis and billing projections"
      userRole={user.role}
      userName={user.name}
    >
      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">7-Day Total Cost</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">${totalCost.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Daily Average</p>
          <p className="text-3xl font-bold text-green-600 mt-2">${dailyAvgNum.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Average per day</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Estimated Monthly</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">${estimatedMonthly}</p>
          <p className="text-xs text-gray-500 mt-2">At current rate</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Cost Per Message</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">${avgCostPerMessage}</p>
          <p className="text-xs text-gray-500 mt-2">Average rate</p>
        </div>
      </div>

      {/* Cost Trend Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Daily Cost Trend</h3>
        <div className="space-y-4">
          {costs.map((cost, idx) => {
            const maxCost = Math.max(...costs.map((c) => c.cost))
            const percentage = (cost.cost / maxCost) * 100
            return (
              <div key={idx}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700 font-medium">{cost.date}</span>
                  <span className="text-gray-700 font-semibold">${cost.cost.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-linear-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {cost.messagesCount.toLocaleString()} messages
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cost Breakdown by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Cost by Message Type</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <p className="font-medium text-gray-800">Text Messages</p>
                <p className="text-sm text-gray-500">Standard SMS</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">$56.32</p>
                <p className="text-sm text-gray-500">44%</p>
              </div>
            </div>
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <p className="font-medium text-gray-800">Template Messages</p>
                <p className="text-sm text-gray-500">Pre-approved</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">$47.28</p>
                <p className="text-sm text-gray-500">37%</p>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">Media Messages</p>
                <p className="text-sm text-gray-500">Images & files</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">$24.70</p>
                <p className="text-sm text-gray-500">19%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Spending Days</h3>
          <div className="space-y-3">
            {[...costs]
              .sort((a, b) => b.cost - a.cost)
              .slice(0, 5)
              .map((cost, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{cost.date}</p>
                      <p className="text-sm text-gray-500">{cost.messagesCount.toLocaleString()} messages</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-800">${cost.cost.toFixed(2)}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
