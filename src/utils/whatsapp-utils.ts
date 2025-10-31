import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.WHATSAPP_ENCRYPTION_KEY || ''
const ALGORITHM = 'aes-256-cbc'

/**
 * Encrypt a value using AES-256-CBC
 */
export function encryptValue(value: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('WHATSAPP_ENCRYPTION_KEY not set')
  }

  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(value, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Return IV + encrypted data
  return iv.toString('hex') + ':' + encrypted
}

/**
 * Decrypt a value encrypted with encryptValue
 */
export function decryptValue(encryptedValue: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('WHATSAPP_ENCRYPTION_KEY not set')
  }

  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const parts = encryptedValue.split(':')
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Generate a verify token for webhook
 */
export function generateVerifyToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // International format: +[country code][number] (minimum 10 digits total)
  const regex = /^\+\d{1,3}\d{9,14}$/
  return regex.test(phoneNumber.replace(/\s/g, ''))
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return signature === expected
}

/**
 * Generate webhook signature
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}
