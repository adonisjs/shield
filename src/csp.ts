/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import helmetCsp from 'helmet-csp'
import { SourceListDirective } from 'helmet-csp/dist/lib/types'

import { CspOptions } from '@ioc:Adonis/Addons/Shield'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { noop } from './noop'

/**
 * Reads `nonce` from the ServerResponse and returns appropriate
 * string
 */
function nonceFn (_req, res) {
  return `'nonce-${res['nonce']}'`
}

/**
 * Transform `@nonce` keywords for a given directive
 */
function transformNonceKeywords (directive: SourceListDirective): SourceListDirective {
  /**
   * Transform array values. There should be only one `@nonce` keyword
   */
  if (Array.isArray(directive)) {
    const nonceIndex = directive.indexOf('@nonce')
    if (nonceIndex > -1) {
      directive[nonceIndex] = nonceFn
    }
  }

  return directive
}

/**
 * Adds `Content-Security-Policy` header based upon given user options
 */
export function csp (options: CspOptions) {
  if (!options.enabled) {
    return noop
  }

  const scriptSrc = options.directives && options.directives.scriptSrc
  if (scriptSrc) {
    options.directives!.scriptSrc = transformNonceKeywords(options.directives!.scriptSrc!)
  }

  const styleSrc = options.directives && options.directives.styleSrc
  if (styleSrc) {
    options.directives!.styleSrc = transformNonceKeywords(options.directives!.styleSrc!)
  }

  const helmetCspMiddleware = helmetCsp(options)
  return function cspMiddlewareFn ({ response }: HttpContextContract) {
    response.response['nonce'] = response.nonce
    helmetCspMiddleware(response.request, response.response, () => {})
  }
}
