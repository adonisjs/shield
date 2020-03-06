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
import { frameGuardFactory } from '../src/frameGuard'

test.group('FrameGuard', () => {
  test('return noop function when enabled is false', (assert) => {
    const frameGuard = frameGuardFactory({ enabled: false })
    const ctx = getCtx()
    frameGuard(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Frame-Options'))
  })

  test('raise error when action type is incorrect', (assert) => {
    const frameGuard = () => frameGuardFactory({ enabled: true, action: 'FOO' } as any)
    assert.throw(frameGuard, 'frameGuard: Action must be one of "DENY", "ALLOW-FROM" or "SAMEORGIGIN"')
  })

  test('raise error when action type is ALLOW-FROM and domain is not defined', (assert) => {
    const frameGuard = () => frameGuardFactory({ enabled: true, action: 'ALLOW-FROM' } as any)
    assert.throw(frameGuard, 'frameGuard: Domain value is required when using action as "ALLOW-FROM"')
  })

  test('set X-Frame-Options header', (assert) => {
    const frameGuard = frameGuardFactory({ enabled: true })
    const ctx = getCtx()
    frameGuard(ctx)

    assert.equal(ctx.response.getHeader('X-Frame-Options'), 'SAMEORIGIN')
  })

  test('set X-Frame-Options header for allow from action', (assert) => {
    const frameGuard = frameGuardFactory({ enabled: true, action: 'ALLOW-FROM', domain: 'foo.com' })
    const ctx = getCtx()
    frameGuard(ctx)

    assert.equal(ctx.response.getHeader('X-Frame-Options'), 'ALLOW-FROM foo.com')
  })
})
