/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { setup, fs } from '../test-helpers'
import { dnsPrefetchFactory } from '../src/dnsPrefetch'

test.group('Dns Prefetch', (group) => {
  group.each.teardown(async () => {
    await fs.cleanup()
  })

  test('return noop function when enabled is false', async ({ assert }) => {
    const dnsPrefetch = dnsPrefetchFactory({ enabled: false })

    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    dnsPrefetch(ctx)

    assert.isUndefined(ctx.response.getHeader('X-DNS-Prefetch-Control'))
  })

  test('set X-DNS-Prefetch-Control header', async ({ assert }) => {
    const dnsPrefetch = dnsPrefetchFactory({ enabled: true, allow: true })

    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    dnsPrefetch(ctx)

    assert.equal(ctx.response.getHeader('X-DNS-Prefetch-Control'), 'on')
  })

  test('set X-DNS-Prefetch-Control header to off', async ({ assert }) => {
    const dnsPrefetch = dnsPrefetchFactory({ enabled: true, allow: false })
    const app = await setup()
    const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
    dnsPrefetch(ctx)

    assert.equal(ctx.response.getHeader('X-DNS-Prefetch-Control'), 'off')
  })
})
