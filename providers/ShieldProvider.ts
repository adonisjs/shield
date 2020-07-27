/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { IocContract } from '@adonisjs/fold'
import { ShieldMiddleware } from '../src/ShieldMiddleware'

/**
 * Provider to register shield middleware
 */
export default class ShieldProvider {
	constructor(protected container: IocContract) {}

	public register() {
		this.container.singleton('Adonis/Addons/ShieldMiddleware', () => {
			const Config = this.container.use('Adonis/Core/Config')
			const Encryption = this.container.use('Adonis/Core/Encryption')
			const View = this.container.hasBinding('Adonis/Core/View')
				? this.container.use('Adonis/Core/View')
				: undefined

			return new ShieldMiddleware(Config.get('shield', {}), Encryption, View)
		})
	}

	public boot() {
		this.container.with(['Adonis/Core/Response'], (Response) => {
			require('../src/Bindings/Response').default(Response)
		})
	}
}
