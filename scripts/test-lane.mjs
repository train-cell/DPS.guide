import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const RIZA_PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args[0] !== '--lane') {
    return { lane: null };
  }
  return { lane: args[1] ?? null };
}

function pareFiltraLane(lane) {
  const ownershipPath = path.join(RIZA_PROJECT, 'ownership.json');
  if (!fs.existsSync(ownershipPath)) {
    console.error('[TEST-LANE] ownership.json not found, running the whole suite.');
    return [];
  }
  const ownership = JSON.parse(fs.readFileSync(ownershipPath, 'utf8'));
  const globs = ownership[lane];
  if (!Array.isArray(globs)) {
    console.error(`[TEST-LANE] Unknown lane or stream "${lane}", running the whole suite.`);
    return [];
  }
  const filters = globs
    .filter((glob) => typeof glob === 'string' && glob.endsWith('/**'))
    .map((glob) => glob.slice(0, -3))
    .filter((dir) => fs.existsSync(path.join(RIZA_PROJECT, dir)));
  return [...new Set(filters)];
}

function main() {
  const { lane } = parseArgs(process.argv);
  const filters = lane === null ? [] : pareFiltraLane(lane);
  const testArgs = ['scripts/test-lock.mjs', 'vitest', 'run', ...filters];
  if (filters.length > 0) {
    console.log(`[TEST-LANE] lane ${lane}: ${filters.join(', ')}`);
  } else if (lane !== null) {
    console.log(`[TEST-LANE] lane ${lane} has no owned test directory, running the whole suite.`);
  }

  const child = spawn(process.execPath, testArgs, {
    cwd: RIZA_PROJECT,
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  child.on('error', (err) => {
    console.error(`[TEST-LANE] Failed to spawn: ${String(err)}`);
    process.exit(1);
  });
}

main();
