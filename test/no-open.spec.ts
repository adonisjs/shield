/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { getCtx } from '../test-helpers'
import { noOpenFactory } from '../src/noOpen'

test.group('No Open', () => {
  test('return noop function when enabled is false', (assert) => {
    const noOpen = noOpenFactory({ enabled: false })
    const ctx = getCtx()
    noOpen(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Download-Options'))
  })

  test('set X-Download-Options header', (assert) => {
    const noOpen = noOpenFactory({ enabled: true })
    const ctx = getCtx()
    noOpen(ctx)

    assert.equal(ctx.response.getHeader('X-Download-Options'), 'noopen')
  })
})
