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
import { dnsPrefetch } from '../src/dnsPrefetch'

test.group('Dns Prefetch', () => {
  test('return noop function when enabled is false', (assert) => {
    const middlewareFn = dnsPrefetch({ enabled: false })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.isUndefined(ctx.response.getHeader('X-DNS-Prefetch-Control'))
  })

  test('set X-DNS-Prefetch-Control header', (assert) => {
    const middlewareFn = dnsPrefetch({ enabled: true, allow: true })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('X-DNS-Prefetch-Control'), 'on')
  })

  test('set X-DNS-Prefetch-Control header to off', (assert) => {
    const middlewareFn = dnsPrefetch({ enabled: true, allow: false })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('X-DNS-Prefetch-Control'), 'off')
  })
})
