/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Edge } from 'edge.js'
import { test } from '@japa/runner'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

import { cspFactory } from '../src/guards/csp/main.js'
import { cspKeywords } from '../src/guards/csp/keywords.js'

test.group('Csp', () => {
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

    csp(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self' 'nonce-${ctx.response.nonce}'`
    )
  })

  test('share cspNonce with view', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'", '@nonce'],
      },
    })

    ctx.view = Edge.create().createRenderer()
    csp(ctx)

    assert.equal(await ctx.view.renderRaw('{{ cspNonce }}'), ctx.response.nonce)
  })
})

test.group('Csp keywords', () => {
  test('transform custom keywords', async ({ assert }) => {
    const ctx = new HttpContextFactory().create()

    cspKeywords.register('@vite', function () {
      return `http://localhost:5173`
    })
    cspKeywords.register('@viteHMR', function () {
      return `ws://localhost:5173`
    })

    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ["'self'", '@vite', '@viteHMR'],
      },
    })

    csp(ctx)

    assert.isDefined(ctx.response.nonce)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self' http://localhost:5173 ws://localhost:5173`
    )
  })
})
