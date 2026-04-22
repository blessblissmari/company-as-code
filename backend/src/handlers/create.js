'use strict'

const { parseBody, created, badRequest, preflight, serverError } = require('../lib/response')
const { saveCompany } = require('../lib/storage')
const { validateCompanyInput } = require('../lib/validate')
const { newId } = require('../lib/id')

async function handler(event) {
  if (event?.httpMethod === 'OPTIONS') return preflight()
  try {
    const input = parseBody(event)
    const errors = validateCompanyInput(input)
    if (errors.length) return badRequest('Invalid company input', errors)

    const company = {
      id: newId('co'),
      createdAt: new Date().toISOString(),
      name: input.name,
      industry: input.industry,
      size: input.size,
      goals: input.goals,
      strategyStyle: input.strategyStyle,
      departments: input.departments.map((d, i) => ({
        id: d.id || `${d.type || 'dept'}-${i}`,
        type: d.type,
        name: d.name,
        roles: d.roles || [],
        notes: d.notes || undefined,
      })),
    }
    saveCompany(company)
    return created({ company })
  } catch (err) {
    if (err.status === 400) return badRequest(err.message)
    return serverError('Failed to create company', err.message)
  }
}

module.exports = { handler }
module.exports.handler = handler
