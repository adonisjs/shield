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
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { noop } from './noop'

const Csrf = new Tokens()

// TODO: Switch this to fetch secret from session once questions have been answered.
const session: { secret?: string } = {}

function getCsrfTokenFromRequest(request: RequestContract) {
    const token = request.header('x-csrf-token') || request.header('x-xsrf-token') || request.input('_csrf')
}

export function csrf (options: CsrfOptions) {
  if (! options.enabled) {
    return noop
  }

  return async function csrfMiddlewareFn ({ request }: HttpContextContract) {
    let csrfSecret = ''

    if (! session.secret) {
      csrfSecret = await Csrf.secret()

      session.secret = csrfSecret
    }

    // if this request method and uri should be protected by csrf, verify the token
    if (options.filterUris && options.filterUris) {
        const csrfToken = getCsrfTokenFromRequest(request)
    }

    // Generate a new csrf token based on the secret from session.
    request.csrfToken = Csrf.create(csrfSecret)
  }
}
