/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { xssProtection } from '../src/xssProtection'
import { getCtx } from '../test-helpers'

test.group('Xss Protection', () => {
  test('return noop function when enabled is false', (assert) => {
    const middlewareFn = xssProtection({ enabled: false })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.isUndefined(ctx.response.getHeader('X-XSS-Protection'))
  })

  test('set X-XSS-Protection header', (assert) => {
    const middlewareFn = xssProtection({ enabled: true })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('X-XSS-Protection'), '1; mode=block')
  })

  test('disable block mode', (assert) => {
    const middlewareFn = xssProtection({ enabled: true, mode: null })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('X-XSS-Protection'), '1')
  })

  test('set report uri', (assert) => {
    const middlewareFn = xssProtection({ enabled: true, reportUri: '/' })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.equal(ctx.response.getHeader('X-XSS-Protection'), '1; mode=block; report=/')
  })
})
