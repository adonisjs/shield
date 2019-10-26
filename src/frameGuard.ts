/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import { XFrameOptions } from '@ioc:Adonis/Addons/Shield'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

const ALLOWED_ACTIONS = ['DENY', 'ALLOW-FROM', 'SAMEORIGIN']

/**
 * Adds `X-Frame-Options` header based upon given user options
 */
export function frameGuard (options: XFrameOptions) {
  if (!options.enabled) {
    return function frameGuardMiddlewareFn (_ctx: HttpContextContract) {
    }
  }

  const action = ((options.action || 'SAMEORIGIN').toUpperCase() as typeof options.action)!
  if (!ALLOWED_ACTIONS.includes(action)) {
    throw new Error('Action must be one of "DENY", "ALLOW-FROM" or "SAMEORGIGIN"')
  }

  if (action === 'ALLOW-FROM' && !options['domain']) {
    throw new Error('Domain value is required when using action as "ALLOW-FROM"')
  }

  const result = action === 'ALLOW-FROM'
    ? `${action} ${options['domain']}`
    : action

  return function frameGuardMiddlewareFn ({ response }: HttpContextContract) {
    response.header('X-Frame-Options', result)
  }
}
