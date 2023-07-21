/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { cspFactory } from '../src/defenses/csp.js'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import extendHttpResponse from '../src/bindings/http_response.js'

test.group('Csp', (group) => {
  group.each.setup(() => {
    extendHttpResponse()
  })

  test('return noop function when enabled is false', async ({ assert }) => {
    const csp = cspFactory({ enabled: false })
    const ctx = new HttpContextFactory().create()

    csp(ctx)

    assert.isUndefined(ctx.response.getHeader('Content-Security-Policy'))
  })

  test('set Content-Security-Policy header', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
      },
    })

    // @ts-ignore
    ctx.view = { share: (_: any) => {} }

    csp(ctx)

    assert.equal(ctx.response.getHeader('Content-Security-Policy'), "default-src 'self'")
  })

  test('transform @nonce keyword on scriptSrc', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ['@nonce'],
      },
    })

    // @ts-ignore
    ctx.view = { share: (_: any) => {} }

    csp(ctx)

    assert.isDefined(ctx.response.nonce)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self';script-src 'nonce-${ctx.response.nonce}'`
    )
  })

  test('transform @nonce keyword on styleSrc', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ['@nonce'],
      },
    })

    // @ts-ignore
    ctx.view = { share: (_: any) => {} }

    csp(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self';style-src 'nonce-${ctx.response.nonce}'`
    )
  })

  test('transform @nonce keyword on defaultSrc', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'", '@nonce'],
      },
    })

    // @ts-ignore
    ctx.view = { share: (_: any) => null }

    csp(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self' 'nonce-${ctx.response.nonce}'`
    )
  })

  test('share cspNonce with view', async ({ assert }) => {
    assert.plan(2)
    const ctx = new HttpContextFactory().create()

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'", '@nonce'],
      },
    })

    // @ts-ignore
    ctx.view = {
      share: (locals): any => {
        assert.isDefined(locals.cspNonce)
        assert.equal(locals.cspNonce, ctx.response.nonce)
      },
    }

    csp(ctx)
  })
})
