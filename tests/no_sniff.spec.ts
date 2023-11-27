/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { noSniffFactory } from '../src/guards/no_sniff.js'
import { HttpContextFactory } from '@adonisjs/core/factories/http'

test.group('No Sniff', () => {
  test('return noop function when enabled is false', async ({ assert }) => {
    const noSniff = noSniffFactory({ enabled: false })
    const ctx = new HttpContextFactory().create()

    noSniff(ctx)

    assert.isUndefined(ctx.response.getHeader('X-Content-Type-Options'))
  })

  test('set X-Content-Type-Options header', async ({ assert }) => {
    const noSniff = noSniffFactory({ enabled: true })
    const ctx = new HttpContextFactory().create()

    noSniff(ctx)

    assert.equal(ctx.response.getHeader('X-Content-Type-Options'), 'nosniff')
  })
})
