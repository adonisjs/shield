/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { cspFactory } from '../src/csp'
import { getCtx } from '../test-helpers'

test.group('Csp', () => {
  test('return noop function when enabled is false', (assert) => {
    const csp = cspFactory({ enabled: false })
    const ctx = getCtx('')
    csp(ctx)

    assert.isUndefined(ctx.response.getHeader('Content-Security-Policy'))
  })

  test('set Content-Security-Policy header', (assert) => {
    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ['\'self\''],
      },
    })

    const ctx = getCtx('')
    csp(ctx)

    assert.equal(ctx.response.getHeader('Content-Security-Policy'), 'default-src \'self\'')
  })

  test('transform @nonce keyword on scriptSrc', (assert) => {
    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ['\'self\''],
        scriptSrc: ['@nonce'],
      },
    })

    const ctx = getCtx('')
    ctx.response.nonce = '1234'

    csp(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      'default-src \'self\'; script-src \'nonce-1234\'',
    )
  })

  test('transform @nonce keyword on styleSrc', (assert) => {
    const csp = cspFactory({
      enabled: true,
      directives: {
        defaultSrc: ['\'self\''],
        styleSrc: ['@nonce'],
      },
    })

    const ctx = getCtx('')
    ctx.response.nonce = '1234'

    csp(ctx)
    assert.equal(
      ctx.response.getHeader('Content-Security-Policy'),
      'default-src \'self\'; style-src \'nonce-1234\'',
    )
  })
})
