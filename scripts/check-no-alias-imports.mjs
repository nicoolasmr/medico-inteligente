import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const roots = ['app', 'components', 'lib', 'workers', '__tests__']
const allowedExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const violations = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      walk(fullPath)
      continue
    }

    if (!allowedExts.has(extname(fullPath))) continue

    const content = readFileSync(fullPath, 'utf8')
    if (content.includes("from '@/") || content.includes("import '@/") || content.includes("require('@/")) {
      violations.push(fullPath)
    }
  }
}

for (const root of roots) {
  walk(root)
}

if (violations.length > 0) {
  console.error('Found forbidden alias imports using @/:')
  for (const violation of violations) {
    console.error(` - ${violation}`)
  }
  process.exit(1)
}

console.log('No @/ alias imports found in source files.')
