/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { HttpContext } from '@adonisjs/core/http'

import { noop } from '../noop.js'
import { XFrameOptions } from '../types.js'

const ALLOWED_ACTIONS = ['DENY', 'ALLOW-FROM', 'SAMEORIGIN']

/**
 * Factory function that returns a function to set `X-Frame-Options` header
 * based upon given user options.
 */
export function frameGuardFactory(options: XFrameOptions) {
  if (!options.enabled) {
    return noop
  }

  const action = options.action || ('SAMEORIGIN' as const)
  const resolvedOptions = { ...options, action } as Required<XFrameOptions>

  if (!ALLOWED_ACTIONS.includes(resolvedOptions.action)) {
    throw new Error('frameGuard: Action must be one of "DENY", "ALLOW-FROM" or "SAMEORGIGIN"')
  }

  if (resolvedOptions.action === 'ALLOW-FROM' && !resolvedOptions['domain']) {
    throw new Error('frameGuard: Domain value is required when using action as "ALLOW-FROM"')
  }

  const result =
    resolvedOptions.action === 'ALLOW-FROM' ? `${action} ${resolvedOptions['domain']}` : action

  return function frameGuard({ response }: HttpContext) {
    response.header('X-Frame-Options', result)
  }
}
