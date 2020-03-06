/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../adonis-typings/index.ts" />

import { DnsPrefetchOptions } from '@ioc:Adonis/Addons/Shield'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { noop } from './noop'

/**
 * Factory that returns a function to set `X-DNS-Prefetch-Control` header.
 */
export function dnsPrefetchFactory (options: DnsPrefetchOptions) {
  if (!options.enabled) {
    return noop
  }

  const value = options.allow ? 'on' : 'off'

  return function dnsPrefetch ({ response }: HttpContextContract) {
    response.header('X-DNS-Prefetch-Control', value)
  }
}
