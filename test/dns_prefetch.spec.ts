/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { dnsPrefetchFactory } from '../src/guards/dns_prefetch.js'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

test.group('Dns Prefetch', () => {
  test('return noop function when enabled is false', async ({ assert }) => {
    const dnsPrefetch = dnsPrefetchFactory({ enabled: false })
    const ctx = new HttpContextFactory().create()

    dnsPrefetch(ctx)

    assert.isUndefined(ctx.response.getHeader('X-DNS-Prefetch-Control'))
  })

  test('set X-DNS-Prefetch-Control header', async ({ assert }) => {
    const dnsPrefetch = dnsPrefetchFactory({ enabled: true, allow: true })
    const ctx = new HttpContextFactory().create()

    dnsPrefetch(ctx)

    assert.equal(ctx.response.getHeader('X-DNS-Prefetch-Control'), 'on')
  })

  test('set X-DNS-Prefetch-Control header to off', async ({ assert }) => {
    const dnsPrefetch = dnsPrefetchFactory({ enabled: true, allow: false })
    const ctx = new HttpContextFactory().create()

    dnsPrefetch(ctx)

    assert.equal(ctx.response.getHeader('X-DNS-Prefetch-Control'), 'off')
  })
})
