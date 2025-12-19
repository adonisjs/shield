/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type {} from 'node:http'
import type { Edge } from 'edge.js'
import type { HttpContext } from '@adonisjs/core/http'

import * as shield from './guards/main.ts'
import type { ShieldConfig } from './types.ts'
import { type Encryption } from '@adonisjs/core/encryption'

/**
 * Module augmentation for AdonisJS HTTP core types.
 * Extends Request and Response interfaces with Shield-specific properties.
 */
declare module '@adonisjs/core/http' {
  /**
   * Extended Request interface with CSRF token support.
   */
  interface HttpRequest {
    /**
     * The CSRF token for the current request.
     * Generated and attached by the CSRF guard for use in forms and AJAX requests.
     *
     * @example
     * // In a controller
     * const token = ctx.request.csrfToken
     *
     * // In a template
     * <input type="hidden" name="_csrf" value="{{ csrfToken }}">
     */
    csrfToken: string
  }

  /**
   * Extended Response interface with CSP nonce support.
   */
  interface HttpResponse {
    /**
     * A cryptographically secure random nonce for Content Security Policy.
     * Used to allow specific inline scripts and styles while maintaining CSP security.
     *
     * @example
     * // In a template
     * <script nonce="{{ cspNonce }}">console.log('Safe inline script')</script>
     */
    nonce: string
  }
}

/**
 * Module augmentation for Node.js HTTP ServerResponse.
 * Extends the native ServerResponse interface to include the nonce property
 * required by the helmet-csp middleware for CSP nonce generation.
 */
declare module 'node:http' {
  /**
   * Extended ServerResponse interface with CSP nonce support.
   */
  export interface ServerResponse {
    /**
     * A cryptographically secure random nonce for Content Security Policy.
     * This property is set by the CSP guard and consumed by the helmet-csp middleware.
     *
     * @example
     * // Set by Shield's CSP guard
     * response.nonce = generateRandomNonce()
     */
    nonce: string
  }
}

/**
 * Shield middleware to protect web applications against common web attacks.
 * Applies multiple security guards including CSRF, CSP, HSTS, frame guard, and content type sniffing protection.
 *
 * @example
 * const middleware = new ShieldMiddleware(config, encryption, edge)
 * router.use(middleware.handle.bind(middleware))
 */
export default class ShieldMiddleware {
  /**
   * Array of security guard functions to be executed on each request
   */
  #guards: ((ctx: HttpContext) => any)[] = []

  /**
   * Creates a new ShieldMiddleware instance with the provided configuration.
   *
   * @param config - Shield configuration object
   * @param encryption - Encryption service for CSRF tokens
   * @param edge - Optional Edge template engine instance
   */
  constructor(config: ShieldConfig, encryption: Encryption, edge?: Edge) {
    this.#guards = [
      shield.csrfFactory(config.csrf || {}, encryption, edge),
      shield.cspFactory(config.csp || {}),
      shield.frameGuardFactory(config.xFrame || {}),
      shield.hstsFactory(config.hsts || {}),
      shield.noSniffFactory(config.contentTypeSniffing || {}),
    ]
  }

  /**
   * Handle incoming HTTP request by applying all configured security guards.
   *
   * @param ctx - HTTP context object
   * @param next - Next middleware function in the chain
   */
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    for (let action of this.#guards) {
      await action(ctx)
    }

    await next()
  }
}
