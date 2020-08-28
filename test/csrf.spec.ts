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
import { Filesystem } from '@poppinss/dev-utils'

import { csrfFactory } from '../src/csrf'
import { getCtx, viewsDir, view, encryption, setup } from '../test-helpers'

const tokens = new Tokens()
const fs = new Filesystem(viewsDir)

test.group('Csrf', (group) => {
	group.before(async () => {
		await setup()
	})

	group.afterEach(async () => {
		await fs.cleanup()
	})

	test('return noop function when enabled is false', async (assert) => {
		const csrf = csrfFactory({ enabled: false }, encryption, view)
		const ctx = getCtx()
		await ctx.session.initiate(false)

		csrf(ctx)
		assert.isUndefined(ctx.request.csrfToken)
	})

	test('validate csrf token on a request', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory({ enabled: true }, encryption, view)
		const ctx = getCtx()

		await ctx.session.initiate(false)
		ctx.request.request.method = 'POST'

		try {
			await csrf(ctx)
		} catch (error) {
			assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
		}
	})

	test('skip validation when request method is not one of whitelisted methods', async (assert) => {
		const csrf = csrfFactory(
			{ enabled: true, methods: ['POST', 'PATCH', 'DELETE'] },
			encryption,
			view
		)

		const ctx = getCtx('/users/:id', { id: 12453 })
		await ctx.session.initiate(false)
		ctx.request.request.method = 'PUT'

		await csrf(ctx)
		assert.isDefined(ctx.request.csrfToken)
	})

	test('enforce validation request method is part of whitelisted methods', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory(
			{ enabled: true, methods: ['POST', 'PATCH', 'DELETE'] },
			encryption,
			view
		)

		const ctx = getCtx('/users/:id', { id: 12453 })
		await ctx.session.initiate(false)
		ctx.request.request.method = 'PATCH'

		try {
			await csrf(ctx)
		} catch (error) {
			assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
		}
	})

	test('skip validation when request route is inside the exceptRoutes list', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory({ enabled: true, exceptRoutes: ['/users/:id'] }, encryption, view)

		const ctx = getCtx('/users/:id', { id: 12453 })
		await ctx.session.initiate(false)
		ctx.request.request.method = 'PATCH'

		await csrf(ctx)
		assert.isDefined(ctx.request.csrfToken)
	})

	test('validate when request route is not inside the exceptRoutes list', async (assert) => {
		assert.plan(2)

		const csrf = csrfFactory(
			{ enabled: true, exceptRoutes: ['posts/:post/store'] },
			encryption,
			view
		)

		const ctx = getCtx('/users/:id', { id: 12453 })
		await ctx.session.initiate(false)
		ctx.request.request.method = 'PATCH'

		try {
			await csrf(ctx)
		} catch (error) {
			assert.isUndefined(ctx.request.csrfToken)
			assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
		}
	})

	test('work fine when csrf token is provided as an input', async () => {
		const csrf = csrfFactory({ enabled: true }, encryption, view)

		const ctx = getCtx('/')
		await ctx.session.initiate(false)

		const secret = await tokens.secret()
		ctx.session.put('csrf-secret', secret)
		const csrfToken = tokens.create(secret)

		ctx.request.request.method = 'PATCH'
		ctx.request.updateBody({ _csrf: csrfToken })

		await csrf(ctx)
	})

	test('work fine when csrf token is provided as a header', async () => {
		const csrf = csrfFactory({ enabled: true }, encryption, view)

		const ctx = getCtx('/')
		await ctx.session.initiate(false)

		const secret = await tokens.secret()
		ctx.session.put('csrf-secret', secret)
		const csrfToken = tokens.create(secret)

		ctx.request.request.method = 'PATCH'
		ctx.request.request.headers = {
			'x-csrf-token': csrfToken,
		}

		await csrf(ctx)
	})

	test('work fine when csrf token is provided as an encrypted token', async () => {
		const csrf = csrfFactory({ enabled: true, enableXsrfCookie: true }, encryption, view)

		const ctx = getCtx('/')
		await ctx.session.initiate(false)

		const secret = await tokens.secret()
		ctx.session.put('csrf-secret', secret)
		const csrfToken = tokens.create(secret)

		ctx.request.request.method = 'PATCH'
		ctx.request.request.headers = {
			'x-xsrf-token': `e:${encryption.encrypt(csrfToken, undefined, 'xsrf-token')!}`,
		}

		await csrf(ctx)
	})

	test('fail when csrf input value is incorrect', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory({ enabled: true }, encryption, view)
		const ctx = getCtx()
		await ctx.session.initiate(false)

		ctx.request.request.method = 'POST'
		ctx.request.updateBody({ _csrf: 'hello world' })

		try {
			await csrf(ctx)
		} catch (error) {
			assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
		}
	})

	test('fail when csrf header value is incorrect', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory({ enabled: true }, encryption, view)
		const ctx = getCtx()
		await ctx.session.initiate(false)

		ctx.request.request.method = 'POST'
		ctx.request.request.headers = {
			'x-csrf-token': 'hello world',
		}

		try {
			await csrf(ctx)
		} catch (error) {
			assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
		}
	})

	test('fail when csrf encrypted header value is incorrect', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory({ enabled: true }, encryption, view)
		const ctx = getCtx()
		await ctx.session.initiate(false)

		ctx.request.request.method = 'POST'
		ctx.request.request.headers = {
			'x-xsrf-token': 'hello world',
		}

		try {
			await csrf(ctx)
		} catch (error) {
			assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
		}
	})

	test('fail when csrf encrypted header is not an encrypted cookie', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory({ enabled: true }, encryption, view)
		const ctx = getCtx('/')
		await ctx.session.initiate(false)

		const secret = await tokens.secret()
		ctx.session.put('csrf-secret', secret)
		const csrfToken = tokens.create(secret)

		ctx.request.request.method = 'PATCH'
		ctx.request.request.headers = {
			'x-xsrf-token': csrfToken,
		}

		try {
			await csrf(ctx)
		} catch (error) {
			assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
		}
	})

	test('fail when csrf encrypted header is valid but cookie feature is disabled', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory({ enabled: true, enableXsrfCookie: false }, encryption, view)
		const ctx = getCtx('/')
		await ctx.session.initiate(false)

		const secret = await tokens.secret()
		ctx.session.put('csrf-secret', secret)
		const csrfToken = tokens.create(secret)

		ctx.request.request.method = 'PATCH'
		ctx.request.request.headers = {
			'x-xsrf-token': `e:${encryption.encrypt(csrfToken, undefined, 'xsrf-token')}`,
		}

		try {
			await csrf(ctx)
		} catch (error) {
			assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
		}
	})

	test('fail when csrf secret session is missing', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory({ enabled: true }, encryption, view)
		const ctx = getCtx()
		await ctx.session.initiate(false)

		const secret = await tokens.secret()
		const csrfToken = tokens.create(secret)

		ctx.request.request.method = 'PATCH'
		ctx.request.updateBody({ _csrf: csrfToken })

		try {
			await csrf(ctx)
		} catch (error) {
			assert.equal(error.message, 'E_BAD_CSRF_TOKEN: Invalid CSRF Token')
		}
	})

	test('generate csrf token and share it with request and views', async (assert) => {
		await fs.add('token.edge', '{{ csrfToken }}')
		await fs.add('token-meta.edge', '{{ csrfMeta() }}')
		await fs.add('token-function.edge', '{{ csrfField() }}')

		const ctx = getCtx()
		await ctx.session.initiate(false)
		ctx.request.request.method = 'GET'

		const csrf = csrfFactory({ enabled: true, exceptRoutes: ['/'] }, encryption, view)
		await csrf(ctx)

		assert.isDefined(ctx.request.csrfToken)
		tokens.verify(ctx.session.get('csrf-secret'), ctx.request.csrfToken)

		assert.equal(ctx.view.render('token').trim(), ctx.request.csrfToken)

		assert.equal(
			ctx.view.render('token-meta').trim(),
			`<meta name='csrf-token' content='${ctx.request.csrfToken}'>`
		)

		assert.equal(
			ctx.view.render('token-function').trim(),
			`<input type='hidden' name='_csrf' value='${ctx.request.csrfToken}'>`
		)
	})

	test('generate csrf token and share as a cookie when enableXsrfCookie is true', async (assert) => {
		await fs.add('token.edge', '{{ csrfToken }}')
		await fs.add('token-meta.edge', '{{ csrfMeta() }}')
		await fs.add('token-function.edge', '{{ csrfField() }}')

		const ctx = getCtx()
		await ctx.session.initiate(false)
		ctx.request.request.method = 'GET'

		const csrf = csrfFactory(
			{
				enabled: true,
				exceptRoutes: ['/'],
				enableXsrfCookie: true,
			},
			encryption,
			view
		)

		await csrf(ctx)
		const cookie = decodeURIComponent(String(ctx.response.getHeader('set-cookie')))

		assert.isDefined(ctx.request.csrfToken)
		tokens.verify(ctx.session.get('csrf-secret'), ctx.request.csrfToken)
		assert.equal(
			encryption.decrypt(cookie.replace('xsrf-token=e:', ''), 'xsrf-token'),
			ctx.request.csrfToken
		)
	})

	test('skip validation when except routes callback returns true', async (assert) => {
		assert.plan(1)

		const csrf = csrfFactory(
			{
				enabled: true,
				exceptRoutes: ({ request }) => request.url().startsWith('/users'),
			},
			encryption,
			view
		)

		const ctx = getCtx('/users/:id', { id: 12453 })
		await ctx.session.initiate(false)
		ctx.request.request.method = 'PATCH'

		await csrf(ctx)
		assert.isDefined(ctx.request.csrfToken)
	})
})
