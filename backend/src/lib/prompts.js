'use strict'

/**
 * YandexGPT prompt templates for Company-as-Code.
 *
 * Each builder returns { system, user } strings. Templates request strict
 * JSON so we can parse reliably, and bound list sizes so responses stay
 * focused for an MVP. The language option controls the response language
 * (en | ru); JSON keys always stay in English so the frontend types match.
 */

const LANGUAGE_INSTRUCTION = {
  en:
    'Respond in English. All string values (titles, steps, triggers, effects, recommendations) must be in English.',
  ru:
    'Отвечай по-русски. Все строковые значения (названия, шаги, триггеры, эффекты, рекомендации) должны быть на русском языке. JSON-ключи оставь на английском без изменений.',
}

const BASE_SYSTEM_BASE = `You are an expert COO and org designer. You help founders turn a
company definition (departments, roles, goals, strategy) into concrete, actionable
playbooks, workflows, SOPs, and org designs.

Strict rules:
- Respond with ONLY valid JSON matching the requested schema — no prose, no markdown fences.
- Be concrete and domain-aware. Prefer specifics over platitudes.
- Tailor outputs to the company's strategy style and goals.
- Keep arrays compact: 3–6 items each unless otherwise specified.`

function baseSystem(language = 'en') {
  return `${BASE_SYSTEM_BASE}\n- ${LANGUAGE_INSTRUCTION[language] || LANGUAGE_INSTRUCTION.en}`
}

function companyContext(company) {
  return `COMPANY CONTEXT:
- Name: ${company.name}
- Industry: ${company.industry}
- Team size: ${company.size}
- Strategy style: ${company.strategyStyle}
- Goals: ${company.goals}
- Departments:
${company.departments
  .map(
    (d) =>
      `  - ${d.name} (type=${d.type}, roles=${(d.roles || []).join(', ') || 'n/a'})${
        d.notes ? `, notes=${d.notes}` : ''
      }`,
  )
  .join('\n')}`
}

function buildGeneratePrompt(company, { language = 'en' } = {}) {
  const schema = `{
  "playbooks": [{ "department": string, "title": string, "steps": string[] }],
  "workflows": [{
    "name": string,
    "owner": string,
    "triggers": string[],
    "steps": [{ "step": string, "responsible": string }]
  }],
  "sops": [{ "title": string, "department": string, "purpose": string, "procedure": string[] }],
  "orgStructure": [{ "role": string, "reportsTo": string | null, "department": string }],
  "bottlenecks": string[],
  "optimizations": string[]
}`
  return {
    system: baseSystem(language),
    user: `${companyContext(company)}

TASK: Design the operating system for this company. Produce playbooks (1 per department),
workflows (3–5 cross-functional), SOPs (3–5 most critical), a flat org structure covering
every role listed, likely bottlenecks given the strategy style, and concrete optimization ideas.

Return JSON exactly matching this schema:
${schema}`,
  }
}

function buildSimulatePrompt(company, scenario, previousOutput, { language = 'en' } = {}) {
  const schema = `{
  "scenario": string,
  "impacts": [{ "area": string, "effect": string, "severity": "low" | "medium" | "high" }],
  "recommendations": string[]
}`
  const priorBrief = previousOutput
    ? `
PRIOR GENERATED DESIGN (summary):
- Workflows: ${(previousOutput.workflows || []).map((w) => w.name).join(', ') || 'n/a'}
- Bottlenecks already noted: ${(previousOutput.bottlenecks || []).join('; ') || 'n/a'}`
    : ''
  return {
    system: baseSystem(language),
    user: `${companyContext(company)}${priorBrief}

SCENARIO: "${scenario}"

TASK: Simulate the second-order effects of this scenario on this specific company. For each
affected area (department, workflow, metric), describe the concrete effect and rate severity.
Then propose 3–5 prioritized recommendations that address the most severe impacts first.

Return JSON exactly matching this schema:
${schema}

Important: "severity" must stay as one of the strings "low", "medium", or "high" (do not translate).`,
  }
}

module.exports = {
  buildGeneratePrompt,
  buildSimulatePrompt,
  companyContext,
  baseSystem,
  LANGUAGE_INSTRUCTION,
}
