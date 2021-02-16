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
    this.app.container.singleton('Adonis/Addons/ShieldMiddleware', () => {
      const Config = this.app.container.resolveBinding('Adonis/Core/Config')
      const Encryption = this.app.container.resolveBinding('Adonis/Core/Encryption')
      const View = this.app.container.hasBinding('Adonis/Core/View')
        ? this.app.container.resolveBinding('Adonis/Core/View')
        : undefined

      const { ShieldMiddleware } = require('../src/ShieldMiddleware')
      return new ShieldMiddleware(Config.get('shield', {}), Encryption, View)
    })
  }

  public boot() {
    this.app.container.withBindings(['Adonis/Core/Response'], (Response) => {
      require('../src/Bindings/Response').default(Response)
    })
  }
}
