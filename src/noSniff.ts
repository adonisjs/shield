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
 * Factory function that returns a function to Add `X-Content-Type-Options`
 * header based upon given user options.
 */
export function noSniffFactory (options: ContentTypeSniffingOptions) {
  if (!options.enabled) {
    return noop
  }

  return function noSniff ({ response }: HttpContextContract) {
    response.header('X-Content-Type-Options', 'nosniff')
  }
}
