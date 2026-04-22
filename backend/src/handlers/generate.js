'use strict'

const { parseBody, ok, badRequest, notFound, preflight, serverError } = require('../lib/response')
const { getCompany, saveOutput } = require('../lib/storage')
const { completeJson } = require('../lib/yandexgpt')
const { buildGeneratePrompt } = require('../lib/prompts')
const { maybeAttachMcpDescriptors } = require('../lib/mcp-adapter')

async function handler(event) {
  if (event?.httpMethod === 'OPTIONS') return preflight()
  try {
    const body = parseBody(event)
    const id = body.companyId
    // Accept either a stored companyId OR an inline company object. The latter
    // is what the frontend uses because Yandex Cloud Functions are stateless
    // and cold-start containers don't share the in-memory store.
    let company = body.company || (id ? getCompany(id) : null)
    if (!company) {
      return id ? notFound(`No company with id ${id}`) : badRequest('company or companyId is required')
    }

    const prompt = buildGeneratePrompt(company)
    const raw = await completeJson({ ...prompt, temperature: 0.4, maxTokens: 3000 })
    const output = normalizeGenerationOutput(raw)
    const enriched = maybeAttachMcpDescriptors(output)
    if (company.id) saveOutput(company.id, enriched)
    return ok({ output: enriched })
  } catch (err) {
    if (err.status === 400) return badRequest(err.message)
    return serverError('Failed to generate company design', err.message)
  }
}

function asArray(v) {
  return Array.isArray(v) ? v : []
}

function normalizeGenerationOutput(raw) {
  return {
    playbooks: asArray(raw?.playbooks).map((p) => ({
      department: String(p.department || ''),
      title: String(p.title || ''),
      steps: asArray(p.steps).map(String),
    })),
    workflows: asArray(raw?.workflows).map((w) => ({
      name: String(w.name || ''),
      owner: String(w.owner || ''),
      triggers: asArray(w.triggers).map(String),
      steps: asArray(w.steps).map((s) => ({
        step: String(s.step || ''),
        responsible: String(s.responsible || ''),
      })),
    })),
    sops: asArray(raw?.sops).map((s) => ({
      title: String(s.title || ''),
      department: String(s.department || ''),
      purpose: String(s.purpose || ''),
      procedure: asArray(s.procedure).map(String),
    })),
    orgStructure: asArray(raw?.orgStructure).map((o) => ({
      role: String(o.role || ''),
      reportsTo: o.reportsTo == null ? null : String(o.reportsTo),
      department: String(o.department || ''),
    })),
    bottlenecks: asArray(raw?.bottlenecks).map(String),
    optimizations: asArray(raw?.optimizations).map(String),
  }
}

module.exports = { handler, normalizeGenerationOutput }
module.exports.handler = handler
