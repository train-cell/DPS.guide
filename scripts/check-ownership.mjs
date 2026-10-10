import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function parseArgs() {
  const args = process.argv.slice(2);
  let lane = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lane' && args[i + 1]) {
      lane = args[i + 1];
      i++;
    }
  }
  return { lane };
}

function matchGlob(filePath, pattern) {
  const normalizedFile = filePath.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');
  if (normalizedPattern === '**') return true;
  if (normalizedPattern.endsWith('/**')) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedFile === prefix || normalizedFile.startsWith(prefix + '/');
  }
  return normalizedFile === normalizedPattern;
}

function main() {
  const { lane } = parseArgs();
  if (!lane) {
    console.error('Usage: node check-ownership.mjs --lane <ID>');
    process.exit(1);
  }

  const ownershipPath = path.resolve('ownership.json');
  if (!fs.existsSync(ownershipPath)) {
    console.error('ownership.json not found');
    process.exit(1);
  }

  const ownership = JSON.parse(fs.readFileSync(ownershipPath, 'utf8'));
  const allowedPatterns = ownership[lane];
  if (!allowedPatterns) {
    console.error(`Unknown lane or stream: ${lane}`);
    process.exit(1);
  }

  let changedFiles;
  try {
    const diff = execSync('git diff --name-only contracts-v1...HEAD', { encoding: 'utf8' }).trim();
    changedFiles = diff ? diff.split(/\r?\n/) : [];
  } catch {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      changedFiles = status ? status.split(/\r?\n/).map(line => line.slice(3).trim()) : [];
    } catch {
      changedFiles = [];
    }
  }

  const files = changedFiles ?? [];

  const violations = [];
  for (const file of files) {
    if (!file) continue;
    const isAllowed = allowedPatterns.some((pattern) => matchGlob(file, pattern));
    if (!isAllowed) {
      violations.push(file);
    }
  }

  if (violations.length > 0) {
    console.error(`[OWNERSHIP VIOLATION] Lane/Stream "${lane}" is not allowed to modify:`);
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }

  console.log(`[OWNERSHIP OK] Lane/Stream "${lane}" passed ownership check (${files.length} files checked).`);
}

main();
