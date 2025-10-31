'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiRegister, setAuthToken } from '@/utils/auth-client'
import { validateRegisterForm, getPasswordStrength } from '@/utils/form-validation'

interface RegisterFormProps {
  onSuccess?: (token: string) => void
  redirectTo?: string
}

export function RegisterForm({ onSuccess, redirectTo = '/dashboard' }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    username: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
    name?: string
    username?: string
    confirmPassword?: string
  }>({})

  const passwordStrength = getPasswordStrength(formData.password)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Validate form
    const validation = validateRegisterForm(
      formData.email,
      formData.password,
      formData.name,
      formData.username,
      formData.confirmPassword
    )

    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      return
    }

    setIsLoading(true)

    try {
      const response = await apiRegister(
        formData.email,
        formData.password,
        formData.name,
        formData.username,
        'user'
      )

      if (!response.success) {
        setError(response.error || 'Registration failed')
        return
      }

      if (response.token) {
        setAuthToken(response.token)
      }

      if (onSuccess && response.token) {
        onSuccess(response.token)
      } else if (redirectTo) {
        window.location.href = redirectTo
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Register</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.name ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100`}
            />
            {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.username ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100`}
            />
            {fieldErrors.username && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.username}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">3-20 characters, letters/numbers/underscore only</p>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.password ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100`}
            />
            {fieldErrors.password && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
            )}

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">Password Strength:</span>
                  <span
                    className={`text-xs font-semibold ${
                      passwordStrength.strength === 'weak'
                        ? 'text-red-600'
                        : passwordStrength.strength === 'fair'
                          ? 'text-yellow-600'
                          : passwordStrength.strength === 'good'
                            ? 'text-blue-600'
                            : 'text-green-600'
                    }`}
                  >
                    {passwordStrength.strength.toUpperCase()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      passwordStrength.strength === 'weak'
                        ? 'bg-red-500'
                        : passwordStrength.strength === 'fair'
                          ? 'bg-yellow-500'
                          : passwordStrength.strength === 'good'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                    }`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ✓ 8+ characters &nbsp; ✓ Uppercase &nbsp; ✓ Number &nbsp; ✓ Special char
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100`}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
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
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-semibold">
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
