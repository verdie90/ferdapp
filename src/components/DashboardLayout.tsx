'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  userRole: string
  userName: string
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  children,
  userRole,
  userName,
}) => {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navigationLinks = {
    superadmin: [
      { label: 'Dashboard', href: '/dashboard/superadmin' },
      { label: 'Users', href: '/dashboard/superadmin/users' },
      { label: 'Organizations', href: '/dashboard/superadmin/organizations' },
      { label: 'System Metrics', href: '/dashboard/superadmin/metrics' },
      { label: 'Audit Logs', href: '/dashboard/superadmin/audit' },
    ],
    admin: [
      { label: 'Dashboard', href: '/dashboard/admin' },
      { label: 'Team', href: '/dashboard/admin/team' },
      { label: 'WABA Setup', href: '/dashboard/admin/waba' },
      { label: 'Templates', href: '/dashboard/admin/templates' },
      { label: 'Broadcasts', href: '/dashboard/admin/broadcasts' },
    ],
    supervisor: [
      { label: 'Dashboard', href: '/dashboard/supervisor' },
      { label: 'Contacts', href: '/dashboard/supervisor/contacts' },
      { label: 'Messages', href: '/dashboard/supervisor/messages' },
      { label: 'Campaigns', href: '/dashboard/supervisor/campaigns' },
      { label: 'Team Performance', href: '/dashboard/supervisor/team' },
    ],
    user: [
      { label: 'Chat', href: '/dashboard/user/chat' },
      { label: 'My Contacts', href: '/dashboard/user/contacts' },
      { label: 'History', href: '/dashboard/user/history' },
    ],
  }

  const currentLinks = navigationLinks[userRole as keyof typeof navigationLinks] || []

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">FerdApp</h1>
          <p className="text-sm text-gray-600 mt-2 capitalize">{userRole} Dashboard</p>
        </div>

        {/* User Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {currentLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow">
          <div className="px-8 py-4">
            <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
