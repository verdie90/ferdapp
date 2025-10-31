/**
 * Client-side form validation utilities
 * Matches server-side validation in auth-utils.ts
 */

/**
 * Password strength validation
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!password) {
    errors.push('Password is required')
    return { isValid: false, errors }
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Email validation
 */
export function validateEmail(email: string): {
  isValid: boolean
  error?: string
} {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  return { isValid: true }
}

/**
 * Username validation
 * Requirements:
 * - 3-20 characters
 * - Only alphanumeric and underscore
 */
export function validateUsername(username: string): {
  isValid: boolean
  error?: string
} {
  if (!username) {
    return { isValid: false, error: 'Username is required' }
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' }
  }

  if (username.length > 20) {
    return { isValid: false, error: 'Username must be at most 20 characters' }
  }

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, and underscores',
    }
  }

  return { isValid: true }
}

/**
 * Name validation
 */
export function validateName(name: string): {
  isValid: boolean
  error?: string
} {
  if (!name) {
    return { isValid: false, error: 'Name is required' }
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' }
  }

  if (name.length > 100) {
    return { isValid: false, error: 'Name must be at most 100 characters' }
  }

  return { isValid: true }
}

/**
 * Get password strength indicator
 */
export function getPasswordStrength(password: string): {
  strength: 'weak' | 'fair' | 'good' | 'strong'
  percentage: number
} {
  let score = 0
  const maxScore = 4

  if (!password) {
    return { strength: 'weak', percentage: 0 }
  }

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++

  const percentage = (score / maxScore) * 100
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak'

  if (score === 1) strength = 'weak'
  else if (score === 2) strength = 'fair'
  else if (score === 3) strength = 'good'
  else if (score >= 4) strength = 'strong'

  return { strength, percentage: Math.min(percentage, 100) }
}

/**
 * Validate login form
 */
export function validateLoginForm(email: string, password: string): {
  isValid: boolean
  errors: { email?: string; password?: string }
} {
  const errors: { email?: string; password?: string } = {}

  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error
  }

  if (!password) {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate register form
 */
export function validateRegisterForm(
  email: string,
  password: string,
  name: string,
  username: string,
  confirmPassword: string
): {
  isValid: boolean
  errors: {
    email?: string
    password?: string
    name?: string
    username?: string
    confirmPassword?: string
  }
} {
  const errors: {
    email?: string
    password?: string
    name?: string
    username?: string
    confirmPassword?: string
  } = {}

  const emailValidation = validateEmail(email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors[0]
  }

  const nameValidation = validateName(name)
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error
  }

  const usernameValidation = validateUsername(username)
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.error
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate change password form
 */
export function validateChangePasswordForm(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): {
  isValid: boolean
  errors: {
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  }
} {
  const errors: {
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
  } = {}

  if (!currentPassword) {
    errors.currentPassword = 'Current password is required'
  }

  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.errors[0]
  }

  if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = 'New password must be different from current password'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
