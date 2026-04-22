'use strict'

const { parseBody, ok, badRequest, notFound, preflight, serverError } = require('../lib/response')
const { getCompany, getOutput } = require('../lib/storage')
const { completeJson } = require('../lib/yandexgpt')
const { buildSimulatePrompt } = require('../lib/prompts')

const SEVERITIES = new Set(['low', 'medium', 'high'])

async function handler(event) {
  if (event?.httpMethod === 'OPTIONS') return preflight()
  try {
    const body = parseBody(event)
    const id = body.companyId
    const scenario = String(body.scenario || '').trim()
    if (!id) return badRequest('companyId is required')
    if (!scenario) return badRequest('scenario is required')

    const company = getCompany(id)
    if (!company) return notFound(`No company with id ${id}`)

    const previousOutput = getOutput(id)
    const prompt = buildSimulatePrompt(company, scenario, previousOutput)
    const raw = await completeJson({ ...prompt, temperature: 0.5, maxTokens: 1500 })

    const result = {
      scenario: String(raw?.scenario || scenario),
      impacts: (Array.isArray(raw?.impacts) ? raw.impacts : []).map((im) => ({
        area: String(im.area || ''),
        effect: String(im.effect || ''),
        severity: SEVERITIES.has(im.severity) ? im.severity : 'medium',
      })),
      recommendations: (Array.isArray(raw?.recommendations) ? raw.recommendations : []).map(String),
    }
    return ok({ result })
  } catch (err) {
    if (err.status === 400) return badRequest(err.message)
    return serverError('Failed to run simulation', err.message)
  }
}

module.exports = { handler }
module.exports.handler = handler
