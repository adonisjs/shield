/*
 * @adonisjs/shield
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { ServerResponse, IncomingMessage } from 'node:http'

import type { ValueOf } from '../../types.ts'
import type { ContentSecurityPolicyOptions } from '../../helmet-csp.cts'

/**
 * A collection of CSP keywords that are resolved to actual values
 * during an HTTP request. Allows registration of dynamic CSP directive values.
 *
 * @example
 * cspKeywords.register('@nonce', (req, res) => `'nonce-${res.nonce}'`)
 */
class CSPKeywords {
  /**
   * Registry of keyword resolvers that transform keywords to CSP directive values
   */
  #keywordsResolvers: Record<string, (_: IncomingMessage, response: ServerResponse) => string> = {}

  /**
   * Registers a custom CSP directive keyword and its resolver function.
   * The resolver function transforms the keyword to an actual CSP value during requests.
   *
   * @param keyword - The keyword to register (e.g., '@nonce')
   * @param resolver - Function that resolves the keyword to a CSP value
   */
  register(keyword: string, resolver: (_: IncomingMessage, response: ServerResponse) => string) {
    this.#keywordsResolvers[keyword] = resolver
    return this
  }

  /**
   * Resolves registered keywords in CSP directive values to their actual values.
   *
   * @param directiveValues - The directive values that may contain keywords
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

/**
 * Global instance of CSPKeywords for registering and resolving CSP directive keywords.
 *
 * @example
 * cspKeywords.register('@nonce', (req, res) => `'nonce-${res.nonce}'`)
 */
const cspKeywords = new CSPKeywords()
export { cspKeywords }
