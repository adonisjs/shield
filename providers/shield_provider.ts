/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ApplicationService } from '@adonisjs/core/types'

import type { ShieldConfig } from '../src/types.ts'
import ShieldMiddleware from '../src/shield_middleware.ts'

/**
 * ShieldProvider is responsible for registering the Shield security middleware
 * with the AdonisJS container. It handles the configuration and initialization
 * of security features like CSRF protection, content security policy, and more.
 *
 * @example
 * ```ts
 * // Provider is automatically registered in providers array
 * const providers = [
 *   () => import('@adonisjs/shield/shield_provider')
 * ]
 * ```
 */
export default class ShieldProvider {
  /**
   * Creates a new instance of ShieldProvider
   *
   * @param app - The AdonisJS application service instance
   */
  constructor(protected app: ApplicationService) {}

  /**
   * Registers ShieldMiddleware to the container with proper configuration
   * and dependencies. This method binds the middleware to the IoC container
   * and sets up Edge.js integration when available.
   */
  async register() {
    this.app.container.bind(ShieldMiddleware, async () => {
      const config = this.app.config.get<ShieldConfig>('shield', {})
      const encryptionManager = await this.app.container.make('encryption')
      const encryption = encryptionManager.use()

      if (this.app.usingEdgeJS) {
        const edge = await import('edge.js')
        return new ShieldMiddleware(config, encryption, edge.default)
      }

      return new ShieldMiddleware(config, encryption)
    })
  }
}
