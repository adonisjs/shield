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

export class CsrfMiddleware {
  private session: SessionContract

  private options: CsrfOptions

  private applicationKey: string

  constructor (session: SessionContract, options: CsrfOptions, applicationKey: string) {
    this.session = session
    this.options = options
    this.applicationKey = applicationKey
  }

  private requestMethodShouldEnforceCsrf (request: RequestContract) {
    const method = request.method().toLowerCase()

    if (! this.options.methods || this.options.methods.length === 0) {
      return true
    }

    return this.options.methods
      .filter(definedMethod => definedMethod.toLowerCase() === method)
      .length > 0
  }

  public async getCsrfSecret () {
    let csrfSecret = this.session.get('csrf-secret')

    if (! csrfSecret) {
      csrfSecret = await Csrf.secret()

      this.session.put('csrf-secret', csrfSecret)
    }

    return csrfSecret
  }

  private getCsrfTokenFromRequest (request: RequestContract) {
    const token = request.input('_csrf') || request.header('x-csrf-token')

    if (token) {
      return token
    }

    const encryptedToken = request.header('x-xsrf-token')
    const unpackedToken = encryptedToken ? unpack(token, this.applicationKey) : null

    return unpackedToken ? unpackedToken.value : null
  }

  public generateCsrfToken (csrfSecret) {
    return Csrf.create(csrfSecret)
  }

  public async handle (request: RequestContract) {
    const csrfSecret = await this.getCsrfSecret()

    if (this.requestMethodShouldEnforceCsrf(request)) {
      const csrfToken = this.getCsrfTokenFromRequest(request)

      if (! csrfToken || ! Csrf.verify(csrfSecret, csrfToken)) {
        throw new Exception('Invalid CSRF Token', 403, 'E_BAD_CSRF_TOKEN')
      }
    }

    request.csrfToken = this.generateCsrfToken(csrfSecret)
  }
}

export function csrf (options: CsrfOptions, applicationKey: string) {
  if (! options.enabled) {
    return noop
  }

  return async function csrfMiddlewareFn ({ request, session }: HttpContextContract) {
    const csrfMiddleware = new CsrfMiddleware(session, options, applicationKey)

    return csrfMiddleware.handle(request)
  }
}
