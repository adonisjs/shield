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
import { Filesystem } from '@poppinss/dev-utils'
import { FakeLogger } from '@adonisjs/logger/build/standalone'
import { Profiler } from '@adonisjs/profiler/build/standalone'
import { SessionConfigContract } from '@ioc:Adonis/Addons/Session'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { HttpContext } from '@adonisjs/http-server/build/standalone'
import ViewProvider from '@adonisjs/view/build/providers/ViewProvider'
import { SessionManager } from '@adonisjs/session/build/src/SessionManager'

export const fs = new Filesystem(join(__dirname, 'views'))

const logger = new FakeLogger({ level: 'trace', enabled: false, name: 'adonisjs' })
const profiler = new Profiler(__dirname, logger, {})
const sessionConfig: SessionConfigContract = {
  driver: 'cookie',
  cookieName: 'adonis-session',
  clearWithBrowser: false,
  age: '2h',
  cookie: {
    path: '/',
  },
}

const ioc = new Ioc()
const viewProvider = new ViewProvider(ioc)

ioc.bind('Adonis/Core/Env', () => ({
  get () {
    return true
  },
}))

ioc.bind('Adonis/Core/Application', () => ({
  viewsPath () {
    return fs.basePath
  },
}))
viewProvider.register()

/**
 * Returns HTTP context instance
 */
export function getCtx (
  routePath: string = '/',
  routeParams = {},
  request?: IncomingMessage,
) {
  HttpContext.getter('session', function session () {
    const sessionManager = new SessionManager(ioc, sessionConfig)
    return sessionManager.create(this)
  }, true)

  HttpContext.getter('view', function view () {
    return ioc.use('Adonis/Core/View').share({ request: this.request, route: this.route })
  }, true)

  const httpContext = HttpContext.create(
    routePath,
    routeParams,
    logger,
    profiler.create(''),
    {} as any,
    request
  ) as HttpContextContract

  return httpContext
}
