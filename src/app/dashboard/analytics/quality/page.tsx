'use client'

import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useRouter } from 'next/navigation'

interface PhoneQuality {
  phoneNumber: string
  status: string
  qualityRating: number
  deliveryRate: number
  messagesSent: number
  messagesDelivered: number
  avgResponseTime: number
  flaggedCount: number
}

export default function QualityRatingPage() {
  const router = useRouter()
  const [phones, setPhones] = useState<PhoneQuality[]>([])
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

        // Mock quality data
        const mockData: PhoneQuality[] = [
          {
            phoneNumber: '+1-555-0100',
            status: 'CONNECTED',
            qualityRating: 98.5,
            deliveryRate: 98.2,
            messagesSent: 45230,
            messagesDelivered: 44365,
            avgResponseTime: 2.1,
            flaggedCount: 0,
          },
          {
            phoneNumber: '+1-555-0200',
            status: 'CONNECTED',
            qualityRating: 94.2,
            deliveryRate: 93.8,
            messagesSent: 32120,
            messagesDelivered: 30143,
            avgResponseTime: 2.8,
            flaggedCount: 2,
          },
          {
            phoneNumber: '+1-555-0300',
            status: 'CONNECTED',
            qualityRating: 87.1,
            deliveryRate: 86.5,
            messagesSent: 15420,
            messagesDelivered: 13330,
            avgResponseTime: 3.5,
            flaggedCount: 5,
          },
        ]
        setPhones(mockData)
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

  const getQualityBadge = (rating: number) => {
    if (rating >= 95) return { label: 'Excellent', color: 'bg-green-100 text-green-700' }
    if (rating >= 90) return { label: 'Good', color: 'bg-blue-100 text-blue-700' }
    if (rating >= 80) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-700' }
    return { label: 'Poor', color: 'bg-red-100 text-red-700' }
  }

  const avgQuality = (phones.reduce((sum, p) => sum + p.qualityRating, 0) / phones.length).toFixed(1)

  return (
    <DashboardLayout
      title="Phone Number Quality Ratings"
      subtitle="Quality score and performance metrics for each phone number"
      userRole={user.role}
      userName={user.name}
    >
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Average Quality Rating</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{avgQuality}%</p>
          <p className="text-xs text-gray-500 mt-2">Across all phones</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Connected Numbers</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{phones.length}</p>
          <p className="text-xs text-gray-500 mt-2">Active phones</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500 text-sm">Total Flagged Messages</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {phones.reduce((sum, p) => sum + p.flaggedCount, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Across all numbers</p>
        </div>
      </div>

      {/* Phone Details */}
      <div className="space-y-6">
        {phones.map((phone) => {
          const qualityBadge = getQualityBadge(phone.qualityRating)
          return (
            <div key={phone.phoneNumber} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{phone.phoneNumber}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Status:{' '}
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      {phone.status}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${
                    phone.qualityRating >= 95
                      ? 'text-green-600'
                      : phone.qualityRating >= 90
                      ? 'text-blue-600'
                      : phone.qualityRating >= 80
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {phone.qualityRating}%
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${qualityBadge.color}`}>
                    {qualityBadge.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b">
                <div>
                  <p className="text-gray-500 text-sm">Delivery Rate</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{phone.deliveryRate}%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Avg Response Time</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{phone.avgResponseTime}s</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Flagged Messages</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{phone.flaggedCount}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700 font-medium">Messages Delivered</span>
                    <span className="text-gray-700 font-semibold">
                      {phone.messagesDelivered} / {phone.messagesSent}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${(phone.messagesDelivered / phone.messagesSent) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                    View History
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                    View Logs
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quality Improvement Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Quality Improvement Tips</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Send high-quality, compliant messages to maintain sender reputation</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Monitor flagged messages and adjust content if needed</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Avoid sending to invalid or opted-out numbers</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0">✓</span>
            <span>Maintain consistent message volume to avoid rate limiting</span>
          </li>
        </ul>
      </div>
    </DashboardLayout>
  )
}
