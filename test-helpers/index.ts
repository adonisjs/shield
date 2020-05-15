/*
* @adonisjs/shield
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { join } from 'path'
import { Ioc } from '@adonisjs/fold'
import { IncomingMessage } from 'http'
import { Edge, GLOBALS } from 'edge.js'
import { RouterContract } from '@ioc:Adonis/Core/Route'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { FakeLogger } from '@adonisjs/logger/build/standalone'
import { Profiler } from '@adonisjs/profiler/build/standalone'
import { Encryption } from '@adonisjs/encryption/build/standalone'
import { HttpContext, Router } from '@adonisjs/http-server/build/standalone'
import { SessionManager } from '@adonisjs/session/build/src/SessionManager'

const logger = new FakeLogger({ level: 'trace', enabled: false, name: 'adonisjs' })
const profiler = new Profiler(__dirname, logger, {})

export const encryption = new Encryption({ secret: 'verylongrandom32characterssecret' })
export const viewsDir = join(__dirname, 'views')
export const view = new Edge()

/**
 * Setup
 */
export async function setup () {
  view.mount(viewsDir)
  Object.keys(GLOBALS).forEach((key) => view.global(key, GLOBALS[key]))

  HttpContext.getter('session', function session () {
    const sessionManager = new SessionManager(new Ioc(), {
      driver: 'cookie',
      cookieName: 'adonis-session',
      clearWithBrowser: false,
      age: '2h',
      cookie: {
        path: '/',
      },
    })
    return sessionManager.create(this)
  }, true)

  HttpContext.getter('view', function () {
    return view.share({ request: this.request, route: this.route })
  }, true)
}

/**
 * Returns HTTP context instance
 */
export function getCtx (routePath: string = '/', routeParams = {}, req?: IncomingMessage) {
  const httpRow = profiler.create('http:request')
  const router = new Router(encryption) as unknown as RouterContract

  return HttpContext
    .create(
      routePath,
      routeParams,
      logger,
      httpRow,
      encryption ,
      router,
      req,
      undefined,
      {} as any
    ) as HttpContextContract
}
