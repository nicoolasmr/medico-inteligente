import { readFileSync } from 'node:fs'

const checks = [
  {
    file: 'lib/supabase/client.ts',
    pattern: /\blet\s+browserClient\b/g,
    expected: 1,
    label: 'browserClient declaration',
  },
  {
    file: 'lib/auth.ts',
    pattern: /\basync\s+function\s+ensureUserProfile\b/g,
    expected: 1,
    label: 'ensureUserProfile declaration',
  },
]

const errors = []

for (const check of checks) {
  const content = readFileSync(check.file, 'utf8')
  const matches = content.match(check.pattern)
  const count = matches ? matches.length : 0

  if (count !== check.expected) {
    errors.push(
      `${check.file}: expected ${check.expected} ${check.label}, found ${count}`
    )
  }
}

if (errors.length > 0) {
  console.error('Critical module sanity check failed:')
  for (const error of errors) console.error(` - ${error}`)
  process.exit(1)
}

console.log('Critical module sanity check passed.')
