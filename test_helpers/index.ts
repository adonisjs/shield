/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IgnitorFactory } from '@adonisjs/core/factories'

export const BASE_URL = new URL('./tmp/', import.meta.url)

export async function setup() {
  const ignitor = new IgnitorFactory()
    .withCoreProviders()
    .withCoreConfig()
    .merge({
      config: {
        views: { cache: { enabled: false } },
        session: { enabled: true, driver: 'cookie' },
      },
      rcFileContents: {
        providers: [
          '@adonisjs/session/session_provider',
          '@adonisjs/view/views_provider',
          '../../providers/shield_provider.js',
        ],
      },
    })
    .create(BASE_URL, {
      importer: (filePath) => {
        if (filePath.startsWith('./') || filePath.startsWith('../')) {
          return import(new URL(filePath, BASE_URL).href)
        }

        return import(filePath)
      },
    })

  const app = ignitor.createApp('web')
  await app.init()
  await app.boot()

  return app
}
