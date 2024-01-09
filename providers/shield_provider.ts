/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationService } from '@adonisjs/core/types'

import type { ShieldConfig } from '../src/types.js'
import ShieldMiddleware from '../src/shield_middleware.js'

/**
 * Provider to register shield middleware
 */
export default class ShieldProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register ShieldMiddleware to the container
   */
  async register() {
    this.app.container.bind(ShieldMiddleware, async () => {
      const config = this.app.config.get<ShieldConfig>('shield', {})
      const encryption = await this.app.container.make('encryption')

      if (this.app.usingEdgeJS) {
        const edge = await import('edge.js')
        return new ShieldMiddleware(config, encryption, edge.default)
      }

      return new ShieldMiddleware(config, encryption)
    })
  }
}
