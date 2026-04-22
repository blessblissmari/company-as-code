'use strict'

const SUPPORTED = new Set(['en', 'ru'])
const DEFAULT_LANGUAGE = 'en'

function normalizeLanguage(raw) {
  if (typeof raw !== 'string') return DEFAULT_LANGUAGE
  const lower = raw.toLowerCase().slice(0, 2)
  return SUPPORTED.has(lower) ? lower : DEFAULT_LANGUAGE
}

module.exports = { normalizeLanguage, SUPPORTED, DEFAULT_LANGUAGE }
