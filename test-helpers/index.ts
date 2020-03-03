/*
* @adonisjs/shield
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { Socket } from 'net'
import { IncomingMessage, IncomingHttpHeaders } from 'http'
import { FakeLogger } from '@adonisjs/logger/build/standalone'
import { Profiler } from '@adonisjs/profiler/build/standalone'
import { HttpContext } from '@adonisjs/http-server/build/standalone'

const logger = new FakeLogger({ level: 'trace', enabled: false, name: 'adonisjs' })
const profiler = new Profiler(__dirname, logger, {})

export function getCtx (routePath: string = '/', routeParams = {}, request?: IncomingMessage) {
  return HttpContext.create(routePath, routeParams, logger, profiler.create(''), {} as any, request)
}

export function getCtxFromIncomingMessage (headers: IncomingHttpHeaders = {}, routePath = '/', routeParams = {}) {
  const request = new IncomingMessage(new Socket())
  request.headers = headers

  return getCtx(routePath, routeParams, request)
}
