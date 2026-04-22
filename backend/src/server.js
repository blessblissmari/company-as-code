'use strict'

/**
 * Local dev HTTP server that mimics what Yandex API Gateway passes to each
 * Cloud Function handler. Not used in production.
 */

const http = require('http')
const { handler } = require('./index')

const PORT = Number(process.env.PORT || 8787)

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  try {
    const body = await readBody(req)
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    const event = {
      httpMethod: req.method,
      path: url.pathname,
      url: url.pathname + url.search,
      headers: req.headers,
      queryStringParameters: Object.fromEntries(url.searchParams.entries()),
      body,
      isBase64Encoded: false,
    }
    const result = await handler(event, {})
    res.writeHead(result.statusCode || 200, result.headers || {})
    res.end(typeof result.body === 'string' ? result.body : JSON.stringify(result.body))
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'server_error', message: err.message }))
  }
})

server.listen(PORT, () => {
  console.log(`[company-as-code] local dev server listening on http://localhost:${PORT}`)
})
