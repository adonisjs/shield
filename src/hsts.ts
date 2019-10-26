/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import ms from 'ms'
import { HstsOptions } from '@ioc:Adonis/Addons/Shield'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { noop } from './noop'

const DEFAULT_MAX_AGE = 180 * 24 * 60 * 60

/**
 * Normalizes the max age to a valid number
 */
function normalizeMaxAge (maxAge?: string | number): number {
  if (maxAge === null || maxAge === undefined) {
    return DEFAULT_MAX_AGE
  }

  maxAge = (typeof (maxAge) === 'string' ? ms(maxAge) : maxAge) as number
  if (maxAge < 0) {
    throw new Error('Max age for shield.hsts cannot be a negative value')
  }

  return maxAge
}

/**
 * Adds `Strict-Transport-Security` header based upon given
 * user options
 */
export function hsts (options: HstsOptions) {
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

  return function hstsMiddlewareFn ({ response }: HttpContextContract) {
    response.header('Strict-Transport-Security', value)
  }
}
