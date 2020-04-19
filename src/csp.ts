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
import { CspOptions } from '@ioc:Adonis/Addons/Shield'
import { SourceListDirective } from 'helmet-csp/dist/lib/types'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { noop } from './noop'

/**
 * Reads `nonce` from the ServerResponse and returns appropriate
 * string
 */
function nonceFn (_: any, response: HttpContextContract['response']['response']) {
  return `'nonce-${response['nonce']}'`
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
 * Factory that returns a function to set the `Content-Security-Policy` header based upon
 * the user config
 */
export function cspFactory (options: CspOptions) {
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

  return function csp ({ response }: HttpContextContract) {
    /**
     * Helmet csp needs the `nonce` property on the HTTP ServerResponse
     */
    response.response['nonce'] = response.nonce
    helmetCspMiddleware(response.request, response.response, () => {})
  }
}
