/**
 * Build script for Electron application.
 * Compiles TypeScript files and builds the application.
 */
import { build } from 'esbuild'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure dist-electron directory exists
mkdirSync(path.join(__dirname, 'dist-electron'), { recursive: true })

async function buildElectron() {
  console.log('Building Electron main process...')
  
  try {
    // Build main process
    await build({
      entryPoints: [path.join(__dirname, 'electron/main.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: path.join(__dirname, 'dist-electron/main.cjs'),
      external: ['electron'],
      format: 'cjs',
      sourcemap: true,
      banner: {
        js: '// This file is CommonJS\n',
      },
    })
    
    console.log('Building Electron preload script...')
    
    // Build preload script
    await build({
      entryPoints: [path.join(__dirname, 'electron/preload.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      outfile: path.join(__dirname, 'dist-electron/preload.cjs'),
      external: ['electron'],
      format: 'cjs',
      sourcemap: true,
      banner: {
        js: '// This file is CommonJS\n',
      },
    })
    
    console.log('✓ Electron build complete')
  } catch (error) {
    console.error('Error building Electron:', error)
    process.exit(1)
  }
}

// Always run when called directly
buildElectron().catch((error) => {
  console.error('Build failed:', error)
  process.exit(1)
})

