/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference types="@adonisjs/session/plugins/api_client" />

import Tokens from 'csrf'
import { type PluginFn } from '@japa/runner/types'
import { ApiClient, ApiRequest } from '@japa/api-client'

const CSRF_ENABLED = Symbol.for('CSRF_ENABLED')

declare module '@japa/api-client' {
  export interface ApiRequest {
    [CSRF_ENABLED]: boolean
    withCsrfToken(): this
  }
}

/**
 * Configures the API client plugin to support CSRF tokens.
 * Adds a `withCsrfToken()` method to API requests that automatically
 * generates and includes CSRF tokens for testing.
 *
 * @example
 * const plugin = shieldApiClient()
 *
 * test('authenticated request', async ({ client }) => {
 *   const response = await client
 *     .post('/api/users')
 *     .withCsrfToken()
 *     .json({ name: 'John' })
 * })
 */
export const shieldApiClient = () => {
  const pluginFn: PluginFn = function () {
    ApiRequest.macro('withCsrfToken', function (this: ApiRequest) {
      this[CSRF_ENABLED] = true
      return this
    })

    ApiClient.setup(async (request) => {
      const isCSRFEnabled = request[CSRF_ENABLED]
      if (!isCSRFEnabled) {
        return
      }

      const tokens = new Tokens()
      const secret = await tokens.secret()
      const token = tokens.create(secret)

      request.withSession({ 'csrf-secret': secret })
      request.header('x-csrf-token', token)
    })
  }

  return pluginFn
}
