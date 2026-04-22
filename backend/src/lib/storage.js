'use strict'

const fs = require('fs')
const path = require('path')

/**
 * Simple JSON-file / in-memory storage abstraction.
 *
 * In local dev (DATA_DIR set) companies are persisted as JSON files in a
 * directory on disk. In Yandex Cloud Functions (stateless, read-only FS),
 * falls back to an in-memory Map that survives for the life of the container.
 *
 * For production, swap the adapter for Yandex Object Storage (S3-compatible)
 * or YDB; the public interface (`saveCompany`, `getCompany`, `saveOutput`,
 * `getOutput`) intentionally stays minimal.
 */

const memory = {
  companies: new Map(),
  outputs: new Map(),
}

const DATA_DIR = process.env.DATA_DIR || null

function ensureDir() {
  if (DATA_DIR && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function filePath(kind, id) {
  return path.join(DATA_DIR, `${kind}-${id}.json`)
}

function saveCompany(company) {
  memory.companies.set(company.id, company)
  if (DATA_DIR) {
    ensureDir()
    fs.writeFileSync(filePath('company', company.id), JSON.stringify(company, null, 2))
  }
  return company
}

function getCompany(id) {
  if (memory.companies.has(id)) return memory.companies.get(id)
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

function saveOutput(companyId, output) {
  memory.outputs.set(companyId, output)
  if (DATA_DIR) {
    ensureDir()
    fs.writeFileSync(filePath('output', companyId), JSON.stringify(output, null, 2))
  }
  return output
}

function getOutput(companyId) {
  if (memory.outputs.has(companyId)) return memory.outputs.get(companyId)
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

module.exports = { saveCompany, getCompany, saveOutput, getOutput }
