/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@ioc:Adonis/Addons/Shield' {
  import { CookieOptions } from '@ioc:Adonis/Core/Response'
  import { ContentSecurityPolicyOptions } from 'helmet-csp'
  import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

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
   * Config for X-XSS-Protection
   */
  export type XSSOptions = {
    enabled: boolean
    enableOnOldIE?: boolean
    reportUri?: string
    mode?: 'block' | null
  }

  /**
   * Config for X-Download-Options
   */
  export type IENoOpenOptions = {
    enabled: boolean
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
    exceptRoutes?: string[] | ((ctx: HttpContextContract) => boolean)
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
    xss: XSSOptions
    noOpen: IENoOpenOptions
    dnsPrefetch: DnsPrefetchOptions
    csp: CspOptions
    csrf: CsrfOptions
  }
}
