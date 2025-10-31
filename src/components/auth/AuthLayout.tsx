'use client'

import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function AuthLayout({ children, title = 'FerdApp', subtitle = 'WhatsApp + AI Agent Management' }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">F</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2025 FerdApp. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
