/*
* @adonisjs/shield
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { HttpContext } from '@adonisjs/http-server/build/standalone'
import { FakeLogger } from '@adonisjs/logger/build/standalone'
import { Profiler } from '@adonisjs/profiler/build/standalone'

const logger = new FakeLogger({ level: 'trace', enabled: false, name: 'adonisjs' })
const profiler = new Profiler(__dirname, logger, {})

export function getCtx () {
  return HttpContext.create('/', {}, logger, profiler.create(''), {} as any)
}
