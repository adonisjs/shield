/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import Tokens from 'csrf'
import { unpack } from '@poppinss/cookie'
import { Exception } from '@poppinss/utils'
import { CsrfOptions } from '@ioc:Adonis/Addons/Shield'
import { RequestContract } from '@ioc:Adonis/Core/Request'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { noop } from './noop'

/**
 * A class to encapsulate the logic of verifying and generating
 * CSRF tokens.
 */
export class Csrf {
  /**
   * Factory for generate csrf secrets and tokens
   */
  private tokens = new Tokens()

  /**
   * An array of methods on which the CSRF validation should be enforced.
   */
  private whitelistedMethods = (this.options.methods || []).map((method) => method.toLowerCase())

  /**
   * An array of routes to be ignored from CSRF validation
   */
  private routesToIgnore = (this.options.exceptRoutes || [])

  /**
   * Name of the csrf section key stored inside the session store
   */
  private secretSessionKey = 'csrf-secret'

  constructor (private options: CsrfOptions, private appKey: string) {
  }

  /**
   * Find if a request should be validated or not
   */
  private shouldValidateRequest ({ request, route }: HttpContextContract) {
    /**
     * Do not validate when whitelisted methods are defined and current
     * method is not part of the white list
     */
    if (this.whitelistedMethods.length && !this.whitelistedMethods.includes(request.method().toLowerCase())) {
      return false
    }

    /**
     * Do not validate when current request route is ignored inside `routesToIgnore`
     * array
     */
    if (this.routesToIgnore.includes(route!.pattern)) {
      return false
    }

    return true
  }

  /**
   * Read csrf token from one of the following sources.
   *
   * - `_csrf` input
   * - `x-csrf-token` header
   * - Or `x-xsrf-token` header. The header value must be set by
   *   reading the `xsrf-token` cookie.
   */
  private getCsrfTokenFromRequest (request: RequestContract): string | null {
    const token = request.input('_csrf', request.header('x-csrf-token'))
    if (token) {
      return token
    }

    /**
     * Only entertain header based on cookie value, when `enableXsrfCookie`
     * is enabled
     */
    if (!this.options.enableXsrfCookie) {
      return null
    }

    const encryptedToken = request.header('x-xsrf-token')
    const unpackedToken = encryptedToken ? unpack(decodeURIComponent(encryptedToken), this.appKey) : null
    return unpackedToken && unpackedToken.signed ? unpackedToken.value : null
  }

  /**
   * Share csrf helper methods with the view engine.
   */
  private shareCsrfViewLocals (ctx: HttpContextContract): void {
    if (!ctx.view) {
      return
    }

    ctx.view.share({
      csrfToken: ctx.request.csrfToken,
      csrfMeta: (compilerContext) => {
        return compilerContext.safe(`<meta name='csrf-token' content='${ctx.request.csrfToken}'>`)
      },
      csrfField: (compilerContext) => {
        return compilerContext.safe(`<input type='hidden' name='_csrf' value='${ctx.request.csrfToken}'>`)
      },
    })
  }

  /**
   * Generate a new csrf token using the csrf secret extracted from session.
   */
  public generateCsrfToken (csrfSecret: string): string {
    return this.tokens.create(csrfSecret)
  }

  /**
   * Return the existing CSRF secret from the session or create a
   * new one. Newly created secret is persisted to session at
   * the same time
   */
  public async getCsrfSecret (ctx: HttpContextContract): Promise<string> {
    let csrfSecret = ctx.session.get(this.secretSessionKey)

    if (!csrfSecret) {
      csrfSecret = await this.tokens.secret()
      ctx.session.put(this.secretSessionKey, csrfSecret)
    }

    return csrfSecret
  }

  /**
   * Handle csrf verification. First, get the secret,
   * next, check if the request method should be
   * verified. Next, attach the newly generated
   * csrf token to the request object.
   */
  public async handle (ctx: HttpContextContract): Promise<void> {
    const csrfSecret = await this.getCsrfSecret(ctx)

    /**
     * Validate current request before moving forward
     */
    if (this.shouldValidateRequest(ctx)) {
      const csrfToken = this.getCsrfTokenFromRequest(ctx.request)
      if (!csrfToken || !this.tokens.verify(csrfSecret, csrfToken)) {
        throw new Exception('Invalid CSRF Token', 403, 'E_BAD_CSRF_TOKEN')
      }
    }

    /**
     * Add csrf token on the request
     */
    ctx.request.csrfToken = this.generateCsrfToken(csrfSecret)

    /**
     * Set it as a cookie
     */
    if (this.options.enableXsrfCookie) {
      const cookieOptions = Object.assign({}, this.options.cookieOptions, {
        httpOnly: false,
      })
      ctx.response.cookie('xsrf-token', ctx.request.csrfToken, cookieOptions)
    }

    /**
     * Share with the view engine
     */
    this.shareCsrfViewLocals(ctx)
  }
}

/**
 * A factory function that returns a new function to enforce CSRF
 * protection
 */
export function csrfFactory (options: CsrfOptions, appKey: string) {
  if (!options.enabled) {
    return noop
  }

  const csrfMiddleware = new Csrf(options, appKey)
  return csrfMiddleware.handle.bind(csrfMiddleware)
}
