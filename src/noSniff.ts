/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import { ContentTypeSniffingOptions } from '@ioc:Adonis/Addons/Shield'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

/**
 * Adds `X-Content-Type-Options` header based upon given
 * user options
 */
export function noSniff (options: ContentTypeSniffingOptions) {
  if (!options.enabled) {
    return function noSniffMiddlewareFn (_ctx: HttpContextContract) {
    }
  }

  return function noSniffMiddlewareFn ({ response }: HttpContextContract) {
    response.header('X-Content-Type-Options', 'nosniff')
  }
}
