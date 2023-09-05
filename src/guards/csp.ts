/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@adonisjs/core/helpers/string'
import type { ServerResponse, IncomingMessage } from 'node:http'
import { type HttpContext, Response } from '@adonisjs/core/http'
import helmetCsp, { type ContentSecurityPolicyOptions } from 'helmet-csp'

import { noop } from '../noop.js'
import type { CspOptions, ValueOf } from '../types/main.js'

/**
 * Extending response class to have a nonce property
 */
Response.getter(
  'nonce',
  () => {
    return string.generateRandom(16)
  },
  true
)

/**
 * Directives to inspect for the `@nonce` keyword
 */
const DIRECTIVES_WITH_NONCE_KEYWORD = ['defaultSrc', 'scriptSrc', 'styleSrc']

/**
 * Reads `nonce` from the ServerResponse and returns appropriate
 * string
 */
function nonceFn(_: IncomingMessage, response: ServerResponse) {
  return `'nonce-${response.nonce}'`
}

/**
 * Transform `@nonce` keywords for a given directive
 */
function transformNonceKeywords(
  directive: ValueOf<Exclude<ContentSecurityPolicyOptions['directives'], undefined>>
): ValueOf<Exclude<ContentSecurityPolicyOptions['directives'], undefined>> {
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
export function cspFactory(options: CspOptions) {
  if (!options.enabled) {
    return noop
  }

  if (options.directives) {
    /**
     * Transform directives that may contain the
     * "@nonce" directive.
     */
    DIRECTIVES_WITH_NONCE_KEYWORD.forEach((directive) => {
      if (options.directives![directive]) {
        options.directives![directive] = transformNonceKeywords(options.directives![directive])
      }
    })
  }

  /**
   * The types of "helmetCsp" package are messed up
   */
  const helmetCspMiddleware = (helmetCsp as unknown as typeof helmetCsp.default)(options)

  return function csp(ctx: HttpContext) {
    return new Promise<void>((resolve, reject) => {
      /**
       * Helmet csp needs the `nonce` property on the HTTP ServerResponse
       */
      ctx.response.response.nonce = ctx.response.nonce

      /**
       * Optionally share nonce with templates
       */
      if ('view' in ctx) {
        ctx.view.share({ cspNonce: ctx.response.nonce })
      }

      /**
       * Give request to helmet
       */
      helmetCspMiddleware(ctx.response.request, ctx.response.response, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }
}
