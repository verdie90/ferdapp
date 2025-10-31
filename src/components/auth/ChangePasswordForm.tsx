'use client'

import { useState } from 'react'
import { apiChangePassword } from '@/utils/auth-client'
import { validateChangePasswordForm, getPasswordStrength } from '@/utils/form-validation'

interface ChangePasswordFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function ChangePasswordForm({ onSuccess, onError }: ChangePasswordFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }>({})

  const passwordStrength = getPasswordStrength(formData.newPassword)

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
    setSuccess(false)

    // Validate form
    const validation = validateChangePasswordForm(
      formData.currentPassword,
      formData.newPassword,
      formData.confirmPassword
    )

    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      return
    }

    setIsLoading(true)

    try {
      const response = await apiChangePassword(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      )

      if (!response.success) {
        const errorMsg = response.error || 'Password change failed'
        setError(errorMsg)
        onError?.(errorMsg)
        return
      }

      setSuccess(true)
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      onSuccess?.()

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Change Password</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password Field */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100`}
            />
            {fieldErrors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.currentPassword}</p>
            )}
          </div>

          {/* New Password Field */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={isLoading}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.newPassword ? 'border-red-500' : 'border-gray-300'
              } disabled:bg-gray-100`}
            />
            {fieldErrors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.newPassword}</p>
            )}

            {/* Password Strength Indicator */}
            {formData.newPassword && (
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
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
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

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
              ✓ Password changed successfully
            </div>
          )}

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
            {isLoading ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          🔒 <strong>Security:</strong> Your password is hashed with bcrypt (12 salt rounds) before being stored.
        </div>
      </div>
    </div>
  )
}
