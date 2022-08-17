/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../../adonis-typings/index.ts" />

import Tokens from 'csrf'
import { ContainerBindings } from '@ioc:Adonis/Core/Application'

/**
 * Define test bindings
 */
export function defineTestsBindings(
  ApiRequest: ContainerBindings['Japa/Preset/ApiRequest'],
  ApiClient: ContainerBindings['Japa/Preset/ApiClient']
) {
  /**
   * Set CSRF token during the HTTP request
   */
  ApiRequest.macro('withCsrfToken', function () {
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

    request.session({ 'csrf-secret': secret })
    request.header('x-csrf-token', token)
  })
}
