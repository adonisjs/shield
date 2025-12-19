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
import { EncryptionFactory } from '@adonisjs/core/factories/encryption'

import { setup } from './helpers.ts'
import { csrfFactory } from '../src/guards/csrf.ts'
import { E_BAD_CSRF_TOKEN } from '../src/errors.ts'
import { I18nManagerFactory } from '@adonisjs/i18n/factories'

const tokens = new Tokens()

test.group('Csrf', () => {
  test('return noop function when enabled is false', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const csrf = csrfFactory({ enabled: false }, new EncryptionFactory().create())

    csrf(ctx)
    assert.isUndefined(ctx.request.csrfToken)
  })

  test('validate csrf token on a request', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'POST'
    })

    const csrf = csrfFactory({ enabled: true }, new EncryptionFactory().create())
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('skip validation when request method is not one of allowed methods', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PUT'
    })

    const csrf = csrfFactory(
      { enabled: true, methods: ['POST', 'PATCH', 'DELETE'] },
      new EncryptionFactory().create()
    )

    await assert.doesNotReject(() => csrf(ctx))
    assert.isDefined(ctx.request.csrfToken)
  })

  test('enforce validation request method is part of allowed methods', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PATCH'
    })

    const csrf = csrfFactory(
      { enabled: true, methods: ['POST', 'PATCH', 'DELETE'] },
      new EncryptionFactory().create()
    )
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('skip validation when request route is ignored', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()
    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PATCH'
    })

    const csrf = csrfFactory(
      { enabled: true, exceptRoutes: ['/users/:id'] },
      new EncryptionFactory().create()
    )

    await assert.doesNotRejects(() => csrf(ctx))
    assert.isDefined(ctx.request.csrfToken)
  })

  test('skip validation when request route is ignored using a callback', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PATCH'
    })

    const csrf = csrfFactory(
      { enabled: true, exceptRoutes: () => true },
      new EncryptionFactory().create()
    )

    await assert.doesNotRejects(() => csrf(ctx))
    assert.isDefined(ctx.request.csrfToken)
  })

  test('validate when request route is not ignored', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, () => {
      ctx.route = { pattern: '/users/:id' } as any
      ctx.params = { id: 12453 }
      ctx.request.request.method = 'PATCH'
    })

    const csrf = csrfFactory(
      { enabled: true, exceptRoutes: ['posts/:post/store'] },
      new EncryptionFactory().create()
    )
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('work fine when csrf token is provided as an input', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      ctx.session.put('csrf-secret', secret)

      const csrfToken = tokens.create(secret)
      ctx.request.updateBody({ _csrf: csrfToken })
    })

    const csrf = csrfFactory({ enabled: true }, new EncryptionFactory().create())
    await assert.doesNotRejects(() => csrf(ctx))
  })

  test('work fine when csrf token is provided as a header', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

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

    const csrf = csrfFactory({ enabled: true }, new EncryptionFactory().create())
    await assert.doesNotRejects(() => csrf(ctx))
  })

  test('work fine when csrf token is provided as an encrypted token', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      ctx.session.put('csrf-secret', secret)

      const csrfToken = tokens.create(secret)
      ctx.request.request.headers = {
        'x-xsrf-token': `e:${new EncryptionFactory().create().encrypt(csrfToken, undefined, 'XSRF-TOKEN')!}`,
      }
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: true },
      new EncryptionFactory().create()
    )
    await assert.doesNotRejects(() => csrf(ctx))
  })

  test('fail when csrf input value is incorrect', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'
      ctx.request.updateBody({ _csrf: 'foo' })
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: true },
      new EncryptionFactory().create()
    )
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf header value is incorrect', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'
      ctx.request.request.headers = {
        'x-csrf-token': 'foo',
      }
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: true },
      new EncryptionFactory().create()
    )
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf encrypted header value is incorrect', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'
      ctx.request.request.headers = {
        'x-xsrf-token': 'hello world',
      }
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: true },
      new EncryptionFactory().create()
    )
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf encrypted header is valid but cookie feature is disabled', async ({
    assert,
  }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      ctx.session.put('csrf-secret', secret)

      const csrfToken = tokens.create(secret)
      ctx.request.request.headers = {
        'x-xsrf-token': `e:${new EncryptionFactory().create().encrypt(csrfToken, undefined, 'XSRF-TOKEN')!}`,
      }
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: false },
      new EncryptionFactory().create()
    )
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('fail when csrf secret session is missing', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      const csrfToken = tokens.create(secret)
      ctx.request.updateBody({ _csrf: csrfToken })
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: false },
      new EncryptionFactory().create()
    )
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
  })

  test('share CSRF token with templates and request', async ({ assert }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()
    const secret = await tokens.secret()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'GET'

      ctx.session.put('csrf-secret', secret)
    })

    const csrf = csrfFactory(
      { enabled: true, exceptRoutes: ['/'] },
      new EncryptionFactory().create(),
      Edge.create()
    )
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

  test('share CSRF token with templates and request even when request fails', async ({
    assert,
  }) => {
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      const csrfToken = tokens.create(secret)
      ctx.request.updateBody({ _csrf: csrfToken })
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: false },
      new EncryptionFactory().create(),
      Edge.create()
    )
    await assert.rejects(async () => csrf(ctx), new E_BAD_CSRF_TOKEN().message)
    assert.exists(ctx.request.csrfToken)

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
    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()
    const secret = await tokens.secret()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'GET'

      ctx.session.put('csrf-secret', secret)
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: true, exceptRoutes: ['/'] },
      new EncryptionFactory().create(),
      Edge.create()
    )
    await csrf(ctx)

    const cookieHeader = String(ctx.response.getHeader('set-cookie'))
    const cookie = decodeURIComponent(cookieHeader).match(/XSRF-TOKEN=e:[^;]+/)![0]

    assert.equal(
      new EncryptionFactory().create().decrypt(cookie.replace('XSRF-TOKEN=e:', ''), 'XSRF-TOKEN'),
      ctx.request.csrfToken
    )
  })

  test('flash CSRF error message via flash messages', async ({ assert }) => {
    assert.plan(1)

    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'

      const secret = await tokens.secret()
      const csrfToken = tokens.create(secret)
      ctx.request.updateBody({ _csrf: csrfToken })
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: false },
      new EncryptionFactory().create()
    )
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

  test('get error message from i18n', async ({ assert }) => {
    assert.plan(1)

    await setup()
    const ctx = new HttpContextFactory().create()

    const middleware = await new SessionMiddlewareFactory().create()

    const i18nManager = new I18nManagerFactory()
      .merge({
        config: {
          loaders: [
            () => {
              return {
                async load() {
                  return {
                    en: {
                      'errors.E_BAD_CSRF_TOKEN': 'Session expired',
                    },
                  }
                },
              }
            },
          ],
        },
      })
      .create()

    await middleware.handle(ctx, async () => {
      ctx.route = { pattern: '/' } as any
      ctx.request.request.method = 'PATCH'
      await i18nManager.loadTranslations()
      ctx.i18n = i18nManager.locale('en')

      const secret = await tokens.secret()
      const csrfToken = tokens.create(secret)
      ctx.request.updateBody({ _csrf: csrfToken })
    })

    const csrf = csrfFactory(
      { enabled: true, enableXsrfCookie: false },
      new EncryptionFactory().create()
    )
    try {
      await csrf(ctx)
    } catch (error) {
      await error.handle(error, ctx)
      assert.deepEqual(ctx.session.responseFlashMessages.all(), {
        errorsBag: {
          E_BAD_CSRF_TOKEN: 'Session expired',
        },
        input: {},
      })
    }
  })
})
