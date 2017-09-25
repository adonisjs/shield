'use strict'

/*
 * adonis-shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const guard = require('node-guard')
const csp = require('node-csp')
const uuid = require('uuid')
const csrf = new (require('csrf'))()
const GE = require('@adonisjs/generic-exceptions')
const nodeCookie = require('node-cookie')

class Shield {
  constructor (Config) {
    this.config = Config.merge('shield', require('../../example/config.js'))
    this.cspNonce = uuid.v4()
    this.appSecret = Config.get('app.appKey')
  }

  /**
   * The session key name for storing the CSRF
   * secret
   *
   * @method sessionKey
   *
   * @return {String}
   */
  get sessionKey () {
    return 'csrf-secret'
  }

  /**
   * Returns the keys to be used for CSP headers, based
   * upon the user configuration
   *
   * @method _getHeaderKeys
   *
   * @param  {Object}       headers
   *
   * @return {Array}
   *
   * @private
   */
  _getHeaderKeys (headers) {
    if (this.config.csp.setAllHeaders) {
      return Object.keys(headers)
    }

    if (headers['Content-Security-Policy-Report-Only']) {
      return ['Content-Security-Policy-Report-Only']
    }

    if (headers['Content-Security-Policy']) {
      return ['Content-Security-Policy']
    }

    return []
  }

  /**
   * Returns a boolean telling whether CSRF is enabled
   * or not
   *
   * @method _isCsrfEnabled
   *
   * @return {Boolean}
   *
   * @private
   */
  _isCsrfEnabled () {
    return this.config.csrf.enable
  }

  /**
   * Returns whether the request method falls within
   * the defined methods in the config
   *
   * @method _fallsUnderValidationMethod
   *
   * @param  {String}           method
   *
   * @return {Boolean}
   *
   * @private
   */
  _fallsUnderValidationMethod (method) {
    method = method.toLowerCase()
    return !!this.config.csrf.methods.find((definedMethod) => {
      return definedMethod.toLowerCase() === method
    })
  }

  /**
   * Returns a boolean telling if the current request
   * url is supposed to be selected for csrf token
   * validation or not
   *
   * @method _fallsUnderValidationUri
   *
   * @param  {Object}                 request
   *
   * @return {Boolean}
   *
   * @private
   */
  _fallsUnderValidationUri (request) {
    const { filterUris } = this.config.csrf
    if (filterUris && filterUris.length) {
      return !request.match(filterUris)
    }
    return true
  }

  /**
   * Set response headers to guard the webpages from various
   * web attacks. This method will set one or all of the
   * following headers based upon the config settings.
   *
   * 1. X-XSS-Protection
   * 2. X-Frame-Options
   * 3. X-Content-Type-Options
   * 4. X-DOWNLOAD-OPTIONS
   *
   * @method setGuardHeaders
   *
   * @param  {Object}        req
   * @param  {Object}        res
   *
   * @return {void}
   */
  setGuardHeaders (req, res) {
    guard.addFrameOptions(res, this.config.xframe)
    guard.addXssFilter(req, res, this.config.xss)
    guard.addNoSniff(res, this.config.nosniff)
    guard.addNoOpen(res, this.config.noopen)
  }

  /**
   * Builds the CSP string and returns them as an object
   * with multiple HTTP headers as keys.
   *
   * All headers may not required, since headers starting
   * with `X` are for backward compatibility.
   *
   * @method buildCsp
   *
   * @param  {Object} req
   * @param  {Object} res
   *
   * @return {Object}
   */
  buildCsp (req, res) {
    const config = Object.assign({}, this.config.csp)
    config.nonce = this.cspNonce
    return csp.build(req, config)
  }

  /**
   * Set's CSP headers on response
   *
   * @method setCspHeaders
   *
   * @param  {Object}      headers
   * @param  {Object}      response
   *
   * @return {void}
   */
  setCspHeaders (headers, response) {
    this._getHeaderKeys(headers).forEach((key) => (response.header(key, headers[key])))
  }

  /**
   * Shares csp related views with the view instance
   *
   * @method shareCspViewLocals
   *
   * @param  {Object}           headers
   * @param  {Object}           view
   *
   * @return {void}
   */
  shareCspViewLocals (headers, view) {
    const metaTags = this._getHeaderKeys(headers).map((key) => {
      return `<meta http-equiv="${key}" content="${headers[key]}">`
    })
    view.share({
      cspMeta: function () {
        return this.safe(metaTags.join('\n'))
      },
      cspNonce: this.cspNonce
    })
  }

  /**
   * Sets csp nonce value on request instance
   *
   * @method setRequestNonce
   *
   * @param  {Object}              request
   */
  setRequestNonce (request) {
    request.nonce = this.cspNonce
  }

  /**
   * Generates a new csrf secret only when it doesn't
   * exists for the current user session.
   *
   * This method will set the secret inside the session
   * too.
   *
   * So what you will it? umm....., ohh it has side-effects :)
   *
   * @method getCsrfSecret
   *
   * @param  {Object}      session
   *
   * @return {String}
   */
  async getCsrfSecret (session) {
    const secret = session.get(this.sessionKey)
    if (secret) {
      return secret
    }

    const newSecret = await csrf.secret()
    session.put(this.sessionKey, newSecret)
    return newSecret
  }

  /**
   * Generates a new csrf token for a given
   * secret
   *
   * @method generateCsrfToken
   *
   * @param  {String}          secret
   *
   * @return {String}
   */
  generateCsrfToken (secret) {
    return csrf.create(secret)
  }

  /**
   * Verifies the user token with the session secret.
   *
   * This method internally uses `tsscmp` which saves users from
   * timing attacks.
   *
   * @method verifyToken
   *
   * @param  {String}    secret
   * @param  {String}    token
   *
   * @return {void}
   *
   * @throws {HttpException} If unable to verify secret
   */
  verifyToken (secret, token) {
    if (!csrf.verify(secret, token)) {
      throw new GE.HttpException('Invalid CSRF token', 403, 'EBADCSRFTOKEN')
    }
  }

  /**
   * Returns the csrf token by reading it from one of expected
   * resources.
   *
   * @method getCsrfToken
   *
   * @param  {Object} request
   *
   * @return {String|Null}
   */
  getCsrfToken (request) {
    const token = request.input('_csrf') || request.header('x-csrf-token')
    if (token) {
      return token
    }

    const encryptedToken = request.header('x-xsrf-token')
    return encryptedToken ? nodeCookie.unPackValue(encryptedToken, this.appSecret, !!this.appSecret) : null
  }

  /**
   * Shares `csrfToken` and `csrfField` locals with
   * the view instance
   *
   * @method shareCsrfViewLocals
   *
   * @param  {String}             csrfToken
   * @param  {Object}             view
   *
   * @return {void}
   */
  shareCsrfViewLocals (csrfToken, view) {
    view.share({
      csrfToken,
      csrfField: function () {
        return this.safe(`<input type="hidden" name="_csrf" value="${csrfToken}">`)
      }
    })
  }

  /**
   * Sets the Csrf cookie on the response, this value is
   * used automatically by frontend frameworks like
   * Angular.
   *
   * Note: Since all cookies the signed and encrypted, so csrf
   * token is encrypted too and when sent back as a header,
   * this module will decrypt it automatically, so your
   * life is good in short :).
   *
   * @method setCsrfCookie
   *
   * @param  {String}       csrfToken
   * @param  {Object}       response
   */
  setCsrfCookie (csrfToken, response) {
    response.cookie('XSRF-TOKEN', csrfToken, this.config.csrf.cookieOptions)
  }

  /**
   * Sets the token on the request object
   *
   * @method setRequestCsrfToken
   *
   * @param  {String}            csrfToken
   * @param  {Object}            request
   *
   * @return {void}
   */
  setRequestCsrfToken (csrfToken, request) {
    request.csrfToken = csrfToken
  }

  async handle ({ request, response, session, view }, next) {
    if (!session) {
      throw GE
        .RuntimeException
        .invoke('Make sure to install/setup session provider to use shield middleware')
    }

    const { request: req, response: res } = response

    /**
     * Setting guard headers
     */
    this.setGuardHeaders(req, res)

    /**
     * Building csp string with required header and
     * meta keys
     */
    const headers = this.buildCsp(req, res)

    /**
     * Setting csp as HTTP headers
     */
    this.setCspHeaders(headers, response)

    /**
     * Sharing csp nonce and meta tags as view
     * locals
     */
    this.shareCspViewLocals(headers, view)

    /**
     * Sharing csp nonce with request property
     */
    this.setRequestNonce(request)

    /**
     * Getting the csrf secret and setting
     * as the session value too.
     */
    const csrfSecret = await this.getCsrfSecret(session)

    /**
     * If the request url and method is supposed to be checked
     * against csrf attack, then verify the token.
     */
    if (this._isCsrfEnabled() && this._fallsUnderValidationUri(request) && this._fallsUnderValidationMethod(request.method())) {
      const csrfToken = this.getCsrfToken(request)
      this.verifyToken(csrfSecret, csrfToken)
    }

    /**
     * Generate a new token for each request, if verification
     * was skipped or passed.
     */
    const newCsrfToken = this.generateCsrfToken(csrfSecret)

    /**
     * Share the csrf token, csrf field as view locals
     */
    this.shareCsrfViewLocals(newCsrfToken, view)

    /**
     * Set the response cookie for csrf token. This is required by Javascript
     * frameworks like angular, and don't worry cookie is signed and encrypted.
     */
    this.setCsrfCookie(newCsrfToken, response)

    /**
     * Set token on the request object
     */
    this.setRequestCsrfToken(newCsrfToken, request)
    await next()
  }
}

module.exports = Shield
