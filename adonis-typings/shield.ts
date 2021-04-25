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
  import { ApplicationContract } from '@ioc:Adonis/Core/Application'
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
    dnsPrefetch: DnsPrefetchOptions
    csp: CspOptions
    csrf: CsrfOptions
  }

  /**
   * Shape of the shield middleware class constructor
   */
  export interface ShieldMiddlewareContract {
    new (application: ApplicationContract): {
      handle(ctx: HttpContextContract, next: () => Promise<void>): any
    }
  }

  const ShieldMiddleware: ShieldMiddlewareContract
  export default ShieldMiddleware
}
