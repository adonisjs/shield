/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Test } from '@japa/runner/core'
import { getActiveTest } from '@japa/runner'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import { ApiClient, apiClient } from '@japa/api-client'
import { ApplicationService } from '@adonisjs/core/types'
import { IgnitorFactory } from '@adonisjs/core/factories'
import { NamedReporterContract } from '@japa/runner/types'
import { runner, syncReporter } from '@japa/runner/factories'
import { defineConfig as defineSessionConfig } from '@adonisjs/session'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
import { IncomingMessage, ServerResponse, createServer } from 'node:http'

import { shieldApiClient } from '../src/plugins/api_client.js'

export const BASE_URL = new URL('./tmp/', import.meta.url)

export const httpServer = {
  create(callback: (req: IncomingMessage, res: ServerResponse) => any) {
    const server = createServer(callback)
    getActiveTest()?.cleanup(async () => {
      await new Promise<void>((resolve) => {
        server.close(() => resolve())
      })
    })
    return server
  },
}

export async function setup() {
  const ignitor = new IgnitorFactory()
    .withCoreProviders()
    .withCoreConfig()
    .merge({
      config: {
        views: { cache: { enabled: false } },
        session: defineSessionConfig({ enabled: true, store: 'memory', stores: {} }),
      },
      rcFileContents: {
        providers: [
          () => import('@adonisjs/session/session_provider'),
          () => import('@adonisjs/core/providers/edge_provider'),
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

/**
 * Runs a japa test in isolation
 */
export async function runJapaTest(app: ApplicationService, callback: Parameters<Test['run']>[0]) {
  ApiClient.clearSetupHooks()
  ApiClient.clearTeardownHooks()
  ApiClient.clearRequestHandlers()

  await runner()
    .configure({
      reporters: {
        activated: [syncReporter.name],
        list: [syncReporter as NamedReporterContract],
      },
      plugins: [apiClient(), pluginAdonisJS(app), sessionApiClient(app), shieldApiClient()],
      files: [],
    })
    .runTest('testing japa integration', callback)
}
