/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import helmetCsp from 'helmet-csp'
import string from '@adonisjs/core/helpers/string'
import { type HttpContext } from '@adonisjs/core/http'

import { noop } from '../../noop.js'
import { cspKeywords } from './keywords.js'
import type { CspOptions } from '../../types.js'

/**
 * Registering nonce keyword
 */
cspKeywords.register('@nonce', function (_, response) {
  return `'nonce-${response.nonce}'`
})

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
     * Transform directives to replace keywords
     */
    Object.keys(options.directives).forEach((directive) => {
      options.directives![directive] = cspKeywords.resolve(options.directives![directive])
    })
  }

  /**
   * The types of "helmetCsp" package are messed up
   */
  const helmetCspMiddleware = (helmetCsp as unknown as typeof helmetCsp.default)(options)

  return function csp(ctx: HttpContext) {
    return new Promise<void>((resolve, reject) => {
      /**
       * Generating nonce
       */
      ctx.response.nonce = string.generateRandom(16)

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
