/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare module '@adonisjs/core/http' {
  interface Response {
    readonly nonce: string
  }
  interface Request {
    csrfToken: string
  }
}

/**
 * Extending the Node.js ServerResponse with
 * our new `nonce` property
 */
declare module 'http' {
  export interface ServerResponse {
    nonce: string
  }
}
