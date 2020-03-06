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
import { noSniffFactory } from '../src/noSniff'

test.group('No Sniff', () => {
  test('return noop function when enabled is false', (assert) => {
    const noSniff = noSniffFactory({ enabled: false })
    const ctx = getCtx('')
    noSniff(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Content-Type-Options'))
  })

  test('set X-Content-Type-Options header', (assert) => {
    const noSniff = noSniffFactory({ enabled: true })
    const ctx = getCtx('')
    noSniff(ctx)

    assert.equal(ctx.response.getHeader('X-Content-Type-Options'), 'nosniff')
  })
})
