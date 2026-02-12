#!/usr/bin/env node
/**
 * Standalone script to send raw data to a printer.
 * Used as fallback when the printer module fails to load in Electron's main process
 * (e.g. due to ABI mismatch). Running with system Node often works.
 * Uses .cjs extension to force CommonJS (project has "type": "module").
 *
 * Usage: node print-raw.cjs <printerName> <dataFilePath>
 *   printerName  - Name of the printer
 *   dataFilePath - Path to file containing raw bytes to send
 */
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: node print-raw.cjs <printerName> <dataFilePath>')
  process.exit(1)
}

const printerName = args[0]
const dataFilePath = args[1]

if (!fs.existsSync(dataFilePath)) {
  console.error('Data file not found:', dataFilePath)
  process.exit(1)
}

const data = fs.readFileSync(dataFilePath)

try {
  const printer = require('printer')
  printer.printDirect({
    data,
    printer: printerName,
    type: 'RAW',
    success: () => {
      process.exit(0)
    },
    error: (err) => {
      console.error('Print error:', err)
      process.exit(1)
    },
  })
} catch (err) {
  console.error('Failed to load printer module:', err.message)
  process.exit(1)
}
