/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { HttpContext } from '@adonisjs/http-server/build/standalone'
import { noOpen } from '../src/noOpen'

test.group('No Open', () => {
  test('return noop function when enabled is false', (assert) => {
    const middlewareFn = noOpen({ enabled: false })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Download-Options'))
  })

  test('set X-Download-Options header', (assert) => {
    const middlewareFn = noOpen({ enabled: true })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('X-Download-Options'), 'noopen')
  })
})
