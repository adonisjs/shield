/*
 * @adonisjs/shield
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@poppinss/utils'

/**
 * Invalid CSRF token
 */
export class InvalidCsrfTokenException extends Exception {
  public static invoke() {
    return new this('Invalid CSRF Token', 403, 'E_BAD_CSRF_TOKEN')
  }
}
