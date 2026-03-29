import { readFileSync } from 'node:fs'
import ts from 'typescript'

function parseFile(file) {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  )
}

function countDeclarations(sourceFile, targetName) {
  let count = 0

  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === targetName) {
      count += 1
    }

    if (ts.isFunctionDeclaration(node) && node.name?.text === targetName) {
      count += 1
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return count
}

const checks = [
  {
    file: 'lib/supabase/client.ts',
    declaration: 'browserClient',
    expected: 1,
    label: 'browserClient declaration',
  },
  {
    file: 'lib/auth.ts',
    declaration: 'ensureUserProfile',
    expected: 1,
    label: 'ensureUserProfile declaration',
  },
]

const errors = []

for (const check of checks) {
  const sourceFile = parseFile(check.file)
  const count = countDeclarations(sourceFile, check.declaration)

  if (count !== check.expected) {
    errors.push(`${check.file}: expected ${check.expected} ${check.label}, found ${count}`)
  }
}

if (errors.length > 0) {
  console.error('Critical module sanity check failed:')
  for (const error of errors) console.error(` - ${error}`)
  process.exit(1)
}

console.log('Critical module sanity check passed.')
