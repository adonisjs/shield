/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { hsts } from '../src/hsts'
import { getCtx } from '../test-helpers'

test.group('Hsts', () => {
  test('return noop function when enabled is false', (assert) => {
    const middlewareFn = hsts({ enabled: false })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.isUndefined(ctx.response.getHeader('Strict-Transport-Security'))
  })

  test('set Strict-Transport-Security header with defined maxAge', (assert) => {
    const middlewareFn = hsts({ enabled: true, maxAge: 100 })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('Strict-Transport-Security'), 'max-age=100')
  })

  test('handle string based max-age', (assert) => {
    const middlewareFn = hsts({ enabled: true, maxAge: '1s' })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('Strict-Transport-Security'), 'max-age=1000')
  })

  test('entertain includeSubDomains flag', (assert) => {
    const middlewareFn = hsts({ enabled: true, maxAge: '1s', includeSubDomains: true })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('Strict-Transport-Security'), 'max-age=1000; includeSubDomains')
  })

  test('entertain preload flag', (assert) => {
    const middlewareFn = hsts({ enabled: true, maxAge: '1s', includeSubDomains: true, preload: true })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('Strict-Transport-Security'), 'max-age=1000; includeSubDomains; preload')
  })
})
