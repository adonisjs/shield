/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Tokens from 'csrf'
import getPort from 'get-port'
import { test } from '@japa/runner'
import { SessionMiddlewareFactory } from '@adonisjs/session/factories'
import { HttpContextFactory, RequestFactory, ResponseFactory } from '@adonisjs/core/factories/http'

import { CsrfGuard } from '../../src/guards/csrf.js'
import { httpServer, runJapaTest, setup } from '../helpers.js'

test.group('Api client', () => {
  test('set csrf token session and the header', async ({ assert }) => {
    const app = await setup()

    const server = httpServer.create(async (req, res) => {
      const encryption = await app.container.make('encryption')
      const request = new RequestFactory().merge({ req, res, encryption }).create()
      const response = new ResponseFactory().merge({ req, res, encryption }).create()
      const ctx = new HttpContextFactory().merge({ request, response }).create()
      const middleware = await new SessionMiddlewareFactory()
        .merge({
          config: {
            store: 'memory',
            stores: {},
          },
        })
        .create()

      try {
        await middleware.handle(ctx, async () => {
          ctx.route = { pattern: '/' } as any
          ctx.request.request.method = 'POST'

          assert.property(ctx.session.all(), 'csrf-secret')
          assert.property(ctx.request.headers(), 'x-csrf-token')

          assert.isTrue(
            new Tokens().verify(ctx.session.get('csrf-secret'), ctx.request.header('x-csrf-token')!)
          )

          const guard = new CsrfGuard({ enabled: true }, encryption)
          await guard.handle(ctx)
        })
      } catch (error) {
        response.status(500).send(error)
      } finally {
        response.finish()
      }
    })

    const port = await getPort({ port: 3333 })
    const url = `http://localhost:${port}`
    server.listen(port)

    await runJapaTest(app, async ({ client }) => {
      await client.get(url).withCsrfToken()
    })
  })
})
