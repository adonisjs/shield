/**
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Core/Response' {
	interface ResponseContract {
		readonly nonce: string
	}
}

declare module '@ioc:Adonis/Core/Request' {
	interface RequestContract {
		csrfToken: string
	}
}
