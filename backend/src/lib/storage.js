'use strict'

const fs = require('fs')
const path = require('path')
const { putJson, getJson } = require('./s3')

/**
 * Storage abstraction with three backends, selected automatically:
 *
 * 1. **Yandex Object Storage** (production) — when `S3_BUCKET` is set and
 *    `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` are present. Companies and
 *    outputs are stored as JSON objects under `companies/<id>.json` and
 *    `outputs/<id>.json`.
 *
 * 2. **Local JSON files** (dev) — when `DATA_DIR` is set. Good for running
 *    the dev server offline.
 *
 * 3. **In-memory Map** (fallback) — always on as a cache, survives for the
 *    life of a warm Yandex Cloud Function container.
 *
 * Errors from the remote backend are NEVER fatal: they're logged and the
 * in-memory fallback is returned so the app keeps working. This matches MVP
 * expectations and protects cold-starts from transient S3 hiccups.
 */

const memory = { companies: new Map(), outputs: new Map() }
const DATA_DIR = process.env.DATA_DIR || null
const BUCKET = process.env.S3_BUCKET || null

function s3Enabled() {
  return Boolean(BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)
}

function ensureDir() {
  if (DATA_DIR && !fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function filePath(kind, id) {
  return path.join(DATA_DIR, `${kind}-${id}.json`)
}

function keyFor(kind, id) {
  return `${kind}/${id}.json`
}

async function saveCompany(company) {
  memory.companies.set(company.id, company)
  if (DATA_DIR) {
    try {
      ensureDir()
      fs.writeFileSync(filePath('company', company.id), JSON.stringify(company, null, 2))
    } catch (e) {
      console.error('[storage] local write failed:', e.message)
    }
  }
  if (s3Enabled()) {
    try {
      await putJson(BUCKET, keyFor('companies', company.id), company)
    } catch (e) {
      console.error('[storage] s3 putJson company failed:', e.message)
    }
  }
  return company
}

async function getCompany(id) {
  if (memory.companies.has(id)) return memory.companies.get(id)
  if (s3Enabled()) {
    try {
      const fromS3 = await getJson(BUCKET, keyFor('companies', id))
      if (fromS3) {
        memory.companies.set(id, fromS3)
        return fromS3
      }
    } catch (e) {
      console.error('[storage] s3 getJson company failed:', e.message)
    }
  }
  if (DATA_DIR) {
    const p = filePath('company', id)
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'))
      memory.companies.set(id, parsed)
      return parsed
    }
  }
  return null
}

async function saveOutput(companyId, output) {
  memory.outputs.set(companyId, output)
  if (DATA_DIR) {
    try {
      ensureDir()
      fs.writeFileSync(filePath('output', companyId), JSON.stringify(output, null, 2))
    } catch (e) {
      console.error('[storage] local write output failed:', e.message)
    }
  }
  if (s3Enabled()) {
    try {
      await putJson(BUCKET, keyFor('outputs', companyId), output)
    } catch (e) {
      console.error('[storage] s3 putJson output failed:', e.message)
    }
  }
  return output
}

async function getOutput(companyId) {
  if (memory.outputs.has(companyId)) return memory.outputs.get(companyId)
  if (s3Enabled()) {
    try {
      const fromS3 = await getJson(BUCKET, keyFor('outputs', companyId))
      if (fromS3) {
        memory.outputs.set(companyId, fromS3)
        return fromS3
      }
    } catch (e) {
      console.error('[storage] s3 getJson output failed:', e.message)
    }
  }
  if (DATA_DIR) {
    const p = filePath('output', companyId)
    if (fs.existsSync(p)) {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'))
      memory.outputs.set(companyId, parsed)
      return parsed
    }
  }
  return null
}

module.exports = { saveCompany, getCompany, saveOutput, getOutput, s3Enabled }
