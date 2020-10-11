/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { setup, fs } from '../test-helpers'
import { hstsFactory } from '../src/hsts'

test.group('Hsts', (group) => {
	group.afterEach(async () => {
		await fs.cleanup()
	})

	test('return noop function when enabled is false', async (assert) => {
		const hsts = hstsFactory({ enabled: false })

		const app = await setup()
		const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
		hsts(ctx)

		assert.isUndefined(ctx.response.getHeader('Strict-Transport-Security'))
	})

	test('set Strict-Transport-Security header with defined maxAge', async (assert) => {
		const hsts = hstsFactory({ enabled: true, maxAge: 100 })

		const app = await setup()
		const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
		hsts(ctx)

		assert.equal(ctx.response.getHeader('Strict-Transport-Security'), 'max-age=100')
	})

	test('handle string based max-age', async (assert) => {
		const hsts = hstsFactory({ enabled: true, maxAge: '1s' })

		const app = await setup()
		const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
		hsts(ctx)

		assert.equal(ctx.response.getHeader('Strict-Transport-Security'), 'max-age=1000')
	})

	test('entertain includeSubDomains flag', async (assert) => {
		const hsts = hstsFactory({ enabled: true, maxAge: '1s', includeSubDomains: true })

		const app = await setup()
		const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
		hsts(ctx)

		assert.equal(
			ctx.response.getHeader('Strict-Transport-Security'),
			'max-age=1000; includeSubDomains'
		)
	})

	test('entertain preload flag', async (assert) => {
		const hsts = hstsFactory({
			enabled: true,
			maxAge: '1s',
			includeSubDomains: true,
			preload: true,
		})

		const app = await setup()
		const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
		hsts(ctx)

		assert.equal(
			ctx.response.getHeader('Strict-Transport-Security'),
			'max-age=1000; includeSubDomains; preload'
		)
	})

	test('raise error when maxAge is in negative', async (assert) => {
		const fn = () => hstsFactory({ enabled: true, maxAge: -1 })
		assert.throw(fn, 'Max age for "shield.hsts" cannot be a negative value')
	})
})
