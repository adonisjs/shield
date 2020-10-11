/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'path'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/core/build/standalone'

export const fs = new Filesystem(join(__dirname, './app'))

export async function setup() {
	await fs.add('.env', '')
	await fs.add(
		'config/app.ts',
		`
		export const appKey = '${Math.random().toFixed(36).substring(2, 38)}',
		export const http = {
			cookie: {},
			trustProxy: () => true,
		}
	`
	)

	await fs.add(
		'config/session.ts',
		`
		const sessionConfig = {
			driver: 'cookie'
		}

		export default sessionConfig
	`
	)

	const app = new Application(fs.basePath, 'web', {
		providers: [
			'@adonisjs/core',
			'@adonisjs/session',
			'@adonisjs/view',
			'../../providers/ShieldProvider',
		],
	})

	app.setup()
	app.registerProviders()
	await app.bootProviders()

	return app
}
