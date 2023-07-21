/* eslint-disable unicorn/no-await-expression-member */

/*
 * @adonisjs/shield
 *
 * (c) ? (Please advice before merge, thanks!)
 *
 * For the full copyright and license information, please app.container.use('Adonis/Core/View') the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import Tokens from 'csrf'

import { csrfFactory } from '../src/defenses/csrf.js'
import { setup } from '../test_helpers/index.js'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import { E_BAD_CSRF_TOKEN } from '../src/exceptions.js'

const tokens = new Tokens()

test.group('Csrf', () => {
  test('return noop function when enabled is false', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()

    const csrf = csrfFactory(
      { enabled: false },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    await ctx.session.initiate(false)

    csrf(ctx)
    assert.isUndefined(ctx.request.csrfToken)
  })

  test('validate csrf token on a request', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any

    const csrf = csrfFactory(
      { enabled: true },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    await ctx.session.initiate(false)
    ctx.request.request.method = 'POST'

    await assert.rejects(async () => await csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('skip validation when request method is not one of whitelisted methods', async ({
    assert,
  }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/users/:id' } as any
    ctx.params = { id: 12453 }

    const csrf = csrfFactory(
      { enabled: true, methods: ['POST', 'PATCH', 'DELETE'] },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    await ctx.session.initiate(false)
    ctx.request.request.method = 'PUT'

    await csrf(ctx)
    assert.isDefined(ctx.request.csrfToken)
  })

  test('enforce validation request method is part of whitelisted methods', async ({ assert }) => {
    const app = await setup()

    const csrf = csrfFactory(
      { enabled: true, methods: ['POST', 'PATCH', 'DELETE'] },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/users/:id' } as any
    ctx.params = { id: 12453 }

    await ctx.session.initiate(false)
    ctx.request.request.method = 'PATCH'

    await assert.rejects(async () => await csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('skip validation when request route is inside the exceptRoutes list', async ({ assert }) => {
    const app = await setup()

    const csrf = csrfFactory(
      { enabled: true, exceptRoutes: ['/users/:id'] },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/users/:id' } as any
    ctx.params = { id: 12453 }

    await ctx.session.initiate(false)
    ctx.request.request.method = 'PATCH'

    await csrf(ctx)
    assert.isDefined(ctx.request.csrfToken)
  })

  test('validate when request route is not inside the exceptRoutes list', async ({ assert }) => {
    assert.plan(2)
    const app = await setup()

    const csrf = csrfFactory(
      { enabled: true, exceptRoutes: ['posts/:post/store'] },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/users/:id' } as any
    ctx.params = { id: 12453 }

    await ctx.session.initiate(false)
    ctx.request.request.method = 'PATCH'

    try {
      await csrf(ctx)
    } catch (error) {
      assert.isUndefined(ctx.request.csrfToken)
      assert.equal(error.message, 'Invalid CSRF Token')
    }
  })

  test('work fine when csrf token is provided as an input', async () => {
    const app = await setup()
    const csrf = csrfFactory(
      { enabled: true },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any

    await ctx.session.initiate(false)

    const secret = await tokens.secret()
    ctx.session.put('csrf-secret', secret)
    const csrfToken = tokens.create(secret)

    ctx.request.request.method = 'PATCH'
    ctx.request.updateBody({ _csrf: csrfToken })

    await csrf(ctx)
  })

  test('work fine when csrf token is provided as a header', async () => {
    const app = await setup()
    const csrf = csrfFactory(
      { enabled: true },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any
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
    const app = await setup()
    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: true },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any
    await ctx.session.initiate(false)

    const secret = await tokens.secret()
    ctx.session.put('csrf-secret', secret)
    const csrfToken = tokens.create(secret)

    const encrpytion = await app.container.make('encryption')
    ctx.request.request.method = 'PATCH'
    ctx.request.request.headers = {
      'x-xsrf-token': `e:${encrpytion.encrypt(csrfToken, undefined, 'XSRF-TOKEN')!}`,
    }

    await csrf(ctx)
  })

  test('fail when csrf input value is incorrect', async ({ assert }) => {
    const app = await setup()
    const csrf = csrfFactory(
      { enabled: true },
      await app.container.make('encryption'),
      await app.container.make('view')
    )
    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any
    await ctx.session.initiate(false)

    ctx.request.request.method = 'POST'
    ctx.request.updateBody({ _csrf: 'hello world' })

    await assert.rejects(async () => await csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf header value is incorrect', async ({ assert }) => {
    assert.plan(1)

    const app = await setup()
    const csrf = csrfFactory(
      { enabled: true },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any
    await ctx.session.initiate(false)

    ctx.request.request.method = 'POST'
    ctx.request.request.headers = {
      'x-csrf-token': 'hello world',
    }

    await assert.rejects(async () => await csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf encrypted header value is incorrect', async ({ assert }) => {
    const app = await setup()
    const csrf = csrfFactory(
      { enabled: true },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any
    await ctx.session.initiate(false)

    ctx.request.request.method = 'POST'
    ctx.request.request.headers = {
      'x-xsrf-token': 'hello world',
    }

    await assert.rejects(async () => await csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf encrypted header is not an encrypted cookie', async ({ assert }) => {
    const app = await setup()
    const csrf = csrfFactory(
      { enabled: true },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any

    await ctx.session.initiate(false)

    const secret = await tokens.secret()
    ctx.session.put('csrf-secret', secret)
    const csrfToken = tokens.create(secret)

    ctx.request.request.method = 'PATCH'
    ctx.request.request.headers = {
      'x-xsrf-token': csrfToken,
    }

    await assert.rejects(async () => await csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf encrypted header is valid but cookie feature is disabled', async ({
    assert,
  }) => {
    const app = await setup()

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: false },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any

    await ctx.session.initiate(false)

    const secret = await tokens.secret()
    ctx.session.put('csrf-secret', secret)
    const csrfToken = tokens.create(secret)

    const encryption = await app.container.make('encryption')
    ctx.request.request.method = 'PATCH'
    ctx.request.request.headers = {
      'x-xsrf-token': `e:${encryption.encrypt(csrfToken, undefined, 'XSRF-TOKEN')}`,
    }

    await assert.rejects(async () => await csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf secret session is missing', async ({ assert }) => {
    assert.plan(1)

    const app = await setup()

    const csrf = csrfFactory(
      { enabled: true },
      await app.container.make('encryption'),
      await app.container.make('view')
    )
    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any

    await ctx.session.initiate(false)

    const secret = await tokens.secret()
    const csrfToken = tokens.create(secret)

    ctx.request.request.method = 'PATCH'
    ctx.request.updateBody({ _csrf: csrfToken })

    await assert.rejects(async () => await csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('generate csrf token and share it with request and view', async ({ fs, assert }) => {
    await fs.create('resources/views/token.edge', '{{ csrfToken }}')
    await fs.create('resources/views/token-meta.edge', '{{ csrfMeta() }}')
    await fs.create('resources/views/token-function.edge', '{{ csrfField() }}')

    const app = await setup()
    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any

    await ctx.session.initiate(false)
    ctx.request.request.method = 'GET'

    const csrf = csrfFactory(
      { enabled: true, exceptRoutes: ['/'] },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    await csrf(ctx)

    assert.isDefined(ctx.request.csrfToken)
    tokens.verify(ctx.session.get('csrf-secret'), ctx.request.csrfToken)

    assert.equal((await ctx.view.render('token')).trim(), ctx.request.csrfToken)

    assert.equal(
      (await ctx.view.render('token-meta')).trim(),
      `<meta name='csrf-token' content='${ctx.request.csrfToken}'>`
    )

    assert.equal(
      (await ctx.view.render('token-function')).trim(),
      `<input type='hidden' name='_csrf' value='${ctx.request.csrfToken}'>`
    )
  })

  test('generate csrf token and share as a cookie when enableXsrfCookie is true', async ({
    assert,
    fs,
  }) => {
    await fs.create('token.edge', '{{ csrfToken }}')
    await fs.create('token-meta.edge', '{{ csrfMeta() }}')
    await fs.create('token-function.edge', '{{ csrfField() }}')

    const app = await setup()
    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/' } as any

    await ctx.session.initiate(false)
    ctx.request.request.method = 'GET'

    const csrf = csrfFactory(
      {
        enabled: true,
        exceptRoutes: ['/'],
        enableXsrfCookie: true,
      },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    await csrf(ctx)

    const cookie = decodeURIComponent(String(ctx.response.getHeader('set-cookie'))).match(
      /XSRF-TOKEN=e:[^;]+/
    )![0]
    const encryption = await app.container.make('encryption')
    assert.isDefined(ctx.request.csrfToken)
    tokens.verify(ctx.session.get('csrf-secret'), ctx.request.csrfToken)
    assert.equal(
      encryption.decrypt(cookie.replace('XSRF-TOKEN=e:', ''), 'XSRF-TOKEN'),
      ctx.request.csrfToken
    )
  })

  test('skip validation when except routes callback returns true', async ({ assert }) => {
    assert.plan(1)

    const app = await setup()
    const csrf = csrfFactory(
      {
        enabled: true,
        exceptRoutes: ({ request }) => request.url().startsWith('/users'),
      },
      await app.container.make('encryption'),
      await app.container.make('view')
    )

    const ctx = new HttpContextFactory().create()
    ctx.route = { pattern: '/users/:id' } as any
    ctx.request.url = () => '/users/12453'
    ctx.params = { id: 12453 }

    await ctx.session.initiate(false)
    ctx.request.request.method = 'PATCH'

    await csrf(ctx)
    assert.isDefined(ctx.request.csrfToken)
  })
})
