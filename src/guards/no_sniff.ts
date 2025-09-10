/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { HttpContext } from '@adonisjs/core/http'
import type { ContentTypeSniffingOptions } from '../types.ts'
import { noop } from '../noop.ts'

/**
 * Factory function that returns a function to add `X-Content-Type-Options`
 * header based upon given user options. Prevents MIME type sniffing attacks.
 *
 * @param options - Content type sniffing configuration options
 *
 * @example
 * const noSniffGuard = noSniffFactory({ enabled: true })
 */
export function noSniffFactory(options: ContentTypeSniffingOptions) {
  if (!options.enabled) {
    return noop
  }

  return function noSniff({ response }: HttpContext) {
    response.header('X-Content-Type-Options', 'nosniff')
  }
}
