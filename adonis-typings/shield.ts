/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

declare module '@ioc:Adonis/Addons/Shield' {
  import { CspOptions as HelmetCspOptions } from 'helmet-csp/dist/lib/types'

  export type XFrameOptions = {
    enabled: boolean,
    action?: 'DENY' | 'SAMEORIGIN',
  } | {
    enabled: boolean,
    action?: 'ALLOW-FROM',
    domain: string,
  }

  // X-Content-Type-Options
  export type ContentTypeSniffingOptions = {
    enabled: boolean,
  }

  // HTTP Strict Transport Security (HSTS)
  export type HstsOptions = {
    enabled: boolean,
    maxAge?: string | number,
    includeSubDomains?: boolean,
    preload?: boolean,
  }

  // X-XSS-Protection
  export type XSSOptions = {
    enabled: boolean,
    enableOnOldIE?: boolean,
    reportUri?: string,
    mode?: 'block' | null,
  }

  // X-Download-Options
  export type IENoOpenOptions = {
    enabled: boolean,
  }

  // X-DNS-Prefetch-Control
  export type DnsPrefetchOptions = {
    enabled: boolean,
    allow?: boolean,
  }

  export type CspOptions = {
    enabled: boolean,
  } & HelmetCspOptions

  export type CsrfOptions = {
    enabled: boolean,
    filterUris?: string[],
    methods?: ReadonlyArray<string>,
    cookieOptions?: {
      httpOnly?: boolean,
      sameSite?: boolean,
      path?: string,
      maxAge?: number
    }
  }
}
