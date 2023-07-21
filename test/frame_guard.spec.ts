/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { frameGuardFactory } from '../src/frame_guard.js'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

test.group('FrameGuard', () => {
  test('return noop function when enabled is false', async ({ assert }) => {
    const frameGuard = frameGuardFactory({ enabled: false })
    const ctx = new HttpContextFactory().create()

    frameGuard(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Frame-Options'))
  })

  test('raise error when action type is incorrect', async ({ assert }) => {
    const frameGuard = () => frameGuardFactory({ enabled: true, action: 'FOO' } as any)
    assert.throws(
      frameGuard,
      'frameGuard: Action must be one of "DENY", "ALLOW-FROM" or "SAMEORGIGIN"'
    )
  })

  test('raise error when action type is ALLOW-FROM and domain is not defined', async ({
    assert,
  }) => {
    const frameGuard = () => frameGuardFactory({ enabled: true, action: 'ALLOW-FROM' } as any)
    assert.throws(
      frameGuard,
      'frameGuard: Domain value is required when using action as "ALLOW-FROM"'
    )
  })

  test('set X-Frame-Options header', async ({ assert }) => {
    const frameGuard = frameGuardFactory({ enabled: true })
    const ctx = new HttpContextFactory().create()

    frameGuard(ctx)

    assert.equal(ctx.response.getHeader('X-Frame-Options'), 'SAMEORIGIN')
  })

  test('set X-Frame-Options header for allow from action', async ({ assert }) => {
    const frameGuard = frameGuardFactory({ enabled: true, action: 'ALLOW-FROM', domain: 'foo.com' })
    const ctx = new HttpContextFactory().create()

    frameGuard(ctx)

    assert.equal(ctx.response.getHeader('X-Frame-Options'), 'ALLOW-FROM foo.com')
  })
})
