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
import { pack } from '@poppinss/cookie'

import { csrf, CsrfFactory } from '../src/csrf'
import { fs, getCtx } from '../test-helpers'

const Csrf = new Tokens()
const APPLICATION_SECRET_KEY = 'verylongrandom32characterssecret'

test.group('Csrf', (group) => {
  group.afterEach(async () => {
    await fs.cleanup()
  })

  test('return noop function when enabled is false', async (assert) => {
    const middlewareFn = csrf({ enabled: false }, APPLICATION_SECRET_KEY)
    const ctx = getCtx()
    await ctx.session.initiate(false)

    middlewareFn(ctx)
    assert.isUndefined(ctx.request.csrfToken)
  })

  test('validate csrf token on a request', async (assert) => {
    assert.plan(1)

    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtx()
    await ctx.session.initiate(false)

    ctx.request.request.method = 'POST'

    try {
      await middlewareFn(ctx)
    } catch (error) {
      assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
    }
  })

  test('skip validation when request method is not one of whitelisted methods', async (assert) => {
    const middlewareFn = csrf({ enabled: true, methods: ['POST', 'PATCH', 'DELETE'] }, APPLICATION_SECRET_KEY)
    const ctx = await getCtx('/users/:id', { id: 12453 })
    await ctx.session.initiate(false)

    ctx.request.request.method = 'PUT'

    await middlewareFn(ctx)

    assert.isDefined(ctx.request.csrfToken)
  })

  test('enforce validation request method is part of whitelisted methods', async (assert) => {
    assert.plan(1)
    const middlewareFn = csrf({ enabled: true, methods: ['POST', 'PATCH', 'DELETE'] }, APPLICATION_SECRET_KEY)
    const ctx = getCtx('/users/:id', { id: 12453 })
    await ctx.session.initiate(false)

    ctx.request.request.method = 'PATCH'

    try {
      await middlewareFn(ctx)
    } catch (error) {
      assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
    }
  })

  test('skip validation when request route is inside the exceptRoutes list', async (assert) => {
    assert.plan(1)
    const middlewareFn = csrf({ enabled: true, exceptRoutes: ['/users/:id'] }, APPLICATION_SECRET_KEY)
    const ctx = getCtx('/users/:id', { id: 12453 })
    await ctx.session.initiate(false)

    ctx.request.request.method = 'PATCH'

    await middlewareFn(ctx)
    assert.isDefined(ctx.request.csrfToken)
  })

  test('skip validation when request route is not inside the exceptRoutes list', async (assert) => {
    assert.plan(2)
    const middlewareFn = csrf({ enabled: true, exceptRoutes: ['posts/:post/store'] }, APPLICATION_SECRET_KEY)
    const ctx = getCtx('/users/:id', { id: 12453 })
    await ctx.session.initiate(false)

    ctx.request.request.method = 'PATCH'

    try {
      await middlewareFn(ctx)
    } catch (error) {
      assert.isUndefined(ctx.request.csrfToken)
      assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
    }
  })

  test('work fine when csrf token is provided as an input', async () => {
    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtx('/')
    await ctx.session.initiate(false)

    const csrfMiddleware = new CsrfFactory(ctx.session, { enabled: true }, APPLICATION_SECRET_KEY)
    const csrfSecret = await csrfMiddleware.getCsrfSecret()
    const csrfToken = csrfMiddleware.generateCsrfToken(csrfSecret)

    ctx.request.request.method = 'PATCH'
    ctx.request.updateBody({ _csrf: csrfToken })

    await middlewareFn(ctx)
  })

  test('work fine when csrf token is provided as a header', async () => {
    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtx('/')
    await ctx.session.initiate(false)

    const csrfMiddleware = new CsrfFactory(ctx.session, { enabled: true }, APPLICATION_SECRET_KEY)
    const csrfSecret = await csrfMiddleware.getCsrfSecret()
    const csrfToken = csrfMiddleware.generateCsrfToken(csrfSecret)

    ctx.request.request.method = 'PATCH'
    ctx.request.request.headers = {
      'x-csrf-token': csrfToken,
    }

    await middlewareFn(ctx)
  })

  test('work fine when csrf token is provided as an encrypted token', async () => {
    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtx('/')
    await ctx.session.initiate(false)

    const csrfMiddleware = new CsrfFactory(ctx.session, { enabled: true }, APPLICATION_SECRET_KEY)
    const csrfSecret = await csrfMiddleware.getCsrfSecret()
    const csrfToken = csrfMiddleware.generateCsrfToken(csrfSecret)

    ctx.request.request.method = 'PATCH'
    ctx.request.request.headers = {
      'x-xsrf-token': pack(csrfToken, APPLICATION_SECRET_KEY)!,
    }

    await middlewareFn(ctx)
  })

  test('fail when csrf input value is incorrect', async (assert) => {
    assert.plan(1)

    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtx()
    await ctx.session.initiate(false)

    ctx.request.request.method = 'POST'
    ctx.request.updateBody({ _csrf: 'hello world' })

    try {
      await middlewareFn(ctx)
    } catch (error) {
      assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
    }
  })

  test('fail when csrf header value is incorrect', async (assert) => {
    assert.plan(1)

    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtx()
    await ctx.session.initiate(false)

    ctx.request.request.method = 'POST'
    ctx.request.request.headers = {
      'x-csrf-token': 'hello world',
    }

    try {
      await middlewareFn(ctx)
    } catch (error) {
      assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
    }
  })

  test('fail when csrf encrypted header value is incorrect', async (assert) => {
    assert.plan(1)

    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtx()
    await ctx.session.initiate(false)

    ctx.request.request.method = 'POST'
    ctx.request.request.headers = {
      'x-xsrf-token': 'hello world',
    }

    try {
      await middlewareFn(ctx)
    } catch (error) {
      assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
    }
  })

  test('fail when csrf secret session is missing', async (assert) => {
    assert.plan(1)

    const middlewareFn = csrf({ enabled: true }, APPLICATION_SECRET_KEY)
    const ctx = getCtx()
    await ctx.session.initiate(false)

    const csrfMiddleware = new CsrfFactory(ctx.session, { enabled: true }, APPLICATION_SECRET_KEY)
    const csrfSecret = await csrfMiddleware.getCsrfSecret()
    const csrfToken = csrfMiddleware.generateCsrfToken(csrfSecret)

    ctx.request.request.method = 'PATCH'
    ctx.request.updateBody({ _csrf: csrfToken })
    ctx.session.forget('csrf-secret')

    try {
      await middlewareFn(ctx)
    } catch (error) {
      assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
    }
  })

  test('generate csrf token and share it with request, cookie, and views', async (assert) => {
    await fs.add('token.edge', '{{ csrfToken }}')
    await fs.add('token-meta.edge', '{{ csrfMeta() }}')
    await fs.add('token-function.edge', '{{ csrfField() }}')

    const ctx = getCtx()
    await ctx.session.initiate(false)
    ctx.request.request.method = 'GET'

    const config = { enabled: true, exceptRoutes: ['/'] }

    const csrfMiddleware = new CsrfFactory(ctx.session, config, APPLICATION_SECRET_KEY)
    await csrfMiddleware.handle(ctx)

    assert.isDefined(ctx.request.csrfToken)
    Csrf.verify(ctx.session.get('csrf-secret'), ctx.request.csrfToken)

    assert.equal(
      ctx.view.render('token').trim(),
      ctx.request.csrfToken
    )

    assert.equal(
      ctx.view.render('token-meta').trim(),
      `<meta name='csrf-token' content='${ctx.request.csrfToken}'>`,
    )

    assert.equal(
      ctx.view.render('token-function').trim(),
      `<input type='hidden' name='_csrf' value='${ctx.request.csrfToken}'>`,
    )
  })
})
