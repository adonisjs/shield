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
import { noOpenFactory } from '../src/noOpen'

test.group('No Open', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('return noop function when enabled is false', async (assert) => {
    const noOpen = noOpenFactory({ enabled: false })

    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    noOpen(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Download-Options'))
  })

  test('set X-Download-Options header', async (assert) => {
    const noOpen = noOpenFactory({ enabled: true })

    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    noOpen(ctx)

    assert.equal(ctx.response.getHeader('X-Download-Options'), 'noopen')
  })
})
