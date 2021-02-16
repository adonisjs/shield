/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference path="../adonis-typings/index.ts" />

import { XSSOptions } from '@ioc:Adonis/Addons/Shield'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { noop } from './noop'

/**
 * A boolean to know if user agent is of IE8
 */
function isOldIE(userAgent?: string) {
  if (!userAgent) {
    return false
  }

  const match = /msie\s*(\d{1,2})/i.exec(userAgent)
  return match ? parseFloat(match[1]) < 9 : false
}

/**
 * Factory function that returns a new function to add `X-Content-Type-Options`
 * header based upon given user options.
 */
export function xssFactory(options: XSSOptions) {
  if (!options.enabled) {
    return noop
  }

  let isBlock = true
  if (options.mode === null) {
    isBlock = false
  }

  let value = '1'
  if (isBlock) {
    value += '; mode=block'
  }

  if (options.reportUri) {
    value += `; report=${options.reportUri}`
  }

  /**
   * Returned when `X-XSS-Protection` is enabled on all browser
   */
  if (options.enableOnOldIE) {
    return function xss({ response }: HttpContextContract) {
      response.header('X-XSS-Protection', value)
    }
  }

  /**
   * Returned when disabled for IE < 9 needs
   */
  return function xss({ request, response }: HttpContextContract) {
    if (isOldIE(request.header('user-agent'))) {
      response.header('X-XSS-Protection', '0')
    } else {
      response.header('X-XSS-Protection', value)
    }
  }
}
