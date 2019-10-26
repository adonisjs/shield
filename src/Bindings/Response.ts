/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import crypto from 'crypto'
import { ResponseConstructorContract } from '@ioc:Adonis/Core/Response'

export default function responseBinding (Response: ResponseConstructorContract) {
  Response.getter('nonce', () => {
    return crypto.randomBytes(16).toString('hex')
  }, true)
}
