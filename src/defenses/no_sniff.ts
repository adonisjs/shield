/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { HttpContext } from '@adonisjs/core/http'
import type { ContentTypeSniffingOptions } from '../types.js'
import { noop } from '../noop.js'

/**
 * Factory function that returns a function to Add `X-Content-Type-Options`
 * header based upon given user options.
 */
export function noSniffFactory(options: ContentTypeSniffingOptions) {
  if (!options.enabled) {
    return noop
  }

  return function noSniff({ response }: HttpContext) {
    response.header('X-Content-Type-Options', 'nosniff')
  }
}
