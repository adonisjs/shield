/*
 * @adonisjs/shield
 *
 * (c) ? (Please advice before merge, thanks!)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import { csrf } from '../src/csrf'
import { getCtx } from '../test-helpers'

test.group('Csrf', () => {
  test('return noop function when enabled is false', (assert) => {
    const middlewareFn = csrf({ enabled: false })
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.isUndefined(ctx.request.csrfToken)
  })

  test('generate new csrf token for every new request', async (assert) => {
    const middlewareFn = csrf({ enabled: true })
    const ctx = getCtx()
    await middlewareFn(ctx)

    assert.isDefined(ctx.request.csrfToken)
  })

  test('validate csrf token on a request', async (assert) => {
    const middlewareFn = csrf({ enabled: true })
    const ctx = getCtx()
    await middlewareFn(ctx)
  })
})
