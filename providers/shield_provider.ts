/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Edge } from 'edge.js'
import type { ApplicationService } from '@adonisjs/core/types'

import debug from '../src/debug.js'
import type { ShieldConfig } from '../src/types.js'
import ShieldMiddleware from '../src/shield_middleware.js'

/**
 * Provider to register shield middleware
 */
export default class ShieldProvider {
  constructor(protected app: ApplicationService) {}
  /**
   * Returns edge when it's installed
   */
  protected async getEdge(): Promise<Edge | undefined> {
    try {
      const { default: edge } = await import('edge.js')
      debug('Detected edge.js package. Adding shield primitives to it')
      return edge
    } catch {}
  }

  /**
   * Register ShieldMiddleware to the container
   */
  async register() {
    this.app.container.bind(ShieldMiddleware, async () => {
      const config = this.app.config.get<ShieldConfig>('shield', {})
      const encryption = await this.app.container.make('encryption')
      const edge = await this.getEdge()

      return new ShieldMiddleware(config, encryption, edge)
    })
  }
}
