/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { randomString } from '@poppinss/utils'
import { ResponseConstructorContract } from '@ioc:Adonis/Core/Response'

/**
 * Sharing CSP nonce with the response
 */
export default function responseBinding(Response: ResponseConstructorContract) {
	Response.getter(
		'nonce',
		() => {
			return randomString(16)
		},
		true
	)
}
