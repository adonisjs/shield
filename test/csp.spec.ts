/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { cspFactory } from '../src/csp'
import { setup, fs } from '../test-helpers'

test.group('Csp', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('return noop function when enabled is false', async ({ assert }) => {
    const app = await setup()
    const csp = cspFactory({ enabled: false })
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    csp(ctx)

    assert.isUndefined(ctx.response.getHeader('Content-Security-Policy'))
  })

  test('set Content-Security-Policy header', async ({ assert }) => {
    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
      },
    })

    csp(ctx)

    assert.equal(ctx.response.getHeader('Content-Security-Policy'), "default-src 'self'")
  })

  test('transform @nonce keyword on scriptSrc', async ({ assert }) => {
    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ['@nonce'],
      },
    })

    csp(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self';script-src 'nonce-${ctx.response.nonce}'`
    )
  })

  test('transform @nonce keyword on styleSrc', async ({ assert }) => {
    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ['@nonce'],
      },
    })

    csp(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self';style-src 'nonce-${ctx.response.nonce}'`
    )
  })

  test('transform @nonce keyword on defaultSrc', async ({ assert }) => {
    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'", '@nonce'],
      },
    })

    csp(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self' 'nonce-${ctx.response.nonce}'`
    )
  })
})
