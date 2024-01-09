/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ShieldConfig } from './types.js'

/**
 * Define shield configuration
 */
export function defineConfig(config: Partial<ShieldConfig>): ShieldConfig {
  return {
    csp: {
      enabled: false,
      ...config.csp,
    },
    csrf: {
      enabled: false,
      ...config.csrf,
    },
    hsts: {
      enabled: false,
      ...config.hsts,
    },
    contentTypeSniffing: {
      enabled: false,
      ...config.contentTypeSniffing,
    },
    xFrame: {
      enabled: false,
      ...config.xFrame,
    },
  } satisfies ShieldConfig
}
