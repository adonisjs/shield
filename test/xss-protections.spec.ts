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
import { xssFactory } from '../src/xssProtection'

test.group('Xss Protection', (group) => {
	group.afterEach(async () => {
		await fs.cleanup()
	})

	test('return noop function when enabled is false', async (assert) => {
		const xss = xssFactory({ enabled: false })

		const app = await setup()
		const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
		xss(ctx)

		assert.isUndefined(ctx.response.getHeader('X-XSS-Protection'))
	})

	test('set X-XSS-Protection header', async (assert) => {
		const xss = xssFactory({ enabled: true })

		const app = await setup()
		const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
		xss(ctx)

		assert.equal(ctx.response.getHeader('X-XSS-Protection'), '1; mode=block')
	})

	test('disable block mode', async (assert) => {
		const xss = xssFactory({ enabled: true, mode: null })
		const app = await setup()
		const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
		xss(ctx)

		assert.equal(ctx.response.getHeader('X-XSS-Protection'), '1')
	})

	test('set report uri', async (assert) => {
		const xss = xssFactory({ enabled: true, reportUri: '/' })
		const app = await setup()
		const ctx = app.container.use('Adonis/Core/HttpContext').create('/', {})
		xss(ctx)

		assert.equal(ctx.response.getHeader('X-XSS-Protection'), '1; mode=block; report=/')
	})
})
