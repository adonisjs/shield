/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { HttpContext } from '@adonisjs/core/http'
import type { DnsPrefetchOptions } from '../types.js'
import { noop } from '../noop.js'

/**
 * Factory that returns a function to set `X-DNS-Prefetch-Control` header.
 */
export function dnsPrefetchFactory(options: DnsPrefetchOptions) {
  if (!options.enabled) {
    return noop
  }

  const value = options.allow ? 'on' : 'off'

  return function dnsPrefetch({ response }: HttpContext) {
    response.header('X-DNS-Prefetch-Control', value)
  }
}
