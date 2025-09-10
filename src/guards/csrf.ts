/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/// <reference types="@adonisjs/session/session_middleware" />
/// <reference path="../shield_middleware.ts" />

import Tokens from 'csrf'
import type { Edge } from 'edge.js'
import type { HttpContext } from '@adonisjs/core/http'
import type { Encryption } from '@adonisjs/core/encryption'

import debug from '../debug.ts'
import { noop } from '../noop.ts'
import type { CsrfOptions } from '../types.ts'
import { E_BAD_CSRF_TOKEN } from '../errors.ts'

/**
 * A class to encapsulate the logic of verifying and generating
 * CSRF tokens.
 */
export class CsrfGuard {
  /**
   * Factory for generate csrf secrets and tokens
   */
  #tokens = new Tokens()

  /**
   * An array of methods on which the CSRF validation should be enforced.
   */
  #allowedMethods: NonNullable<CsrfOptions['methods']>

  /**
   * An array of routes to be ignored from CSRF validation
   */
  #routesToIgnore: NonNullable<CsrfOptions['exceptRoutes']>

  /**
   * Name of the csrf secret key stored inside the session store.
   * The secret key is used to validate the tokens
   */
  #secretSessionKey = 'csrf-secret'

  /**
   * Csrf options
   */
  #options: CsrfOptions

  /**
   * Reference to the encryption module
   */
  #encryption: Encryption

  /**
   * Reference to the view provider
   */
  #edge?: Edge

  /**
   * Creates a new CsrfGuard instance.
   *
   * @param options - CSRF configuration options
   * @param encryption - Encryption service instance
   * @param edge - Optional Edge template engine instance
   */
  constructor(options: CsrfOptions, encryption: Encryption, edge?: Edge) {
    this.#options = options
    this.#encryption = encryption
    this.#edge = edge

    this.#routesToIgnore = this.#options.exceptRoutes || []
    this.#allowedMethods = (this.#options.methods || []).map((method) => method.toLowerCase())
  }

  /**
   * Determines if a request should be validated for CSRF tokens.
   * Checks against allowed methods and routes to ignore.
   *
   * @param ctx - HTTP context object
   */
  #shouldValidateRequest(ctx: HttpContext) {
    /**
     * Do not validate when allowed methods are defined and current
     * method is not part of the allowedlist
     */
    if (
      this.#allowedMethods.length &&
      !this.#allowedMethods.includes(ctx.request.method().toLowerCase())
    ) {
      debug('csrf: ignoring request for "%s" method', ctx.request.method())
      return false
    }

    /**
     * If routesToIgnore is defined as a function
     */
    if (typeof this.#routesToIgnore === 'function') {
      return !this.#routesToIgnore(ctx)
    }

    /**
     * Do not validate when current request route is ignored inside `routesToIgnore`
     * array
     */
    if (this.#routesToIgnore.includes(ctx.route!.pattern)) {
      debug('csrf: ignoring route "%s"', ctx.route!.pattern)
      return false
    }

    return true
  }

  /**
   * Reads CSRF token from one of the following sources:
   * - `_csrf` form input field
   * - `x-csrf-token` request header
   * - `x-xsrf-token` header (when XSRF cookie is enabled)
   *
   * @param ctx - HTTP context object containing the request
   */
  #getCsrfTokenFromRequest({ request }: HttpContext): string | null {
    if (request.input('_csrf')) {
      debug('retrieved token from "_csrf" input')
      return request.input('_csrf')
    }

    if (request.header('x-csrf-token')) {
      debug('retrieved token from "x-csrf-token" header')
      return request.header('x-csrf-token')!
    }

    /**
     * Only entertain header based on cookie value, when `enableXsrfCookie`
     * is enabled
     */
    if (!this.#options.enableXsrfCookie) {
      return null
    }

    const encryptedToken = request.header('x-xsrf-token')
    if (typeof encryptedToken !== 'string' || !encryptedToken) {
      return null
    }

    debug('retrieved token from "x-xsrf-token" header')
    return this.#encryption.decrypt(decodeURIComponent(encryptedToken).slice(2), 'XSRF-TOKEN')
  }

  /**
   * Shares CSRF helper methods with the view engine.
   * Makes csrfToken, csrfMeta(), and csrfField() available in templates.
   *
   * @param ctx - HTTP context object
   */
  #shareCsrfViewLocals(ctx: HttpContext): void {
    if (!ctx.view || !this.#edge) {
      return
    }

    ctx.view.share({
      csrfToken: ctx.request.csrfToken,
      csrfMeta: () => {
        return this.#edge!.globals.html.safe(
          `<meta name='csrf-token' content='${ctx.request.csrfToken}'>`
        )
      },
      csrfField: () => {
        return this.#edge!.globals.html.safe(
          `<input type='hidden' name='_csrf' value='${ctx.request.csrfToken}'>`
        )
      },
    })
  }

  /**
   * Generates a new CSRF token using the CSRF secret extracted from session.
   *
   * @param csrfSecret - The CSRF secret from the user's session
   */
  #generateCsrfToken(csrfSecret: string): string {
    return this.#tokens.create(csrfSecret)
  }

  /**
   * Returns the existing CSRF secret from the session or creates a new one.
   * Newly created secrets are persisted to the session automatically.
   *
   * @param ctx - HTTP context object
   */
  async #getCsrfSecret(ctx: HttpContext): Promise<string> {
    let csrfSecret = ctx.session.get(this.#secretSessionKey)

    if (!csrfSecret) {
      debug('generating new CSRF secret')
      csrfSecret = await this.#tokens.secret()
      ctx.session.put(this.#secretSessionKey, csrfSecret)
    }

    return csrfSecret
  }

  /**
   * Handles CSRF verification for the current request.
   * Gets or creates a CSRF secret, generates a token, optionally sets XSRF cookie,
   * shares helpers with views, and validates the request if required.
   *
   * @param ctx - HTTP context object
   */
  async handle(ctx: HttpContext): Promise<void> {
    const csrfSecret = await this.#getCsrfSecret(ctx)

    /**
     * Add csrf token on the request
     */
    ctx.request.csrfToken = this.#generateCsrfToken(csrfSecret)

    /**
     * Set it as a cookie
     */
    if (this.#options.enableXsrfCookie) {
      ctx.response.encryptedCookie('XSRF-TOKEN', ctx.request.csrfToken, {
        ...this.#options.cookieOptions,
        httpOnly: false,
      })
    }

    /**
     * Share with the view engine
     */
    this.#shareCsrfViewLocals(ctx)

    /**
     * Validate current request before moving forward
     */
    if (this.#shouldValidateRequest(ctx)) {
      const csrfToken = this.#getCsrfTokenFromRequest(ctx)
      if (!csrfToken || !this.#tokens.verify(csrfSecret, csrfToken)) {
        throw new E_BAD_CSRF_TOKEN()
      }
    }
  }
}

/**
 * A factory function that returns a new function to enforce CSRF protection.
 * Creates a CsrfGuard instance and returns its handle method.
 *
 * @param options - CSRF configuration options
 * @param encryption - Encryption service instance
 * @param edge - Optional Edge template engine instance
 *
 * @example
 * const csrfGuard = csrfFactory({
 *   enabled: true,
 *   methods: ['POST', 'PUT', 'DELETE']
 * }, encryption, edge)
 */
export function csrfFactory(options: CsrfOptions, encryption: Encryption, edge?: Edge) {
  if (!options.enabled) {
    return noop
  }

  const csrfGuard = new CsrfGuard(options, encryption, edge)
  return csrfGuard.handle.bind(csrfGuard)
}
