/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as shield from '../index.js'
import { EncryptionService } from '@adonisjs/core/types'
import { ShieldConfig } from './types.js'
import { ViewContract } from '@adonisjs/view/types'
import { HttpContext } from '@adonisjs/core/http'

/**
 * Shield middleware to protect web applications against common
 * web attacks
 */
export default class ShieldMiddleware {
  #config: ShieldConfig
  #encryption: EncryptionService
  #view?: ViewContract
  #actions: ((ctx: HttpContext) => any)[] = []

  constructor(config: ShieldConfig, encryption: EncryptionService, view?: ViewContract) {
    this.#config = config
    this.#encryption = encryption
    this.#view = view

    this.#actions = [
      shield.csrfFactory(this.#config.csrf || {}, this.#encryption, this.#view),
      shield.cspFactory(this.#config.csp || {}),
      shield.dnsPrefetchFactory(this.#config.dnsPrefetch || {}),
      shield.frameGuardFactory(this.#config.xFrame || {}),
      shield.hstsFactory(this.#config.hsts || {}),
      shield.noSniffFactory(this.#config.contentTypeSniffing || {}),
    ]
  }

  /**
   * Handle request
   */
  public async handle(ctx: HttpContext, next: () => Promise<void>) {
    for (let action of this.#actions) {
      await action(ctx)
    }

    await next()
  }
}
