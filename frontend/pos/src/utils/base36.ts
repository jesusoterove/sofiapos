/**
 * Base-36 encoding/decoding utilities.
 * Uses standard base-36 character set: A-Z (0-25), 0-9 (26-35)
 */

// Base-36 character set: A-Z, 0-9
const BASE36_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/**
 * Encode a number to base-36 string.
 * 
 * @param number - Integer to encode (must be >= 0)
 * @param minLength - Minimum length of output string (padded with 'A' on the left)
 * @returns Base-36 encoded string
 * @throws Error if number is negative
 */
export function encodeBase36(number: number, minLength: number = 0): string {
  if (number < 0) {
    throw new Error('Number must be non-negative')
  }
  let result = ''

  if (number === 0) {
    result = BASE36_CHARS[0]
  }
  else {
    let num = number
    while (num > 0) {
      result = BASE36_CHARS[num % 36] + result
      num = Math.floor(num / 36)
    }
  }

  // Pad with 'Zero' to minimum length
  if (result.length < minLength) {
    result = BASE36_CHARS[0].repeat(minLength - result.length) + result
  }

  return result
}

/**
 * Decode a base-36 string to number.
 * 
 * @param string - Base-36 encoded string (case-insensitive)
 * @returns Decoded integer
 * @throws Error if string contains invalid characters
 */
export function decodeBase36(string: string): number {
  const str = string.toUpperCase()
  let result = 0

  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const index = BASE36_CHARS.indexOf(char)
    if (index === -1) {
      throw new Error(`Invalid base-36 character: ${char}`)
    }
    result = result * 36 + index
  }

  return result
}

/**
 * Encode a number to base-36 and pad to specified width.
 * 
 * @param number - Integer to encode (must be >= 0)
 * @param width - Desired width of output string (padded with 'A' on the left)
 * @returns Base-36 encoded string padded to width
 */
export function padBase36(number: number, width: number): string {
  return encodeBase36(number, width)
}

