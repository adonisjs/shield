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
    setHeader (key, value) {
      this.headers.push({ key, value })
    },
    header (key, value) {
      this.headers.push({ key, value })
    }
  }
}

function getReq () {
  return {
    headers: {}
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
    const view = {
      locals: [],
      share (values) {
        this.locals.push(values)
      }
    }

    shield.shareCspViewLocals(shield.buildCsp(req, res), view)
    assert.deepEqual(view.locals, [{
      cspMeta: '<meta http-equiv="Content-Security-Policy" content="script-src *; ">',
      cspNonce: shield.cspNonce
    }])
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
    const view = {
      locals: [],
      share (values) {
        this.locals.push(values)
      }
    }

    shield.shareCspViewLocals(shield.buildCsp(req, res), view)
    assert.deepEqual(view.locals, [{
      cspMeta: '<meta http-equiv="Content-Security-Policy" content="script-src *; ">\n<meta http-equiv="X-Content-Security-Policy" content="script-src *; ">\n<meta http-equiv="X-WebKit-CSP" content="script-src *; ">',
      cspNonce: shield.cspNonce
    }])
  })

  test('set nonce on request', (assert) => {
    const config = new Config()
    const shield = new Shield(config)
    const req = getReq()
    shield.setRequestNonce(req)
    assert.equal(req.nonce, shield.cspNonce)
  })
})
