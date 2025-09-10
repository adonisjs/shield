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
import type { ContentSecurityPolicyOptions } from './helmet-csp.cts'

/**
 * Utility type that extracts the values of all properties in an object type.
 *
 * @example
 * type Config = { a: string; b: number }
 * type Values = ValueOf<Config> // string | number
 */
export type ValueOf<T> = T[keyof T]

/**
 * Configuration options for `X-Frame-Options` header to prevent clickjacking attacks.
 * Supports DENY, SAMEORIGIN, and ALLOW-FROM actions.
 *
 * @example
 * // Basic SAMEORIGIN policy
 * const config: XFrameOptions = {
 *   enabled: true,
 *   action: 'SAMEORIGIN'
 * }
 *
 * // Allow from specific domain
 * const allowFromConfig: XFrameOptions = {
 *   enabled: true,
 *   action: 'ALLOW-FROM',
 *   domain: 'https://trusted-site.com'
 * }
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
 * Configuration options for `X-Content-Type-Options` header.
 * Prevents browsers from MIME-sniffing responses and forces them to respect the declared content-type.
 *
 * @example
 * const config: ContentTypeSniffingOptions = {
 *   enabled: true
 * }
 */
export type ContentTypeSniffingOptions = {
  /**
   * Enable/disable the guard
   */
  enabled: boolean
}

/**
 * Configuration options for HTTP Strict Transport Security (HSTS) header.
 * Enforces secure HTTPS connections and protects against protocol downgrade attacks.
 *
 * @example
 * const config: HstsOptions = {
 *   enabled: true,
 *   maxAge: '1 year',
 *   includeSubDomains: true,
 *   preload: false
 * }
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
 * Configuration options for Content Security Policy (CSP) header.
 * Extends ContentSecurityPolicyOptions with an enabled flag to control CSP enforcement.
 *
 * @example
 * const config: CspOptions = {
 *   enabled: true,
 *   directives: {
 *     defaultSrc: ["'self'"],
 *     scriptSrc: ["'self'", "'unsafe-inline'"]
 *   }
 * }
 */
export type CspOptions = { enabled: boolean } & ContentSecurityPolicyOptions

/**
 * Configuration options for Cross-Site Request Forgery (CSRF) protection.
 * Provides comprehensive CSRF token validation with customizable methods, routes, and cookie options.
 *
 * @example
 * const config: CsrfOptions = {
 *   enabled: true,
 *   methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
 *   exceptRoutes: ['/api/webhook'],
 *   enableXsrfCookie: true,
 *   cookieOptions: { httpOnly: false }
 * }
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

  /**
   * Cookie options for the XSRF-TOKEN cookie when enableXsrfCookie is true
   */
  cookieOptions?: Partial<CookieOptions>
}

/**
 * Main Shield configuration object that combines all security guard options.
 * Defines the complete configuration for all security middleware guards.
 *
 * @example
 * const config: ShieldConfig = {
 *   csrf: { enabled: true },
 *   csp: { enabled: true, directives: { defaultSrc: ["'self'"] } },
 *   hsts: { enabled: true, maxAge: '1 year' },
 *   xFrame: { enabled: true, action: 'SAMEORIGIN' },
 *   contentTypeSniffing: { enabled: true }
 * }
 */
export type ShieldConfig = {
  /**
   * X-Frame-Options header configuration for clickjacking protection
   */
  xFrame: XFrameOptions

  /**
   * X-Content-Type-Options header configuration to prevent MIME sniffing
   */
  contentTypeSniffing: ContentTypeSniffingOptions

  /**
   * HTTP Strict Transport Security (HSTS) header configuration
   */
  hsts: HstsOptions

  /**
   * Content Security Policy (CSP) header configuration
   */
  csp: CspOptions

  /**
   * Cross-Site Request Forgery (CSRF) protection configuration
   */
  csrf: CsrfOptions
}
