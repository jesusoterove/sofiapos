#!/usr/bin/env node

/**
 * Compares all leaf keys between EN and ES translations in i18n.ts
 * and reports any missing or extra keys.
 *
 * Usage: node scripts/check-i18n.js
 */

const fs = require('fs')
const path = require('path')

const i18nPath = path.resolve(__dirname, '..', 'src', 'lib', 'i18n.ts')
const source = fs.readFileSync(i18nPath, 'utf8')

function extractLeafKeys(obj, prefix = '') {
  const keys = []
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys.push(...extractLeafKeys(v, full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

// Extract the resources object by evaluating the const block
// We parse it as a JS object literal by finding the `resources = {` block
const resourcesMatch = source.match(/const resources\s*=\s*(\{[\s\S]*?\n\};)/m)
if (!resourcesMatch) {
  console.error('Could not find resources object in i18n.ts')
  process.exit(1)
}

let resources
try {
  // eslint-disable-next-line no-eval
  resources = eval(`(${resourcesMatch[1].replace(/;$/, '')})`)
} catch (e) {
  console.error('Failed to parse resources:', e.message)
  process.exit(1)
}

const enKeys = extractLeafKeys(resources.en?.translation ?? {})
const esKeys = extractLeafKeys(resources.es?.translation ?? {})

const enSet = new Set(enKeys)
const esSet = new Set(esKeys)

const missingInEs = enKeys.filter((k) => !esSet.has(k))
const extraInEs = esKeys.filter((k) => !enSet.has(k))

let exitCode = 0

if (missingInEs.length > 0) {
  console.log(`\n❌  ${missingInEs.length} key(s) missing in ES:\n`)
  missingInEs.forEach((k) => console.log(`   - ${k}`))
  exitCode = 1
}

if (extraInEs.length > 0) {
  console.log(`\n⚠️   ${extraInEs.length} extra key(s) in ES (not in EN):\n`)
  extraInEs.forEach((k) => console.log(`   - ${k}`))
  exitCode = 1
}

if (exitCode === 0) {
  console.log(`\n✅  i18n parity OK — ${enKeys.length} EN keys, ${esKeys.length} ES keys\n`)
} else {
  console.log('')
}

process.exit(exitCode)
