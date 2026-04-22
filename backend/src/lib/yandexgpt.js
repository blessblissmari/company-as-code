'use strict'

const https = require('https')

/**
 * Minimal YandexGPT client.
 *
 * Auth: an IAM token or API key via env:
 *   - YANDEX_API  (API key, recommended for Cloud Functions + service account)
 *   - YANDEX_IAM  (IAM token, shorter-lived)
 *   - YANDEX_FOLDER_ID (folder where the model lives)
 *   - MODEL_YANDEX (model URI or short name like "yandexgpt" / "yandexgpt-lite")
 *
 * Docs: https://cloud.yandex.com/en/docs/foundation-models/concepts/yandexgpt/
 */

const DEFAULT_ENDPOINT = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion'

function resolveModelUri() {
  const raw = process.env.MODEL_YANDEX || 'yandexgpt-lite'
  if (raw.startsWith('gpt://') || raw.startsWith('ds://')) return raw
  const folder = process.env.YANDEX_FOLDER_ID
  if (!folder) {
    throw new Error(
      'YANDEX_FOLDER_ID env var is required unless MODEL_YANDEX is a full gpt:// URI',
    )
  }
  return `gpt://${folder}/${raw}/latest`
}

function authHeaders() {
  if (process.env.YANDEX_IAM) {
    return { Authorization: `Bearer ${process.env.YANDEX_IAM}` }
  }
  if (process.env.YANDEX_API) {
    return { Authorization: `Api-Key ${process.env.YANDEX_API}` }
  }
  throw new Error('Missing YANDEX_API or YANDEX_IAM env var')
}

function postJson(url, headers, body) {
  const data = Buffer.from(JSON.stringify(body))
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          ...headers,
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8')
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(raw))
            } catch (e) {
              reject(new Error(`Bad JSON from YandexGPT: ${e.message}`))
            }
          } else {
            reject(new Error(`YandexGPT ${res.statusCode}: ${raw}`))
          }
        })
      },
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

/**
 * Call YandexGPT with a system + user prompt and attempt to parse the response
 * as JSON. Accepts messy responses (handles code fences, leading prose).
 */
async function completeJson({ system, user, temperature = 0.3, maxTokens = 2000 }) {
  const endpoint = process.env.YANDEX_GPT_ENDPOINT || DEFAULT_ENDPOINT
  const body = {
    modelUri: resolveModelUri(),
    completionOptions: {
      stream: false,
      temperature,
      maxTokens: String(maxTokens),
    },
    messages: [
      { role: 'system', text: system },
      { role: 'user', text: user },
    ],
  }
  const res = await postJson(endpoint, authHeaders(), body)
  const text =
    res?.result?.alternatives?.[0]?.message?.text ??
    res?.result?.alternatives?.[0]?.text ??
    ''
  return extractJson(text)
}

function extractJson(text) {
  if (!text) throw new Error('Empty model response')
  let cleaned = text.trim()
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) cleaned = fence[1].trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    cleaned = cleaned.slice(first, last + 1)
  }
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    const err = new Error(`Model did not return valid JSON: ${e.message}`)
    err.raw = text
    throw err
  }
}

module.exports = { completeJson, resolveModelUri, extractJson }
