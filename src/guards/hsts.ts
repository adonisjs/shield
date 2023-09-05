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

import { noop } from '../noop.js'
import type { HstsOptions } from '../types/main.js'

const DEFAULT_MAX_AGE = 180 * 24 * 60 * 60

/**
 * Normalizes the max age to seconds
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
 * Factory function that returns a new function to Add `Strict-Transport-Security`
 * header based upon given user options.
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
