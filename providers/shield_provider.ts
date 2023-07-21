/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationService } from '@adonisjs/core/types'
import extendHttpResponse from '../src/bindings/http_response.js'
import extendApiClient from '../src/bindings/api_client.js'
import ShieldMiddleware from '../src/shield_middleware.js'
import { ShieldConfig } from '../src/types.js'

/**
 * Provider to register shield middleware
 */
export default class ShieldProvider {
  constructor(protected app: ApplicationService) {}

  async register() {
    this.app.container.bind(ShieldMiddleware, async () => {
      const config = this.app.config.get<ShieldConfig>('shield', {})
      const view = this.app.container.hasBinding('view')
        ? await this.app.container.make('view')
        : undefined

      const encryption = await this.app.container.make('encryption')

      return new ShieldMiddleware(config, encryption, view)
    })
  }

  /**
   * Register Http and ApiClient bindings
   */
  boot() {
    extendHttpResponse()
    extendApiClient()
  }
}
