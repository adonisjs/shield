/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { test } from '@japa/runner'
import { defineConfig } from '../src/define_config.js'

test.group('Define config', () => {
  test('define config with defaults', ({ assert }) => {
    assert.deepEqual(defineConfig({}), {
      contentTypeSniffing: {
        enabled: false,
      },
      csp: {
        enabled: false,
      },
      csrf: {
        enabled: false,
      },
      hsts: {
        enabled: false,
      },
      xFrame: {
        enabled: false,
      },
    })
  })
})
