/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ContentSecurityPolicyOptions } from 'helmet-csp'
import type { ServerResponse, IncomingMessage } from 'node:http'

import type { ValueOf } from '../../types.js'

/**
 * A collection of CSP keywords that are resolved to actual values
 * during an HTTP request.
 */
class CSPKeywords {
  #keywordsResolvers: Record<string, (_: IncomingMessage, response: ServerResponse) => string> = {}

  /**
   * Register a custom CSP directive keyword and resolve
   * it to a value during an HTTP request.
   */
  register(keyword: string, resolver: (_: IncomingMessage, response: ServerResponse) => string) {
    this.#keywordsResolvers[keyword] = resolver
    return this
  }

  /**
   * Resolves keywords
   */
  resolve(
    directiveValues: ValueOf<Exclude<ContentSecurityPolicyOptions['directives'], undefined>>
  ): ValueOf<Exclude<ContentSecurityPolicyOptions['directives'], undefined>> {
    if (Array.isArray(directiveValues)) {
      const keywords = Object.keys(this.#keywordsResolvers)
      keywords.forEach((keyword) => {
        const keywordIndex = directiveValues.indexOf(keyword)
        if (keywordIndex > -1) {
          directiveValues[keywordIndex] = this.#keywordsResolvers[keyword]
        }
      })
    }

    return directiveValues
  }
}

const cspKeywords = new CSPKeywords()
export { cspKeywords }
