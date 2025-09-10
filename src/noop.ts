/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { HttpContext } from '@adonisjs/core/http'

/**
 * A no-operation function that does nothing with the provided HTTP context.
 * Used as a placeholder when a guard is disabled.
 *
 * @param _ - The HTTP context (unused)
 *
 * @example
 * const guard = options.enabled ? actualGuard : noop
 * guard(ctx)
 */
export function noop(_: HttpContext) {}
