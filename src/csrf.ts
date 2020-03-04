/*
 * @adonisjs/shield
 *
 * (c) ? (Please advice before merge. Thanks !)
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
import { SessionContract } from '@ioc:Adonis/Addons/Session'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { noop } from './noop'

const Csrf = new Tokens()

/**
 * A wrapper around all the functionality
 * for handling csrf verification
 * 
 */
export class CsrfMiddleware {
  /**
   * The session instance of the application.
   * This would be injected from the
   * http context.
   */
  public session: SessionContract

  /**
   * Csrf configurations defined by the
   * user in the shield.js file.
   */
  private options: CsrfOptions

  /**
   * The application key defined as APP_SECRET
   * in environment variables. This would
   * be injected from the config.
   */
  private applicationKey: string

  constructor (session: SessionContract, options: CsrfOptions, applicationKey: string) {
    this.session = session
    this.options = options
    this.applicationKey = applicationKey
  }

  /**
   * Get the request method, check if the user defined
   * methods allowed for csrf verification in the
   * config. If it did, check if the request
   * method is one of the allowed. If not,
   * return false.
   */
  private requestMethodShouldEnforceCsrf (request: RequestContract): boolean {
    const method = request.method().toLowerCase()

    if (!this.options.methods || this.options.methods.length === 0) {
      return true
    }

    return this.options.methods
      .filter(definedMethod => definedMethod.toLowerCase() === method)
      .length > 0
  }

  /**
   * Check if the current request url has been
   * excluded from csrf protection.
   */
  private requestUrlShouldEnforceCsrf (ctx: HttpContextContract): boolean {
    if (!this.options.filterUris || this.options.filterUris.length === 0) {
      return true
    }

    return !this.options.filterUris.includes(ctx.route!.pattern)
  }

  /**
   * Check if csrf secret has been saved to
   * session. If not, generate a new one,
   * save it to session, and return it.
   */
  public async getCsrfSecret (): Promise<string> {
    let csrfSecret = this.session.get('csrf-secret')

    if (!csrfSecret) {
      csrfSecret = await Csrf.secret()

      this.session.put('csrf-secret', csrfSecret)
    }

    return csrfSecret
  }

  /**
   * Extract the csrf token from the request by
   * checking headers and inputs. Decode the
   * token if it was encrypted.
   */
  private getCsrfTokenFromRequest (request: RequestContract): string|null {
    const token = request.input('_csrf') || request.header('x-csrf-token')

    if (token) {
      return token
    }

    const encryptedToken = request.header('x-xsrf-token')
    const unpackedToken = encryptedToken ? unpack(token, this.applicationKey) : null

    return unpackedToken ? unpackedToken.value : null
  }

  /**
   * Generate a new csrf token using
   * the csrf secret extracted
   * from session.
   */
  public generateCsrfToken (csrfSecret): string {
    return Csrf.create(csrfSecret)
  }

  /**
   * Set the xsrf cookie on
   * response
   */
  private setXsrfCookie (ctx: HttpContextContract): void {
    ctx.response.cookie('x-xsrf-token', ctx.request.csrfToken)
  }

  /**
   * Set the csrf token on
   * request
   */
  private setCsrfToken (ctx: HttpContextContract, csrfSecret: string): void {
    ctx.request.csrfToken = this.generateCsrfToken(csrfSecret)
  }

  /**
   * This would make a csrfToken variable available to
   * the edge view templates. This would also create
   * a helpful method called csrfField to be used
   * on the frontend to generate a hidden
   * field called _csrf
   */
  private shareCsrfViewLocals (ctx: HttpContextContract): void {
    ctx.view.share({
      csrfToken: ctx.request.csrfToken,
      csrfField: (compilerContext) => compilerContext.safe(`<input type='hidden' name='_csrf' value='${ctx.request.csrfToken}'>`),
    })
  }

  /**
   * Handle csrf verification. First, get the secret,
   * next, check if the request method should be
   * verified. Next, attach the newly generated
   * csrf token to the request object.
   */
  public async handle (ctx: HttpContextContract): Promise<void> {
    const { request } = ctx

    const csrfSecret = await this.getCsrfSecret()

    if (this.requestMethodShouldEnforceCsrf(request) && this.requestUrlShouldEnforceCsrf(ctx)) {
      const csrfToken = this.getCsrfTokenFromRequest(request)

      if (!csrfToken || !Csrf.verify(csrfSecret, csrfToken)) {
        throw new Exception('Invalid CSRF Token', 403, 'E_BAD_CSRF_TOKEN')
      }
    }

    this.setCsrfToken(ctx, csrfSecret)

    this.setXsrfCookie(ctx)

    this.shareCsrfViewLocals(ctx)
  }
}

/**
 * Check if csrf is enabled. If yes, verifies the
 * old token and generates a new one for
 * the next request.
 */
export function csrf (options: CsrfOptions, applicationKey: string) {
  if (!options.enabled) {
    return noop
  }

  return async function csrfMiddlewareFn (ctx: HttpContextContract) {
    const csrfMiddleware = new CsrfMiddleware(ctx.session, options, applicationKey)

    return csrfMiddleware.handle(ctx)
  }
}
