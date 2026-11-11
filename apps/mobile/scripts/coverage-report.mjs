#!/usr/bin/env node
// Usage: node scripts/coverage-report.mjs [file1.tsx file2.tsx ...]
// Prints uncovered statements/branches with exact line numbers for the target files.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const targetFiles = process.argv.slice(2);
const files = targetFiles.length ? targetFiles : [
  'src/othoni/odigos/odigos.tsx',
  'src/othoni/tutor/tutor.tsx',
  'src/othoni/rythisies/rythisies-ai.tsx',
  'src/othoni/xartis/xartis.tsx',
];

// Run vitest coverage once, writing the json report.
execSync(
  'npx vitest run ' +
    files.map((f) => `src/othoni/${f.split('/').at(-2)}/${f.split('/').at(-1).replace('.tsx', '.test.tsx')}`).join(' ') +
    " --coverage.enabled=true --coverage.reporter=json '--coverage.include=src/othoni/**'",
  { stdio: 'inherit' }
);

const cov = JSON.parse(readFileSync('coverage/coverage-final.json', 'utf8'));

for (const [path, data] of Object.entries(cov)) {
  if (!files.some((f) => path.endsWith(f))) continue;
  const src = readFileSync(path, 'utf8').split('\n');
  console.log('\n' + '='.repeat(70));
  console.log('FILE: ' + path);

  const stmtLines = [];
  for (const [id, count] of Object.entries(data.s)) {
    if (count === 0) {
      const loc = data.statementMap[id];
      stmtLines.push(loc.start.line);
    }
  }
  const branches = [];
  let totalBranches = 0;
  for (const [id, counts] of Object.entries(data.b)) {
    const loc = data.branchMap && data.branchMap[id];
    totalBranches += counts.length;
    counts.forEach((c, i) => {
      if (c === 0 && loc && loc.loc && loc.loc.start) {
        branches.push({ line: loc.loc.start.line, column: loc.loc.start.column, path: i });
      }
    });
  }
  console.log(`UNCOVERED STATEMENTS (${stmtLines.length}):`);
  for (const line of [...new Set(stmtLines)].sort((a, b) => a - b)) {
    console.log(`  ${line}: ${src[line - 1]?.trim()}`);
  }
  console.log(`UNCOVERED BRANCHES (${branches.length} of ${totalBranches} paths):`);
  for (const { line, column, path: p } of branches.sort((a, b) => a.line - b.line)) {
    console.log(`  ${line}:${column} (branch ${p}) ${src[line - 1]?.trim()}`);
  }
}

// keep the json artifact for the gate
writeFileSync('/tmp/coverage-final.json', JSON.stringify(cov));
