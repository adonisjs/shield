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

/**
 * Extending Japa Api Client with new macros
 */

declare module '@japa/api-client' {
  interface ApiRequest {
    setCsrfToken: boolean

    /**
     * Send CSRF token to the server when making the
     * API request.
     */
    withCsrfToken(): this
  }
}
