/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'

import { httpServer, setup } from './helpers.ts'
import { defineConfig } from '../src/define_config.ts'
import ShieldMiddleware from '../src/shield_middleware.ts'

const shieldConfig = defineConfig({
  csrf: { enabled: true, methods: ['POST', 'PUT', 'PATCH', 'DELETE'] },
  xFrame: { enabled: true, action: 'DENY' },
  contentTypeSniffing: { enabled: true },
})

test.group('Shield provider', () => {
  test('construct the middleware only once', async ({ assert }) => {
    const app = await setup({ shield: shieldConfig })

    let constructions = 0
    app.container.resolving(ShieldMiddleware, () => {
      constructions++
    })

    const first = await app.container.make(ShieldMiddleware)
    const second = await app.container.make(ShieldMiddleware)
    const fromResolver = await app.container.createResolver().make(ShieldMiddleware)

    assert.instanceOf(first, ShieldMiddleware)
    assert.strictEqual(first, second)
    assert.strictEqual(first, fromResolver)
    assert.equal(constructions, 1)
  })

  test('reuse the middleware instance across HTTP requests', async ({ assert }) => {
    const app = await setup({ shield: shieldConfig })

    let constructions = 0
    app.container.resolving(ShieldMiddleware, () => {
      constructions++
    })

    const router = await app.container.make('router')
    router.use([
      () => import('@adonisjs/session/session_middleware'),
      () => import('../src/shield_middleware.ts'),
    ])
    router.get('/', ({ request }) => ({ token: request.csrfToken }))
    router.post('/', () => 'ok')

    const server = await app.container.make('server')
    await server.boot()

    const nodeServer = httpServer.create(server.handle.bind(server))
    await new Promise<void>((resolve) => nodeServer.listen(0, resolve))
    const { port } = nodeServer.address() as { port: number }
    const url = `http://localhost:${port}/`

    const getResponse = await fetch(url)
    assert.equal(getResponse.status, 200)
    assert.equal(getResponse.headers.get('x-frame-options'), 'DENY')
    assert.equal(getResponse.headers.get('x-content-type-options'), 'nosniff')
    const body = (await getResponse.json()) as { token: string }
    assert.isString(body.token)

    const postResponse = await fetch(url, { method: 'POST' })
    assert.equal(postResponse.status, 403)

    await fetch(url)
    assert.equal(constructions, 1)
  })
})
