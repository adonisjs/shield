/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { setup, fs } from '../test-helpers'
import { noSniffFactory } from '../src/noSniff'

test.group('No Sniff', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('return noop function when enabled is false', async (assert) => {
    const noSniff = noSniffFactory({ enabled: false })

    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    noSniff(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Content-Type-Options'))
  })

  test('set X-Content-Type-Options header', async (assert) => {
    const noSniff = noSniffFactory({ enabled: true })

    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    noSniff(ctx)

    assert.equal(ctx.response.getHeader('X-Content-Type-Options'), 'nosniff')
  })
})
