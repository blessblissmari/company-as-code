'use strict'

const { randomUUID, randomBytes } = require('crypto')

function newId(prefix = 'co') {
  let id
  try {
    id = randomUUID()
  } catch (_e) {
    id = randomBytes(16).toString('hex')
  }
  return `${prefix}_${id.replace(/-/g, '').slice(0, 12)}`
}

module.exports = { newId }
