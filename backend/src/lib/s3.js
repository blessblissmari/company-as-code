'use strict'

const crypto = require('crypto')
const https = require('https')
const { URL } = require('url')

/**
 * Minimal S3 client using AWS Signature v4, dependency-free. Compatible with
 * Yandex Object Storage (region `ru-central1`, endpoint `storage.yandexcloud.net`).
 *
 * Supports only the operations the app needs: PUT / GET / DELETE a single
 * JSON object by key. Not a general-purpose S3 client.
 */

const REGION = process.env.S3_REGION || 'ru-central1'
const ENDPOINT = process.env.S3_ENDPOINT || 'https://storage.yandexcloud.net'
const SERVICE = 's3'

function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

function hmac(key, str) {
  return crypto.createHmac('sha256', key).update(str).digest()
}

function ymd(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function iso(d) {
  return d.toISOString().replace(/[:-]|\.\d{3}/g, '')
}

function signingKey(secret, date, region, service) {
  const kDate = hmac('AWS4' + secret, date)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  return hmac(kService, 'aws4_request')
}

function request({ method, bucket, key, body, contentType = 'application/json' }) {
  const accessKey = process.env.S3_ACCESS_KEY_ID
  const secretKey = process.env.S3_SECRET_ACCESS_KEY
  if (!accessKey || !secretKey) {
    const err = new Error('S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY not configured')
    err.status = 500
    return Promise.reject(err)
  }

  const url = new URL(`${ENDPOINT}/${bucket}/${encodeURIComponent(key)}`)
  const now = new Date()
  const amzDate = iso(now)
  const dateStamp = ymd(now)
  const host = url.host
  const payload = body || ''
  const payloadBuf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf-8')
  const payloadHash = hash(payloadBuf)

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'

  const canonicalRequest = [
    method,
    url.pathname,
    '', // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hash(canonicalRequest),
  ].join('\n')

  const signature = crypto
    .createHmac('sha256', signingKey(secretKey, dateStamp, REGION, SERVICE))
    .update(stringToSign)
    .digest('hex')

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`

  const headers = {
    Host: host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    Authorization: authorization,
  }
  if (method === 'PUT') {
    headers['Content-Type'] = contentType
    headers['Content-Length'] = payloadBuf.length
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method,
        headers,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8')
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ statusCode: res.statusCode, body: raw })
          } else if (res.statusCode === 404) {
            resolve({ statusCode: 404, body: raw })
          } else {
            const err = new Error(`S3 ${method} ${key} ${res.statusCode}: ${raw}`)
            err.statusCode = res.statusCode
            reject(err)
          }
        })
      },
    )
    req.on('error', reject)
    if (method === 'PUT') req.write(payloadBuf)
    req.end()
  })
}

async function putJson(bucket, key, obj) {
  return request({ method: 'PUT', bucket, key, body: JSON.stringify(obj) })
}

async function getJson(bucket, key) {
  const res = await request({ method: 'GET', bucket, key })
  if (res.statusCode === 404) return null
  try {
    return JSON.parse(res.body)
  } catch (_e) {
    return null
  }
}

async function deleteObject(bucket, key) {
  return request({ method: 'DELETE', bucket, key })
}

module.exports = { putJson, getJson, deleteObject, REGION, ENDPOINT }
