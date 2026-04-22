'use strict'

/**
 * MCP / OpenClaw adapter (stub).
 *
 * Gated behind the MCP_ENABLED feature flag. The MVP does NOT execute tools;
 * it only maps a generated workflow step into a stable, MCP-compatible
 * descriptor so a future runtime can pick it up without changing the AI layer.
 *
 * When MCP_ENABLED=false (default), `maybeAttachMcpDescriptors` is a no-op and
 * the output is returned unchanged — this preserves backwards compatibility.
 */

function isEnabled() {
  return String(process.env.MCP_ENABLED || 'false').toLowerCase() === 'true'
}

function toDescriptor(workflowName, step, index) {
  return {
    id: `${slug(workflowName)}-${index}`,
    type: 'openclaw.action',
    name: step.step,
    owner: step.responsible,
    // Placeholder: future MCP runtime will resolve `tool` and `input`.
    tool: null,
    input: {},
    status: 'proposed',
  }
}

function slug(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'wf'
}

function maybeAttachMcpDescriptors(output) {
  if (!isEnabled() || !output || !Array.isArray(output.workflows)) return output
  const enriched = {
    ...output,
    workflows: output.workflows.map((w) => ({
      ...w,
      mcp: {
        version: '0.1',
        executor: 'openclaw',
        descriptors: (w.steps || []).map((s, i) => toDescriptor(w.name, s, i)),
      },
    })),
    _mcp: {
      enabled: true,
      executor: 'openclaw',
      note: 'Descriptors only; no execution in MVP.',
    },
  }
  return enriched
}

module.exports = { isEnabled, maybeAttachMcpDescriptors }
