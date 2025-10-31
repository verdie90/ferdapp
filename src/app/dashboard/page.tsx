'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    const redirectToDashboard = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch('/api/auth/login', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          router.push('/login')
          return
        }

        const data = await response.json()
        const role = data.user?.role

        if (role) {
          router.push(`/dashboard/${role}`)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error:', error)
        router.push('/login')
      }
    }

    redirectToDashboard()
  }, [router])

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
