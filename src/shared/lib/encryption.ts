import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET
  if (!secret) {
    throw new Error('API_KEY_ENCRYPTION_SECRET is required for API key encryption')
  }
  return Buffer.from(secret, 'hex')
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns base64 string in format: iv:ciphertext:authTag
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${encrypted}:${authTag.toString('base64')}`
}

/**
 * Decrypts a string encrypted with encrypt().
 * Expects base64 string in format: iv:ciphertext:authTag
 */
export function decrypt(encryptedStr: string): string {
  const key = getEncryptionKey()
  const parts = encryptedStr.split(':')

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format')
  }

  const iv = Buffer.from(parts[0], 'base64')
  const encrypted = parts[1]
  const authTag = Buffer.from(parts[2], 'base64')

  if (iv.length !== IV_LENGTH || authTag.length !== TAG_LENGTH) {
    throw new Error('Invalid IV or auth tag length')
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Returns last 4 characters of a key for display: "...Xf9k"
 */
export function getKeyHint(plainKey: string): string {
  if (plainKey.length < 4) return '****'
  return `...${plainKey.slice(-4)}`
}
