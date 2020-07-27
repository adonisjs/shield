/*
 * @adonisjs/events
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { join } from 'path'
import { Registrar, Ioc } from '@adonisjs/fold'
import { Application } from '@adonisjs/application/build/standalone'
import { ShieldMiddleware } from '../src/ShieldMiddleware'

test.group('Shield Provider', () => {
	test('register shield provider', async (assert) => {
		const ioc = new Ioc()
		ioc.bind('Adonis/Core/Application', () => {
			return new Application(join(__dirname, 'fixtures'), ioc, {}, {})
		})

		const registrar = new Registrar(ioc, join(__dirname, '..'))
		await registrar.useProviders(['@adonisjs/core', './providers/ShieldProvider']).registerAndBoot()

		assert.instanceOf(ioc.use('Adonis/Addons/ShieldMiddleware'), ShieldMiddleware)
		assert.deepEqual(
			ioc.use('Adonis/Addons/ShieldMiddleware'),
			ioc.use('Adonis/Addons/ShieldMiddleware')
		)
	})
})
