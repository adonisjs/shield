/* eslint-disable unicorn/no-await-expression-member */

/*
 * @adonisjs/shield
 *
 * (c) ? (Please advice before merge, thanks!)
 *
 * For the full copyright and license information, please app.container.use('Adonis/Core/View') the LICENSE
 * file that was distributed with this source code.
 */

import Tokens from 'csrf'
import { Edge } from 'edge.js'
import { test } from '@japa/runner'
import { HttpContextFactory } from '@adonisjs/core/factories/http'
import { SessionMiddlewareFactory } from '@adonisjs/session/factories'

import { setup } from './helpers.js'
import { csrfFactory } from '../src/guards/csrf.js'
import { E_BAD_CSRF_TOKEN } from '../src/errors.js'

const tokens = new Tokens()

test.group('Csrf', () => {
  test('return noop function when enabled is false', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()

    const csrf = csrfFactory({ enabled: false }, await app.container.make('encryption'))

    csrf(ctx)
    assert.isUndefined(ctx.request.csrfToken)
  })

  test('validate csrf token on a request', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'POST'
    })

    const csrf = csrfFactory({ enabled: true }, encrpytion)
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('skip validation when request method is not one of allowed methods', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PUT'
    })

    const csrf = csrfFactory({ enabled: true, methods: ['POST', 'PATCH', 'DELETE'] }, encrpytion)

    await assert.doesNotRejects(() => csrf(ctx))
    assert.isDefined(ctx.request.csrfToken)
  })

  test('enforce validation request method is part of allowed methods', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PATCH'
    })

    const csrf = csrfFactory({ enabled: true, methods: ['POST', 'PATCH', 'DELETE'] }, encrpytion)
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('skip validation when request route is ignored', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PATCH'
    })

    const csrf = csrfFactory({ enabled: true, exceptRoutes: ['/users/:id'] }, encrpytion)

    await assert.doesNotRejects(() => csrf(ctx))
    assert.isDefined(ctx.request.csrfToken)
  })

  test('skip validation when request route is ignored using a callback', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PATCH'
    })

    const csrf = csrfFactory({ enabled: true, exceptRoutes: () => true }, encrpytion)

    await assert.doesNotRejects(() => csrf(ctx))
    assert.isDefined(ctx.request.csrfToken)
  })

  test('validate when request route is not ignored', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PATCH'
    })

    const csrf = csrfFactory({ enabled: true, exceptRoutes: ['posts/:post/store'] }, encrpytion)
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('work fine when csrf token is provided as an input', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      ctx.session.put('csrf-secret', secret)

      const csrfToken = tokens.create(secret)
      ctx.request.updateBody({ _csrf: csrfToken })
    })

    const csrf = csrfFactory({ enabled: true }, encrpytion)
    await assert.doesNotRejects(() => csrf(ctx))
  })

  test('work fine when csrf token is provided as a header', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      ctx.session.put('csrf-secret', secret)

      const csrfToken = tokens.create(secret)
      ctx.request.request.headers = {
        'x-csrf-token': csrfToken,
      }
    })

    const csrf = csrfFactory({ enabled: true }, encrpytion)
    await assert.doesNotRejects(() => csrf(ctx))
  })

  test('work fine when csrf token is provided as an encrypted token', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      ctx.session.put('csrf-secret', secret)

      const csrfToken = tokens.create(secret)
      ctx.request.request.headers = {
        'x-xsrf-token': `e:${encrpytion.encrypt(csrfToken, undefined, 'XSRF-TOKEN')!}`,
      }
    })

    const csrf = csrfFactory({ enabled: true, enableXsrfCookie: true }, encrpytion)
    await assert.doesNotRejects(() => csrf(ctx))
  })

  test('fail when csrf input value is incorrect', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'
      ctx.request.updateBody({ _csrf: 'foo' })
    })

    const csrf = csrfFactory({ enabled: true, enableXsrfCookie: true }, encrpytion)
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf header value is incorrect', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'
      ctx.request.request.headers = {
        'x-csrf-token': 'foo',
      }
    })

    const csrf = csrfFactory({ enabled: true, enableXsrfCookie: true }, encrpytion)
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf encrypted header value is incorrect', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'
      ctx.request.request.headers = {
        'x-xsrf-token': 'hello world',
      }
    })

    const csrf = csrfFactory({ enabled: true, enableXsrfCookie: true }, encrpytion)
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf encrypted header is valid but cookie feature is disabled', async ({
    assert,
  }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      ctx.session.put('csrf-secret', secret)

      const csrfToken = tokens.create(secret)
      ctx.request.request.headers = {
        'x-xsrf-token': `e:${encrpytion.encrypt(csrfToken, undefined, 'XSRF-TOKEN')!}`,
      }
    })

    const csrf = csrfFactory({ enabled: true, enableXsrfCookie: false }, encrpytion)
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf secret session is missing', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      const csrfToken = tokens.create(secret)
      ctx.request.updateBody({ _csrf: csrfToken })
    })

    const csrf = csrfFactory({ enabled: true, enableXsrfCookie: false }, encrpytion)
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('share CSRF token with templates and request', async ({ assert }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()
    const secret = await tokens.secret()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'GET'

      ctx.session.put('csrf-secret', secret)
    })

    const csrf = csrfFactory({ enabled: true, exceptRoutes: ['/'] }, encrpytion, Edge.create())
    await csrf(ctx)

    assert.isDefined(ctx.request.csrfToken)
    assert.isTrue(tokens.verify(secret, ctx.request.csrfToken))

    assert.equal(await ctx.view.renderRaw('{{ csrfToken }}'), ctx.request.csrfToken)

    assert.equal(
      await ctx.view.renderRaw('{{ csrfMeta() }}'),
      `<meta name='csrf-token' content='${ctx.request.csrfToken}'>`
    )

    assert.equal(
      await ctx.view.renderRaw('{{ csrfField() }}'),
      `<input type='hidden' name='_csrf' value='${ctx.request.csrfToken}'>`
    )
  })

  test('generate csrf token and share as a cookie when enableXsrfCookie is true', async ({
    assert,
  }) => {
    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()
    const secret = await tokens.secret()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'GET'

      ctx.session.put('csrf-secret', secret)
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: true, exceptRoutes: ['/'] },
      encrpytion,
      Edge.create()
    )
    await csrf(ctx)

    const cookieHeader = String(ctx.response.getHeader('set-cookie'))
    const cookie = decodeURIComponent(cookieHeader).match(/XSRF-TOKEN=e:[^;]+/)![0]

    assert.equal(
      encrpytion.decrypt(cookie.replace('XSRF-TOKEN=e:', ''), 'XSRF-TOKEN'),
      ctx.request.csrfToken
    )
  })

  test('flash CSRF error message via flash messages', async ({ assert }) => {
    assert.plan(1)

    const app = await setup()
    const ctx = new HttpContextFactory().create()
    const encrpytion = await app.container.make('encryption')
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      const csrfToken = tokens.create(secret)
      ctx.request.updateBody({ _csrf: csrfToken })
    })

    const csrf = csrfFactory({ enabled: true, enableXsrfCookie: false }, encrpytion)
    try {
      await csrf(ctx)
    } catch (error) {
      await error.handle(error, ctx)
      assert.deepEqual(ctx.session.responseFlashMessages.all(), {
        errorsBag: {
          E_BAD_CSRF_TOKEN: 'Invalid or expired CSRF token',
        },
        input: {},
      })
    }
  })
})
