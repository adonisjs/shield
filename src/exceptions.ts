/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { createError } from '@poppinss/utils'

export const E_BAD_CSRF_TOKEN = createError('Invalid CSRF Token', 'E_BAD_CSRF_TOKEN', 403)
