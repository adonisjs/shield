/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from '@adonisjs/core/commands/configure'

/**
 * Configures the package
 */
export async function configure(command: Configure) {
  /**
   * Publish config file
   */
  await command.publishStub('config.stub')

  const codemods = await command.createCodemods()

  /**
   * Register provider
   */
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@adonisjs/shield/shield_provider')
  })

  /**
   * Register middleware
   */
  await codemods.registerMiddleware('router', [
    {
      path: '@adonisjs/shield/shield_middleware',
    },
  ])
}
