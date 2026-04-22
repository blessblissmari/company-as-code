'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const createMod = require('../src/handlers/create')
const getMod = require('../src/handlers/get')
const { extractId } = require('../src/handlers/get')
const { validateCompanyInput } = require('../src/lib/validate')
const { maybeAttachMcpDescriptors } = require('../src/lib/mcp-adapter')
const { normalizeGenerationOutput } = require('../src/handlers/generate')
const { parseBody } = require('../src/lib/response')

function evt(method, path, body) {
  return {
    httpMethod: method,
    path,
    url: path,
    headers: { 'content-type': 'application/json' },
    body: body == null ? '' : JSON.stringify(body),
    isBase64Encoded: false,
  }
}

test('parseBody handles empty, JSON, and base64 bodies', () => {
  assert.deepEqual(parseBody({}), {})
  assert.deepEqual(parseBody({ body: '{"a":1}' }), { a: 1 })
  const b64 = Buffer.from('{"a":2}').toString('base64')
  assert.deepEqual(parseBody({ body: b64, isBase64Encoded: true }), { a: 2 })
})

test('validateCompanyInput catches missing fields', () => {
  const errs = validateCompanyInput({})
  assert.ok(errs.length >= 4)
  assert.ok(errs.some((e) => e.includes('name')))
})

test('validateCompanyInput accepts a minimal valid input', () => {
  const errs = validateCompanyInput({
    name: 'X',
    industry: 'SaaS',
    size: '10',
    goals: 'Grow',
    strategyStyle: 'product-led',
    departments: [{ name: 'Sales', type: 'sales', roles: ['AE'] }],
  })
  assert.deepEqual(errs, [])
})

test('POST /company/create returns 201 and a company with id', async () => {
  const res = await createMod.handler(
    evt('POST', '/company/create', {
      name: 'Acme',
      industry: 'SaaS',
      size: '10',
      goals: 'Grow',
      strategyStyle: 'lean-efficiency',
      departments: [{ name: 'Sales', type: 'sales', roles: ['AE'] }],
    }),
  )
  assert.equal(res.statusCode, 201)
  const body = JSON.parse(res.body)
  assert.ok(body.company.id.startsWith('co_'))
  assert.equal(body.company.name, 'Acme')
})

test('POST /company/create validates input', async () => {
  const res = await createMod.handler(evt('POST', '/company/create', { name: 'X' }))
  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.body)
  assert.equal(body.error, 'bad_request')
  assert.ok(Array.isArray(body.details))
})

test('GET /company/:id round-trips', async () => {
  const create = await createMod.handler(
    evt('POST', '/company/create', {
      name: 'Acme',
      industry: 'SaaS',
      size: '10',
      goals: 'Grow',
      strategyStyle: 'lean-efficiency',
      departments: [{ name: 'Sales', type: 'sales', roles: ['AE'] }],
    }),
  )
  const id = JSON.parse(create.body).company.id
  const res = await getMod.handler(evt('GET', `/company/${id}`))
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.body)
  assert.equal(body.company.id, id)
  assert.equal(body.output, null)
})

test('GET /company/:id 404 on missing', async () => {
  const res = await getMod.handler(evt('GET', '/company/co_doesnotexist'))
  assert.equal(res.statusCode, 404)
})

test('extractId works for pathParams and raw path', () => {
  assert.equal(extractId({ pathParams: { id: 'abc' } }), 'abc')
  assert.equal(extractId({ path: '/company/xyz' }), 'xyz')
  assert.equal(extractId({ path: '/other' }), null)
})

test('normalizeGenerationOutput coerces missing fields to safe defaults', () => {
  const out = normalizeGenerationOutput({ playbooks: [{ title: 'T' }], bottlenecks: ['b'] })
  assert.deepEqual(out.playbooks, [{ department: '', title: 'T', steps: [] }])
  assert.deepEqual(out.workflows, [])
  assert.deepEqual(out.bottlenecks, ['b'])
})

