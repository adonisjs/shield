'use strict'

/*
 * adonis-shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const test = require('japa')
const { Config } = require('@adonisjs/sink')
const Shield = require('../src/Shield')

function getRes () {
  return {
    headers: [],
    cookies: [],
    setHeader (key, value) {
      this.headers.push({ key, value })
    },
    header (key, value) {
      this.headers.push({ key, value })
    },
    cookie (key, value, options) {
      this.cookies.push({ key, value, options })
    }
  }
}

function getReq () {
  return {
    headers: {},
    body: {},
    input (key) {
      return this.body[key]
    },
    header (key) {
      return this.headers[key.toLowerCase()]
    },
    method () {
      return 'GET'
    }
  }
}

function getSession () {
  return {
    bag: {},
    get (key) {
      return this.bag[key]
    },
    put (key, value) {
      this.bag[key] = value
    }
  }
}

function getView () {
  return {
    locals: [],
    safe (input) {
      return input
    },
    share (values) {
      this.locals.push(values)
    }
  }
}

test.group('Shield', () => {
  test('set frame options to deny', (assert) => {
    const shield = new Shield(new Config())
    const req = getReq()
    const res = getRes()
    shield.setGuardHeaders(req, res)
    assert.deepEqual(res.headers.find((header) => header.key === 'X-Frame-Options'), {
      key: 'X-Frame-Options',
      value: 'DENY'
    })
  })

  test('set frame options to SAMEORIGIN when defined in config', (assert) => {
    const config = new Config()
    config.set('shield.xframe', 'SAMEORIGIN')
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setGuardHeaders(req, res)
    assert.deepEqual(res.headers.find((header) => header.key === 'X-Frame-Options'), {
      key: 'X-Frame-Options',
      value: 'SAMEORIGIN'
    })
  })

  test('set frame allowed origin when defined in config', (assert) => {
    const config = new Config()
    config.set('shield.xframe', 'ALLOW-FROM foo.example.com')
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setGuardHeaders(req, res)
    assert.deepEqual(res.headers.find((header) => header.key === 'X-Frame-Options'), {
      key: 'X-Frame-Options',
      value: 'ALLOW-FROM foo.example.com'
    })
  })

  test('set xss protection', (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setGuardHeaders(req, res)
    assert.deepEqual(res.headers.find((header) => header.key === 'X-XSS-Protection'), {
      key: 'X-XSS-Protection',
      value: '1; mode=block'
    })
  })

  test('set xss protection mode to blocked when enableOnOldIE is set to false', (assert) => {
    const config = new Config()
    config.set('shield.xss.enableOnOldIE', false)
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setGuardHeaders(req, res)
    assert.deepEqual(res.headers.find((header) => header.key === 'X-XSS-Protection'), {
      key: 'X-XSS-Protection',
      value: '1; mode=block'
    })
  })

  test('set xss protection mode to 0 when user is on ie < 9', (assert) => {
    const config = new Config()
    config.set('shield.xss.enableOnOldIE', false)
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    req.headers = {
      'user-agent': 'msie 8'
    }
    shield.setGuardHeaders(req, res)
    assert.deepEqual(res.headers.find((header) => header.key === 'X-XSS-Protection'), {
      key: 'X-XSS-Protection',
      value: '0'
    })
  })

  test('add no sniff header when enabled', (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setGuardHeaders(req, res)
    assert.deepEqual(res.headers.find((header) => header.key === 'X-Content-Type-Options'), {
      key: 'X-Content-Type-Options',
      value: 'nosniff'
    })
  })

  test('do not set header when nosniff is to false', (assert) => {
    const config = new Config()
    config.set('shield.nosniff', false)
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setGuardHeaders(req, res)
    assert.isUndefined(res.headers.find((header) => header.key === 'X-Content-Type-Options'))
  })

  test('set x download options header', (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setGuardHeaders(req, res)
    assert.deepEqual(res.headers.find((header) => header.key === 'X-Download-Options'), {
      key: 'X-Download-Options',
      value: 'noopen'
    })
  })

  test('build csp for default settings', (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    assert.deepEqual(shield.buildCsp(req, res), {})
  })

  test('build for script src', (assert) => {
    const config = new Config()
    config.set('shield.csp.directives', {
      scriptSrc: ['self']
    })
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    assert.deepEqual(shield.buildCsp(req, res), {
      'Content-Security-Policy': `script-src 'self'; `,
      'X-Content-Security-Policy': `script-src 'self'; `,
      'X-WebKit-CSP': `script-src 'self'; `
    })
  })

  test('build for script src with nonce', (assert) => {
    const config = new Config()
    config.set('shield.csp.directives', {
      scriptSrc: ['@nonce']
    })
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    assert.deepEqual(shield.buildCsp(req, res), {
      'Content-Security-Policy': `script-src 'nonce-${shield.cspNonce}'; `,
      'X-Content-Security-Policy': `script-src 'nonce-${shield.cspNonce}'; `,
      'X-WebKit-CSP': `script-src 'nonce-${shield.cspNonce}'; `
    })
  })

  test('csp do not mutate config', (assert) => {
    const config = new Config()
    config.set('shield.csp.directives', {
      scriptSrc: ['@nonce']
    })
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.buildCsp(req, res)
    assert.isUndefined(shield.config.csp.nonce)
  })

  test('add csp headers', (assert) => {
    const config = new Config()
    config.set('shield.csp.directives', {
      scriptSrc: ['*']
    })
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setCspHeaders(shield.buildCsp(req, res), res)
    assert.deepEqual(res.headers, [{
      key: 'Content-Security-Policy',
      value: 'script-src *; '
    }])
  })

  test('add all csp headers', (assert) => {
    const config = new Config()
    config.set('shield.csp.setAllHeaders', true)
    config.set('shield.csp.directives', {
      scriptSrc: ['*']
    })
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setCspHeaders(shield.buildCsp(req, res), res)
    assert.deepEqual(res.headers, [
      {
        key: 'Content-Security-Policy',
        value: 'script-src *; '
      },
      {
        key: 'X-Content-Security-Policy',
        value: 'script-src *; '
      },
      {
        key: 'X-WebKit-CSP',
        value: 'script-src *; '
      }
    ])
  })

  test('set report only headers', (assert) => {
    const config = new Config()
    config.set('shield.csp.reportOnly', true)
    config.set('shield.csp.directives', {
      scriptSrc: ['*']
    })
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    shield.setCspHeaders(shield.buildCsp(req, res), res)
    assert.deepEqual(res.headers, [
      {
        key: 'Content-Security-Policy-Report-Only',
        value: 'script-src *; '
      }
    ])
  })

  test('share view locals', (assert) => {
    const config = new Config()
    config.set('shield.csp.directives', {
      scriptSrc: ['*']
    })
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    const view = getView()

    shield.shareCspViewLocals(shield.buildCsp(req, res), view)
    assert.lengthOf(view.locals, 1)
    assert.equal(view.locals[0].cspNonce, shield.cspNonce)
    assert.equal(
      view.locals[0].cspMeta.bind(view)(),
      '<meta http-equiv="Content-Security-Policy" content="script-src *; ">'
    )
  })

  test('share all meta tags when setAllHeaders is set to true', (assert) => {
    const config = new Config()
    config.set('shield.csp.setAllHeaders', true)
    config.set('shield.csp.directives', {
      scriptSrc: ['*']
    })
    const shield = new Shield(config)
    const req = getReq()
    const res = getRes()
    const view = getView()

    shield.shareCspViewLocals(shield.buildCsp(req, res), view)
    assert.lengthOf(view.locals, 1)
    assert.equal(view.locals[0].cspNonce, shield.cspNonce)
    assert.equal(
      view.locals[0].cspMeta.bind(view)(),
      '<meta http-equiv="Content-Security-Policy" content="script-src *; ">\n<meta http-equiv="X-Content-Security-Policy" content="script-src *; ">\n<meta http-equiv="X-WebKit-CSP" content="script-src *; ">'
    )
  })

  test('set nonce on request', (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const req = getReq()
    shield.setRequestNonce(req)
    assert.equal(req.nonce, shield.cspNonce)
  })

  test('get secret for user', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const session = getSession()
    const secret = await shield.getCsrfSecret(session)
    assert.isDefined(secret)
    assert.equal(secret, session.bag['csrf-secret'])
  })

  test('generate token from a secret', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const session = getSession()
    const secret = await shield.getCsrfSecret(session)
    const token = shield.generateCsrfToken(secret)
    assert.isDefined(token)
  })

  test('verify multiple tokens from a secret', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const session = getSession()
    const secret = await shield.getCsrfSecret(session)
    const token = shield.generateCsrfToken(secret)
    const token1 = shield.generateCsrfToken(secret)
    const token2 = shield.generateCsrfToken(secret)
    shield.verifyToken(secret, token)
    shield.verifyToken(secret, token1)
    shield.verifyToken(secret, token2)
  })

  test('throw exception when secret is different', async (assert) => {
    assert.plan(3)

    const config = new Config()
    const shield = new Shield(config)
    const session = getSession()
    const secret = await shield.getCsrfSecret(session)

    /**
     * Cleaning bag so that a new secret gets
     * generated
     */
    session.bag = {}

    const secret1 = await shield.getCsrfSecret(session)
    const token = shield.generateCsrfToken(secret)

    try {
      shield.verifyToken(secret1, token)
    } catch ({ status, message, code }) {
      assert.equal(status, 403)
      assert.equal(code, 'EBADCSRFTOKEN')
      assert.equal(message, 'EBADCSRFTOKEN: Invalid CSRF token')
    }
  })

  test('return null when token doesn\'t exists', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const request = getReq()
    assert.isNull(shield.getCsrfToken(request))
  })

  test('return token from request body', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const request = getReq()
    request.body = { _csrf: '12' }
    assert.equal(shield.getCsrfToken(request), '12')
  })

  test('return token from request header x-csrf-token', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const request = getReq()
    request.headers = { 'x-csrf-token': '12' }
    assert.equal(shield.getCsrfToken(request), '12')
  })

  test('return decrypted x-xsrf-token', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const request = getReq()
    request.headers = { 'x-xsrf-token': '12' }
    assert.equal(shield.getCsrfToken(request), '12')
  })

  test('return true if one of the defined csrf methods', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    assert.isTrue(shield._fallsUnderValidationMethod('POST'))
  })

  test('return false if request method is get', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    assert.isFalse(shield._fallsUnderValidationMethod('GET'))
  })

  test('work with case mismatch', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    assert.isTrue(shield._fallsUnderValidationMethod('post'))
  })

  test('return true when all Uri\'s are supposed to be matched', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const req = getReq()
    assert.isTrue(shield._fallsUnderValidationUri(req))
  })

  test('return false when when request.match returns true', async (assert) => {
    const config = new Config()
    config.set('shield.csrf.filterUris', ['*'])
    const shield = new Shield(config)
    const req = getReq()
    req.match = () => true
    assert.isFalse(shield._fallsUnderValidationUri(req))
  })

  test('share csrf locals with view instance', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const view = getView()
    shield.shareCsrfViewLocals('22', view)
    assert.equal(view.locals[0].csrfToken, '22')
    assert.equal(view.locals[0].csrfField.bind(view)(), '<input type="hidden" name="_csrf" value="22">')
  })

  test('set XSRF-TOKEN cookie with csrf token', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const res = getRes()
    shield.setCsrfCookie('22', res)

    assert.deepEqual(res.cookies, [{
      key: 'XSRF-TOKEN',
      value: '22',
      options: {
        httpOnly: false,
        maxAge: 7200,
        path: '/',
        sameSite: true
      }
    }])
  })

  test('set XSRF-TOKEN cookie with csrf token and custom cookie options', async (assert) => {
    const config = new Config()
    config.set('shield.csrf.cookieOptions', {
      httpOnly: true
    })
    const shield = new Shield(config)
    const res = getRes()
    shield.setCsrfCookie('22', res)

    assert.deepEqual(res.cookies, [{
      key: 'XSRF-TOKEN',
      value: '22',
      options: {
        httpOnly: true,
        maxAge: 7200,
        path: '/',
        sameSite: true
      }
    }])
  })

  test('set csrfToken on request', async (assert) => {
    const config = new Config()
    config.set('shield.csrf.cookieOptions', {
      httpOnly: true
    })
    const shield = new Shield(config)
    const req = getReq()
    shield.setRequestCsrfToken('22', req)
    assert.equal(req.csrfToken, '22')
  })

  test('call middleware handle method and setup all headers, session, cookies, view locals', async (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const request = getReq()

    const response = getRes()
    response.response = response
    response.request = request

    const view = getView()
    const session = getSession()
    await shield.handle({ view, session, request, response }, function () {})

    const xsrfToken = response.cookies.find((cookie) => cookie.key === 'XSRF-TOKEN')
    const viewPair = view.locals.find((local) => Object.keys(local).indexOf('csrfToken') > -1)

    assert.equal(xsrfToken.value, request.csrfToken)
    assert.equal(xsrfToken.value, viewPair.csrfToken)
  })

  test('throw exception when unable to match csrf token', async (assert) => {
    assert.plan(3)

    const config = new Config()
    const shield = new Shield(config)
    const request = getReq()
    request.method = () => 'POST'

    const response = getRes()
    response.response = response
    response.request = request

    const view = getView()
    const session = getSession()
    try {
      await shield.handle({ view, session, request, response }, function () {})
    } catch ({ status, message, code }) {
      assert.equal(status, 403)
      assert.equal(code, 'EBADCSRFTOKEN')
      assert.equal(message, 'EBADCSRFTOKEN: Invalid CSRF token')
    }
  })

  test('ignore csrf when csrf is disabled', async (assert) => {
    assert.plan(1)

    const config = new Config()
    config.set('shield.csrf.enable', false)
    const shield = new Shield(config)
    const request = getReq()
    request.method = () => 'POST'

    const response = getRes()
    response.response = response
    response.request = request

    const view = getView()
    const session = getSession()
    await shield.handle({ view, session, request, response }, function () {
      assert.isTrue(true)
    })
  })

  test('throw exception when session is not set', async (assert) => {
    assert.plan(3)

    const config = new Config()
    const shield = new Shield(config)
    const request = getReq()
    request.method = () => 'POST'

    const response = getRes()
    response.response = response
    response.request = request

    const view = getView()
    try {
      await shield.handle({ view, request, response }, function () {})
    } catch ({ status, message, code }) {
      assert.equal(status, 500)
      assert.equal(code, 'E_RUNTIME_ERROR')
      assert.match(message, /E_RUNTIME_ERROR: Make sure to install\/setup session provider to use shield middleware/)
    }
  })
})
