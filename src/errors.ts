/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference types="@adonisjs/session/session_middleware" />

import type { I18n } from '@adonisjs/i18n'
import { Exception } from '@poppinss/utils'
import { HttpContext } from '@adonisjs/core/http'

export const E_BAD_CSRF_TOKEN = class InvalidCSRFToken extends Exception {
  code = 'E_BAD_CSRF_TOKEN'
  status = 403
  message = 'Invalid or expired CSRF token'
  identifier = 'errors.E_BAD_CSRF_TOKEN'

  /**
   * Returns the message to be sent in the HTTP response.
   * Feel free to override this method and return a custom
   * response.
   */
  getResponseMessage(error: this, ctx: HttpContext) {
    if ('i18n' in ctx) {
      return (ctx.i18n as I18n).t(error.identifier, {}, error.message)
    }
    return error.message
  }

  async handle(error: this, ctx: HttpContext) {
    ctx.session.flashExcept(['_csrf', '_method', 'password', 'password_confirmation'])
    ctx.session.flashErrors({
      [error.code]: this.getResponseMessage(error, ctx),
    })
    ctx.response.redirect().back()
  }
}
