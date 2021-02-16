/*
 * @adonisjs/events
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { ShieldMiddleware } from '../src/ShieldMiddleware'
import { setup, fs } from '../test-helpers'

test.group('Shield Provider', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('register shield provider', async (assert) => {
    const app = await setup()

    assert.instanceOf(app.container.use('Adonis/Addons/ShieldMiddleware'), ShieldMiddleware)
    assert.deepEqual(
      app.container.use('Adonis/Addons/ShieldMiddleware'),
      app.container.use('Adonis/Addons/ShieldMiddleware')
    )
  })
})
