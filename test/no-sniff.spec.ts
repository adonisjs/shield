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
import { noSniff } from '../src/noSniff'

test.group('No Sniff', () => {
  test('return noop function when enabled is false', (assert) => {
    const middlewareFn = noSniff({ enabled: false })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Content-Type-Options'))
  })

  test('set X-Content-Type-Options header', (assert) => {
    const middlewareFn = noSniff({ enabled: true })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('X-Content-Type-Options'), 'nosniff')
  })
})
