'use strict'

/*
 * adonis-shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const { ServiceProvider } = require('@adonisjs/fold')

class ShieldProvider extends ServiceProvider {
  register () {
    this.app.bind('Adonis/Middleware/Shield', (app) => {
      const Shield = require('../src/Shield')
      return new Shield(app.use('Adonis/Src/Config'))
    })
  }
}

module.exports = ShieldProvider
