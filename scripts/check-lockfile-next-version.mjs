import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))

const expectedNext = pkg.dependencies?.next
const expectedEslint = pkg.devDependencies?.['eslint-config-next']
const lockNext = lock.packages?.['node_modules/next']?.version
const lockEslint = lock.packages?.['node_modules/eslint-config-next']?.version

const mismatches = []
if (expectedNext !== lockNext) mismatches.push(`next: package.json=${expectedNext} package-lock.json=${lockNext}`)
if (expectedEslint !== lockEslint) mismatches.push(`eslint-config-next: package.json=${expectedEslint} package-lock.json=${lockEslint}`)

if (mismatches.length > 0) {
  console.error('Lockfile mismatch detected:')
  for (const mismatch of mismatches) console.error(` - ${mismatch}`)
  process.exit(1)
}

console.log('Next.js lockfile versions are consistent.')
