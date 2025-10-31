'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiLogin, setAuthToken } from '@/utils/auth-client'
import { validateLoginForm } from '@/utils/form-validation'

interface LoginFormProps {
  onSuccess?: (token: string) => void
  redirectTo?: string
}

// Role-based dashboard routes
const ROLE_DASHBOARD_MAP: Record<string, string> = {
  user: '/dashboard/user',
  supervisor: '/dashboard/supervisor',
  admin: '/dashboard/admin',
  superadmin: '/dashboard/superadmin',
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (fieldErrors.email) {
      setFieldErrors({ ...fieldErrors, email: undefined })
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (fieldErrors.password) {
      setFieldErrors({ ...fieldErrors, password: undefined })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Validate form
    const validation = validateLoginForm(email, password)
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      return
    }

    setIsLoading(true)

    try {
      const response = await apiLogin(email, password)
      
      console.log('[LoginForm] Login response:', {
        success: response.success,
        hasToken: !!response.token,
        hasUser: !!response.user,
        role: response.user?.role,
      })

      if (!response.success) {
        setError(response.error || 'Login failed')
        setIsLoading(false)
        return
      }

      // Store token
      if (response.token) {
        setAuthToken(response.token)
        console.log('[LoginForm] Token stored')
      }

      // Callback if provided
      if (onSuccess && response.token) {
        onSuccess(response.token)
      }

      // Redirect based on role
      if (response.user?.role) {
        const dashboardUrl = ROLE_DASHBOARD_MAP[response.user.role] || '/dashboard'
        console.log('[LoginForm] Redirecting to:', dashboardUrl)
        
        // Use a small timeout to ensure state updates are processed
        setTimeout(() => {
          router.push(dashboardUrl)
        }, 100)
      } else {
        console.log('[LoginForm] No role found, redirecting to default dashboard')
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      }
    } catch (err) {
      console.error('[LoginForm] Error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="your@email.com"
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.email ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100`}
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.password ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100`}
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline font-semibold">
            Register here
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          💡 <strong>Demo Credentials:</strong> Use any email and password meeting the requirements (8+ chars, uppercase, number, special char)
        </div>
      </div>
    </div>
  )
}
