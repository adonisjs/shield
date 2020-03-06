/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import { IocContract } from '@adonisjs/fold'

export default class ShieldProvider {
  constructor (protected container: IocContract) {}

  public register () {
    this.container.singleton('Adonis/Addons/ShieldMiddleware', () => {
      const Config = this.container.use('Adonis/Core/Config')
      const shieldConfig = Config.get('shield', {})
      const appKey = Config.get('app.appKey')
      return new (require('../src/ShieldMiddleware').ShieldMiddleware)(shieldConfig, appKey)
    })
  }

  public boot () {
    this.container.with(['Adonis/Core/Response'], (Response) => {
      require('../src/Bindings/Response').default(Response)
    })
  }
}
