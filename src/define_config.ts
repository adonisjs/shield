/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ShieldConfig } from './types.ts'

/**
 * Define shield configuration with default values.
 * Merges provided partial configuration with defaults where all guards are disabled by default.
 *
 * @param config - Partial shield configuration object
 *
 * @example
 * const shieldConfig = defineConfig({
 *   csrf: { enabled: true },
 *   hsts: { enabled: true, maxAge: '1 year' }
 * })
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
