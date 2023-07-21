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

/**
 * Config for `X-Frame-Options` header
 */
export type XFrameOptions =
  | {
      enabled: boolean
      action?: 'DENY' | 'SAMEORIGIN'
    }
  | {
      enabled: boolean
      action?: 'ALLOW-FROM'
      domain: string
    }

/**
 * Config for X-Content-Type-Options
 */
export type ContentTypeSniffingOptions = {
  enabled: boolean
}

/**
 * Config for HTTP Strict Transport Security (HSTS)
 */
export type HstsOptions = {
  enabled: boolean
  maxAge?: string | number
  includeSubDomains?: boolean
  preload?: boolean
}

/**
 * Config for X-DNS-Prefetch-Control
 */
export type DnsPrefetchOptions = {
  enabled: boolean
  allow?: boolean
}

/**
 * Config for working with CSP
 */
export type CspOptions = { enabled: boolean } & ContentSecurityPolicyOptions

/**
 * Config for working with CSRF options
 */
export type CsrfOptions = {
  enabled: boolean
  exceptRoutes?: string[] | ((ctx: HttpContext) => boolean)
  enableXsrfCookie?: boolean
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
  dnsPrefetch: DnsPrefetchOptions
  csp: CspOptions
  csrf: CsrfOptions
}