test('mcp adapter no-ops when MCP_ENABLED is unset', () => {
  delete process.env.MCP_ENABLED
  const out = { workflows: [{ name: 'W', owner: 'o', triggers: [], steps: [{ step: 'a', responsible: 'b' }] }] }
  const res = maybeAttachMcpDescriptors(out)
  assert.equal(res, out)
})

test('mcp adapter attaches descriptors when MCP_ENABLED=true', () => {
  process.env.MCP_ENABLED = 'true'
  const out = {
    workflows: [
      { name: 'Lead routing', owner: 'o', triggers: [], steps: [{ step: 'Capture', responsible: 'SDR' }] },
    ],
  }
  const res = maybeAttachMcpDescriptors(out)
  assert.equal(res._mcp.enabled, true)
  assert.equal(res.workflows[0].mcp.descriptors.length, 1)
  assert.equal(res.workflows[0].mcp.descriptors[0].owner, 'SDR')
  delete process.env.MCP_ENABLED
})

test('normalizeLanguage maps supported + locale prefixes, falls back to en', () => {
  const { normalizeLanguage } = require('../src/lib/i18n')
  assert.equal(normalizeLanguage('ru'), 'ru')
  assert.equal(normalizeLanguage('RU'), 'ru')
  assert.equal(normalizeLanguage('ru-RU'), 'ru')
  assert.equal(normalizeLanguage('en-US'), 'en')
  assert.equal(normalizeLanguage(undefined), 'en')
  assert.equal(normalizeLanguage('fr'), 'en')
})

test('buildGeneratePrompt embeds the Russian system instruction when language=ru', () => {
  const { buildGeneratePrompt } = require('../src/lib/prompts')
  const { system } = buildGeneratePrompt(
    {
      name: 'X',
      industry: 'SaaS',
      size: '10',
      goals: 'Grow',
      strategyStyle: 'product-led',
      departments: [{ name: 'Sales', type: 'sales', roles: ['AE'] }],
    },
    { language: 'ru' },
  )
  assert.ok(system.includes('по-русски'))
})

test('CORS headers reflect CORS_ALLOWED_ORIGINS when request origin matches', () => {
  const { withRequestOrigin, ok } = require('../src/lib/response')
  const origHeader = process.env.CORS_ALLOWED_ORIGINS
  process.env.CORS_ALLOWED_ORIGINS = 'https://company-as-code.pages.dev'
  try {
    const allowed = withRequestOrigin(
      { headers: { origin: 'https://company-as-code.pages.dev' } },
      () => ok({ ok: true }),
    )
    assert.equal(allowed.headers['Access-Control-Allow-Origin'], 'https://company-as-code.pages.dev')
    assert.equal(allowed.headers.Vary, 'Origin')

    const blocked = withRequestOrigin(
      { headers: { origin: 'https://evil.example.com' } },
      () => ok({ ok: true }),
    )
    assert.equal(blocked.headers['Access-Control-Allow-Origin'], 'https://company-as-code.pages.dev')
  } finally {
    if (origHeader == null) delete process.env.CORS_ALLOWED_ORIGINS
    else process.env.CORS_ALLOWED_ORIGINS = origHeader
  }
})

test('CORS allows any origin when CORS_ALLOWED_ORIGINS is unset', () => {
  const { withRequestOrigin, ok } = require('../src/lib/response')
  const orig = process.env.CORS_ALLOWED_ORIGINS
  delete process.env.CORS_ALLOWED_ORIGINS
  try {
    const res = withRequestOrigin(
      { headers: { origin: 'https://anywhere.example.com' } },
      () => ok({ ok: true }),
    )
    assert.equal(res.headers['Access-Control-Allow-Origin'], '*')
  } finally {
    if (orig != null) process.env.CORS_ALLOWED_ORIGINS = orig
  }
})
