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
import { frameGuard } from '../src/frameGuard'

test.group('FrameGuard', () => {
  test('return noop function when enabled is false', (assert) => {
    const middlewareFn = frameGuard({ enabled: false })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Frame-Options'))
  })

  test('raise error when action type is incorrect', (assert) => {
    const middlewareFn = () => frameGuard({ enabled: true, action: 'FOO' } as any)
    assert.throw(middlewareFn, 'Action must be one of "DENY", "ALLOW-FROM" or "SAMEORGIGIN"')
  })

  test('set X-Frame-Options header', (assert) => {
    const middlewareFn = frameGuard({ enabled: true })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('X-Frame-Options'), 'SAMEORIGIN')
  })

  test('set X-Frame-Options header for allow from action', (assert) => {
    const middlewareFn = frameGuard({ enabled: true, action: 'ALLOW-FROM', domain: 'foo.com' })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('X-Frame-Options'), 'ALLOW-FROM foo.com')
  })
})
