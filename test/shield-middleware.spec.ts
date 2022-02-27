/*
 * @adonisjs/events
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { ShieldMiddleware } from '../src/ShieldMiddleware'
import { setup, fs } from '../test-helpers'

test.group('Shield Provider', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('register shield provider', async ({ assert }) => {
    const app = await setup()

    assert.deepEqual(app.container.use('Adonis/Addons/Shield'), ShieldMiddleware)
  })

  test('make shield middleware instance via container', async ({ assert }) => {
    const app = await setup()

    assert.instanceOf(
      app.container.make(app.container.use('Adonis/Addons/Shield')),
      ShieldMiddleware
    )
  })
})
