/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { debuglog } from 'node:util'

/**
 * Debug logger instance for the Shield package.
 * Logs debug messages when NODE_DEBUG=adonisjs:shield is set.
 *
 * @example
 * debug('csrf: ignoring request for "%s" method', ctx.request.method())
 */
export default debuglog('adonisjs:shield')
