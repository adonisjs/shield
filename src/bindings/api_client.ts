/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApiClient, ApiRequest } from '@japa/api-client'
import Tokens from 'csrf'

/**
 * Define test bindings
 */
export async function extendApiClient() {
  /**
   * Set CSRF token during the HTTP request
   */
  ApiRequest.macro('withCsrfToken', function (this: ApiRequest) {
    this['setCsrfToken'] = true
    return this
  })

  ApiClient.setup(async (request) => {
    const setCsrfToken = request['setCsrfToken']
    if (!setCsrfToken) {
      return
    }

    const tokens = new Tokens()
    const secret = await tokens.secret()
    const token = tokens.create(secret)

    // @ts-ignore todo fixme
    request.session({ 'csrf-secret': secret })
    request.header('x-csrf-token', token)
  })
}
