'use strict'

/**
 * Single-entry Yandex Cloud Function dispatcher.
 *
 * Yandex API Gateway can route each operation to a separate function
 * (handlers/*.js) — that's the recommended production deployment and what
 * `infra/api-gateway.yaml` uses. This dispatcher is provided as a convenience
 * for single-function deployments and for local testing.
 */

const create = require('./handlers/create').handler
const generate = require('./handlers/generate').handler
const simulate = require('./handlers/simulate').handler
const get = require('./handlers/get').handler
const { preflight, notFound } = require('./lib/response')

async function handler(event, context) {
  const method = (event?.httpMethod || 'GET').toUpperCase()
  const path = event?.url || event?.path || '/'
  if (method === 'OPTIONS') return preflight()

  if (method === 'POST' && path.startsWith('/company/create')) return create(event, context)
  if (method === 'POST' && path.startsWith('/company/generate')) return generate(event, context)
  if (method === 'POST' && path.startsWith('/company/simulate')) return simulate(event, context)
  if (method === 'GET' && /^\/company\/[^/]+/.test(path)) return get(event, context)

  return notFound(`No route for ${method} ${path}`)
}

module.exports = { handler }
module.exports.handler = handler
