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
import { csp } from '../src/csp'

test.group('Csp', () => {
  test('return noop function when enabled is false', (assert) => {
    const middlewareFn = csp({ enabled: false })
    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.isUndefined(ctx.response.getHeader('Content-Security-Policy'))
  })

  test('set Content-Security-Policy header', (assert) => {
    const middlewareFn = csp({
      enabled: true,
      directives: {
        defaultSrc: [`'self'`],
      },
    })

    const ctx = HttpContext.create('/', {}, {}, {}, {})
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('Content-Security-Policy'), `default-src 'self'`)
  })

  test('transform @nonce keyword on scriptSrc', (assert) => {
    const middlewareFn = csp({
      enabled: true,
      directives: {
        defaultSrc: [`'self'`],
        scriptSrc: ['@nonce'],
      },
    })

    const ctx = HttpContext.create('/', {}, {}, {}, {})
    ctx.response.nonce = '1234'

    middlewareFn(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self'; script-src 'nonce-1234'`,
    )
  })

  test('transform @nonce keyword on styleSrc', (assert) => {
    const middlewareFn = csp({
      enabled: true,
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: ['@nonce'],
      },
    })

    const ctx = HttpContext.create('/', {}, {}, {}, {})
    ctx.response.nonce = '1234'

    middlewareFn(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      `default-src 'self'; style-src 'nonce-1234'`,
    )
  })
})
