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
import { noop } from './noop'

/**
 * Adds `X-Download-Options` header based upon given
 * user options
 */
export function noOpen (options: ContentTypeSniffingOptions) {
  if (!options.enabled) {
    return noop
  }

  return function noOpenMiddlewareFn ({ response }: HttpContextContract) {
    response.header('X-Download-Options', 'noopen')
  }
}
