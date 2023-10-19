/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { Edge } from 'edge.js'
import type { EncryptionService } from '@adonisjs/core/types'

import * as shield from './guards/main.js'
import type { ShieldConfig } from './types.js'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Shield middleware to protect web applications against common
 * web attacks
 */
export default class ShieldMiddleware {
  #guards: ((ctx: HttpContext) => any)[] = []

  constructor(config: ShieldConfig, encryption: EncryptionService, edge?: Edge) {
    this.#guards = [
      shield.csrfFactory(config.csrf || {}, encryption, edge),
      shield.cspFactory(config.csp || {}),
      shield.frameGuardFactory(config.xFrame || {}),
      shield.hstsFactory(config.hsts || {}),
      shield.noSniffFactory(config.contentTypeSniffing || {}),
    ]
  }

  /**
   * Handle request
   */
  async handle(ctx: HttpContext, next: () => Promise<void>) {
    for (let action of this.#guards) {
      await action(ctx)
    }

    await next()
  }
}
