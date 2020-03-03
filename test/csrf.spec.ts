/*
 * @adonisjs/shield
 *
 * (c) ? (Please advice before merge, thanks!)
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

import test from 'japa'
import Tokens from 'csrf'
import { getCtx, getCtxFromIncomingMessage } from '../test-helpers'
import { csrf, getCsrfSecret, generateCsrfToken } from '../src/csrf'

const Csrf = new Tokens()
const APPLICATION_SECRET_KEY = 'secret-key'

test.group('Csrf', () => {
  test('return noop function when enabled is false', (assert) => {
    const middlewareFn = csrf({ enabled: false }, APPLICATION_SECRET_KEY)
    const ctx = getCtx()
    middlewareFn(ctx)

    assert.isUndefined(ctx.request.csrfToken)
  })

  test('generate new, and valid csrf token for every new request', async (assert) => {
    const TEST_CSRF_SECRET = await getCsrfSecret()
    const TEST_CSRF_TOKEN = generateCsrfToken(TEST_CSRF_SECRET)

    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtxFromIncomingMessage({
      'x-csrf-token': TEST_CSRF_TOKEN,
    })

    ctx.request.request.method = 'GET'

    await middlewareFn(ctx)

    assert.isDefined(ctx.request.csrfToken)
    assert.isTrue(Csrf.verify(TEST_CSRF_SECRET, ctx.request.csrfToken))
  })

  test('validate csrf token on a request', async (assert) => {
    assert.plan(1)

    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtx()

    ctx.request.request.method = 'POST'

    try {
      await middlewareFn(ctx)
    } catch (error) {
      assert.equal(error.message, 'EBADCSRFTOKEN: Invalid CSRF Token')
    }
  })

  test('skip csrf token validation on methods white listed', async (assert) => {
    const middlewareFn = csrf({ enabled: true, methods: ['POST', 'PATCH', 'DELETE'] }, APPLICATION_SECRET_KEY)
    const ctx = getCtx('/users/:id', { id: 12453 })

    ctx.request.request.method = 'PUT'

    await middlewareFn(ctx)

    assert.isDefined(ctx.request.csrfToken)
  })

  test('enforces csrf token validation on methods not whitelisted', async (assert) => {
    assert.plan(1)
    const middlewareFn = csrf({ enabled: true, methods: ['POST', 'PATCH', 'DELETE'] }, APPLICATION_SECRET_KEY)
    const ctx = getCtx('/users/:id', { id: 12453 })

    ctx.request.request.method = 'PATCH'

    try {
      await middlewareFn(ctx)
    } catch (error) {
      assert.equal(error.message, 'EBADCSRFTOKEN: Invalid CSRF Token')
    }
  })
})
