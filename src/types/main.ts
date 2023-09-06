/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { HttpContext } from '@adonisjs/core/http'
import type { CookieOptions } from '@adonisjs/core/types/http'
import type { ContentSecurityPolicyOptions } from 'helmet-csp'

export type ValueOf<T> = T[keyof T]

/**
 * Config for `X-Frame-Options` header
 */
export type XFrameOptions =
  | {
      /**
       * Enable/disable the guard
       */
      enabled: boolean
      action?: 'DENY' | 'SAMEORIGIN'
    }
  | {
      /**
       * Enable/disable the guard
       */
      enabled: boolean
      action?: 'ALLOW-FROM'

      /**
       * Define the domain when the action equals "ALLOW-FROM"
       */
      domain: string
    }

/**
 * Config for X-Content-Type-Options
 */
export type ContentTypeSniffingOptions = {
  /**
   * Enable/disable the guard
   */
  enabled: boolean
}

/**
 * Config for HTTP Strict Transport Security (HSTS)
 */
export type HstsOptions = {
  /**
   * Enable/disable the guard
   */
  enabled: boolean

  /**
   * Max-age in seconds or a time based string
   * expression
   */
  maxAge?: string | number

  /**
   * Apply the HSTS directive on subdomains as well
   */
  includeSubDomains?: boolean

  /**
   * Enable preloading of HSTS. This is a non-standard feature
   * and you must read the MDN specification to learn more
   * about it.
   * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
   */
  preload?: boolean
}

/**
 * Config for working with CSP
 */
export type CspOptions = { enabled: boolean } & ContentSecurityPolicyOptions

/**
 * Config for working with CSRF options
 */
export type CsrfOptions = {
  /**
   * Enable/disable the guard
   */
  enabled: boolean

  /**
   * Ignore CSRF validation for the mentioned routes
   */
  exceptRoutes?: string[] | ((ctx: HttpContext) => boolean)

  /**
   * Share CSRF token as a cookie
   */
  enableXsrfCookie?: boolean

  /**
   * HTTP methods to validate for CSRF tokens.
   *
   * Default: PUT, PATCH, POST, DELETE
   */
  methods?: ReadonlyArray<string>
  cookieOptions?: Partial<CookieOptions>
}

/**
 * Shield config file types
 */
export type ShieldConfig = {
  xFrame: XFrameOptions
  contentTypeSniffing: ContentTypeSniffingOptions
  hsts: HstsOptions
  csp: CspOptions
  csrf: CsrfOptions
}
