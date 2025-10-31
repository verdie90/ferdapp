/**
 * Client-side auth API utilities
 * Handles all communication with auth endpoints
 */

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'user' | 'supervisor' | 'admin' | 'superadmin'
  isActive: boolean
  lastLoginAt?: string
  metadata?: {
    customFields?: {
      registeredFrom?: string
      registeredIp?: string
    }
  }
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: AuthUser
  message?: string
  error?: string
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('authToken')
}

/**
 * Set auth token in localStorage
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('authToken', token)
}

/**
 * Clear auth token from localStorage
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('authToken')
  localStorage.removeItem('authUser')
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const user = localStorage.getItem('authUser')
  return user ? JSON.parse(user) : null
}

/**
 * Set stored user in localStorage
 */
export function setStoredUser(user: AuthUser): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('authUser', JSON.stringify(user))
}

/**
 * Register new user
 */
export async function apiRegister(
  email: string,
  password: string,
  name: string,
  username: string,
  role: string = 'user'
): Promise<AuthResponse> {
  try {
    console.log('[Register] Sending request to /api/auth/register')
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, username, role }),
    })
    
    console.log('[Register] Response status:', response.status)
    console.log('[Register] Response headers:', {
      contentType: response.headers.get('content-type'),
    })
    
    // Try to parse JSON response
    let data
    const contentType = response.headers.get('content-type')
    
    try {
      const text = await response.text()
      console.log('[Register] Response text:', text.substring(0, 500))
      
      if (contentType?.includes('application/json')) {
        data = JSON.parse(text)
      } else {
        console.error('[Register] Non-JSON response received')
        return { success: false, error: `Server error: invalid response format (${contentType})` }
      }
    } catch (parseError) {
      console.error('[Register] Failed to parse response:', parseError)
      return { success: false, error: 'Server error - failed to parse response' }
    }
    
    console.log('[Register] Parsed data:', data)
    
    if (!response.ok) {
      console.error('[Register] Error response:', data)
      return { success: false, error: data.error || 'Registration failed' }
    }
    
    if (data.user) {
      console.log('[Register] Storing user data')
      setStoredUser(data.user)
    }
    
    console.log('[Register] Success')
    return { success: true, ...data }
  } catch (error) {
    console.error('[Register] Caught exception:', error)
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Login user
 */
export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()
    if (!response.ok) return { success: false, error: data.error || 'Login failed' }
    if (data.token && data.user) {
      setAuthToken(data.token)
      setStoredUser(data.user)
    }
    return { success: true, ...data }
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Get current user
 */
export async function apiGetCurrentUser(token?: string): Promise<AuthResponse> {
  try {
    const authToken = token || getAuthToken()
    if (!authToken) return { success: false, error: 'No authentication token found' }
    const response = await fetch('/api/auth/login', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${authToken}` },
    })
    const data = await response.json()
    if (!response.ok) return { success: false, error: data.error || 'Failed to get user' }
    if (data.user) setStoredUser(data.user)
    return { success: true, ...data }
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Change password
 */
export async function apiChangePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
  token?: string
): Promise<AuthResponse> {
  try {
    const authToken = token || getAuthToken()
    if (!authToken) return { success: false, error: 'No authentication token found' }
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    })
    const data = await response.json()
    return response.ok
      ? { success: true, message: 'Password changed successfully', ...data }
      : { success: false, error: data.error || 'Password change failed' }
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Refresh token
 */
export async function apiRefreshToken(token?: string): Promise<AuthResponse> {
  try {
    const authToken = token || getAuthToken()
    if (!authToken) return { success: false, error: 'No authentication token found' }
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
    })
    const data = await response.json()
    if (!response.ok) return { success: false, error: data.error || 'Token refresh failed' }
    if (data.token) setAuthToken(data.token)
    if (data.user) setStoredUser(data.user)
    return { success: true, ...data }
  } catch {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Logout user
 */
export async function apiLogout(token?: string): Promise<AuthResponse> {
  try {
    const authToken = token || getAuthToken()
    if (!authToken) return { success: false, error: 'No authentication token found' }
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
    })
    const data = await response.json()
    clearAuthToken()
    return response.ok
      ? { success: true, message: 'Logged out successfully', ...data }
      : { success: false, error: data.error || 'Logout failed' }
  } catch {
    clearAuthToken()
    return { success: false, error: 'Network error. Please try again.' }
  }
}

/**
 * Make authenticated API request
 */
export async function makeAuthRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  const authToken = token || getAuthToken()
  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    },
  })
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return !!getAuthToken()
}

/**
 * Get error message from error code
 */
export function getErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    INVALID_INPUT: 'Please fill in all required fields',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_USERNAME: 'Username must be 3-20 characters, alphanumeric and underscore only',
    WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, number, and special character',
    EMAIL_ALREADY_EXISTS: 'This email is already registered',
    USERNAME_TAKEN: 'This username is already taken',
    PASSWORD_MISMATCH: 'Passwords do not match',
    SAME_PASSWORD: 'New password must be different from current password',
    INVALID_CREDENTIALS: 'Email or password is incorrect',
    INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
    ACCOUNT_DISABLED: 'Your account has been disabled',
    AUTH_REQUIRED: 'Please log in to continue',
    USER_NOT_FOUND: 'User not found',
    EXTERNAL_API_ERROR: 'Server error. Please try again later',
  }
  return errorMessages[errorCode] || 'An error occurred. Please try again.'
}
