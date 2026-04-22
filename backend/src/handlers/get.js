'use strict'

const { ok, badRequest, notFound, preflight, serverError } = require('../lib/response')
const { getCompany, getOutput } = require('../lib/storage')

/**
 * Yandex API Gateway maps `{id}` path parameters into event.pathParams.id.
 * We also fall back to pathParameters (API Gateway aws-compat) and to the
 * last path segment for local dev.
 */
function extractId(event) {
  if (!event) return null
  if (event.pathParams?.id) return event.pathParams.id
  if (event.pathParameters?.id) return event.pathParameters.id
  if (typeof event.path === 'string') {
    const m = event.path.match(/\/company\/([^/?#]+)/)
    if (m) return decodeURIComponent(m[1])
  }
  return null
}

async function handler(event) {
  if (event?.httpMethod === 'OPTIONS') return preflight()
  try {
    const id = extractId(event)
    if (!id) return badRequest('company id is required in the path')
    const company = await getCompany(id)
    if (!company) return notFound(`No company with id ${id}`)
    const output = (await getOutput(id)) || null
    return ok({ company, output })
  } catch (err) {
    return serverError('Failed to load company', err.message)
  }
}

module.exports = { handler, extractId }
module.exports.handler = handler
