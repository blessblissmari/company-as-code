'use strict'

/**
 * Build an API Gateway–compatible HTTP response for a Yandex Cloud Function.
 * https://cloud.yandex.com/en/docs/functions/concepts/function-invoke#response
 */
function httpResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...extraHeaders,
    },
    isBase64Encoded: false,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }
}

function ok(body) {
  return httpResponse(200, body)
}

function created(body) {
  return httpResponse(201, body)
}

function badRequest(message, details) {
  return httpResponse(400, { error: 'bad_request', message, ...(details ? { details } : {}) })
}

function notFound(message = 'not found') {
  return httpResponse(404, { error: 'not_found', message })
}

function serverError(message, details) {
  return httpResponse(500, { error: 'server_error', message, ...(details ? { details } : {}) })
}

function preflight() {
  return httpResponse(204, '', { 'Access-Control-Max-Age': '86400' })
}

/** Parse the event body (Yandex API Gateway may base64-encode it). */
function parseBody(event) {
  if (!event || event.body == null || event.body === '') return {}
  let raw = event.body
  if (event.isBase64Encoded) {
    raw = Buffer.from(raw, 'base64').toString('utf-8')
  }
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch (_e) {
    const err = new Error('Invalid JSON body')
    err.status = 400
    throw err
  }
}

module.exports = { httpResponse, ok, created, badRequest, notFound, serverError, preflight, parseBody }
