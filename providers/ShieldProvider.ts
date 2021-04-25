/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationContract } from '@ioc:Adonis/Core/Application'

/**
 * Provider to register shield middleware
 */
export default class ShieldProvider {
  constructor(protected app: ApplicationContract) {}
  public static needsApplication = true

  public register() {
    this.app.container.singleton('Adonis/Addons/Shield', () => {
      const { ShieldMiddleware } = require('../src/ShieldMiddleware')
      return ShieldMiddleware
    })
  }

  public boot() {
    this.app.container.withBindings(['Adonis/Core/Response'], (Response) => {
      require('../src/Bindings/Response').default(Response)
    })
  }
}
