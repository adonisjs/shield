/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@adonisjs/core/helpers/string'
import { Response } from '@adonisjs/core/http'

/**
 * Sharing CSP nonce with the response
 */
export default function extendHttpResponse() {
  Response.getter(
    'nonce',
    () => {
      return string.generateRandom(16)
    },
    true
  )
}
