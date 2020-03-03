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
import { CsrfOptions } from '@ioc:Adonis/Addons/Shield'
import { RequestContract } from '@ioc:Adonis/Core/Request'
import { HttpException } from '@adonisjs/generic-exceptions'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { noop } from './noop'

const Csrf = new Tokens()

// TODO: Switch this to fetch secret from session once questions have been answered.
const session: { secret?: string } = {}

export function getCsrfTokenFromRequest (request: RequestContract, applicationKey: string) {
  const token = request.input('_csrf') || request.header('x-csrf-token')

  if (token) {
    return token
  }

  const encryptedToken = request.header('x-xsrf-token')
  const unpackedToken = encryptedToken ? unpack(token, applicationKey) : null

  return unpackedToken ? unpackedToken.value : null
}

export async function getCsrfSecret () {
  let csrfSecret = session.secret

  if (! csrfSecret) {
    csrfSecret = await Csrf.secret()

    session.secret = csrfSecret
  }

  return csrfSecret
}

export function generateCsrfToken (csrfSecret) {
  return Csrf.create(csrfSecret)
}

export function requestMethodShouldEnforceCsrf (request: RequestContract, options: CsrfOptions): boolean {
  const method = request.method().toLowerCase()

  if (! options.methods || options.methods.length === 0) {
    return true
  }

  return options.methods.filter(definedMethod => definedMethod.toLowerCase() === method).length > 0
}

export function csrf (options: CsrfOptions, applicationKey: string) {
  if (! options.enabled) {
    return noop
  }

  return async function csrfMiddlewareFn ({ request }: HttpContextContract) {
    const csrfSecret = await getCsrfSecret()

    if (requestMethodShouldEnforceCsrf (request, options)) {
      // if this request method and uri should be protected by csrf, verify the token
      const csrfToken = getCsrfTokenFromRequest(request, applicationKey)

      if (! csrfToken || ! Csrf.verify(csrfSecret, csrfToken)) {
        throw new HttpException('Invalid CSRF Token', 403, 'EBADCSRFTOKEN')
      }
    }

    // Generate a new csrf token based on the secret from session.
    request.csrfToken = generateCsrfToken(csrfSecret)
  }
}
