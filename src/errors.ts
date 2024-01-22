/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference types="@adonisjs/session/session_middleware" />

import { Exception } from '@poppinss/utils'
import { HttpContext } from '@adonisjs/core/http'

export const E_BAD_CSRF_TOKEN = class InvalidCSRFToken extends Exception {
  code = 'E_BAD_CSRF_TOKEN'
  status = 403
  message = 'Invalid or expired CSRF token'

  async handle(error: InvalidCSRFToken, ctx: HttpContext) {
    ctx.session.flashExcept(['_csrf', '_method', 'password', 'password_confirmation'])
    ctx.session.flashErrors({
      [error.code]: error.message,
    })
    ctx.response.redirect().back()
  }
}
