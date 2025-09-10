/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@adonisjs/core/helpers/string'
import type { HttpContext } from '@adonisjs/core/http'

import { noop } from '../noop.ts'
import type { HstsOptions } from '../types.ts'

const DEFAULT_MAX_AGE = 180 * 24 * 60 * 60

/**
 * Normalizes the max age to seconds.
 * Converts string-based time expressions to seconds or uses the provided number.
 *
 * @param maxAge - The max age value as string (e.g., '1 year') or number (seconds)
 */
function normalizeMaxAge(maxAge?: string | number): number {
  if (maxAge === null || maxAge === undefined) {
    return DEFAULT_MAX_AGE
  }

  const maxAgeInSeconds = string.seconds.parse(maxAge)
  if (maxAgeInSeconds < 0) {
    throw new Error('Max age for "shield.hsts" cannot be a negative value')
  }

  return maxAgeInSeconds
}

/**
 * Factory function that returns a new function to add `Strict-Transport-Security`
 * header based upon given user options. Enables HTTPS enforcement for enhanced security.
 *
 * @param options - HSTS configuration options
 *
 * @example
 * const hstsGuard = hstsFactory({
 *   enabled: true,
 *   maxAge: '1 year',
 *   includeSubDomains: true
 * })
 */
export function hstsFactory(options: HstsOptions) {
  if (!options.enabled) {
    return noop
  }

  const maxAge = normalizeMaxAge(options.maxAge)

  let value = `max-age=${maxAge}`
  if (options.includeSubDomains) {
    value += '; includeSubDomains'
  }

  if (options.preload) {
    value += '; preload'
  }

  return function hsts({ response }: HttpContext) {
    response.header('Strict-Transport-Security', value)
  }
}
