'use strict'

const ALLOWED_STRATEGIES = new Set([
  'aggressive-growth',
  'lean-efficiency',
  'customer-obsessed',
  'product-led',
  'enterprise-sales',
])

function validateCompanyInput(input) {
  const errors = []
  if (!input || typeof input !== 'object') {
    return ['Body must be a JSON object']
  }
  if (!input.name || typeof input.name !== 'string') errors.push('name is required')
  if (!input.industry || typeof input.industry !== 'string') errors.push('industry is required')
  if (!input.size || typeof input.size !== 'string') errors.push('size is required')
  if (!input.goals || typeof input.goals !== 'string') errors.push('goals is required')
  if (!ALLOWED_STRATEGIES.has(input.strategyStyle)) {
    errors.push(`strategyStyle must be one of: ${[...ALLOWED_STRATEGIES].join(', ')}`)
  }
  if (!Array.isArray(input.departments) || input.departments.length === 0) {
    errors.push('departments must be a non-empty array')
  } else {
    input.departments.forEach((d, i) => {
      if (!d || typeof d !== 'object') {
        errors.push(`departments[${i}] must be an object`)
        return
      }
      if (!d.name) errors.push(`departments[${i}].name is required`)
      if (!d.type) errors.push(`departments[${i}].type is required`)
      if (!Array.isArray(d.roles)) errors.push(`departments[${i}].roles must be an array`)
    })
  }
  return errors
}

module.exports = { validateCompanyInput, ALLOWED_STRATEGIES }
