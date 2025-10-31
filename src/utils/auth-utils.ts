import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

/**
 * Hash password using bcrypt
 * @param password - Plain text password
 * @returns Promise resolving to bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    return hash
  } catch (error) {
    console.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }
}

/**
 * Verify password against bcrypt hash
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash from database
 * @returns Promise resolving to boolean
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(password, hash)
    return isMatch
  } catch (error) {
    console.error('Error verifying password:', error)
    return false
  }
}

/**
 * Validate password strength
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */
export function isStrongPassword(password: string): boolean {
  const minLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)

  return minLength && hasUpperCase && hasNumber && hasSpecial
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate username (alphanumeric + underscore, 3-20 chars)
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}
