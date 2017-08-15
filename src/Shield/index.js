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

class Shield {
  constructor (Config) {
    this.config = Config.merge('shield', require('../../example/config.js'))
    this.cspNonce = uuid.v4()
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
    view.share({ cspMeta: metaTags.join('\n'), cspNonce: this.cspNonce })
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
}

module.exports = Shield
