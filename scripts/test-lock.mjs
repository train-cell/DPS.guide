import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const RIZA_PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Εργαλεία Node που καλούνται μέσω του JS entry τους, ώστε να μην εξαρτώνται από το .bin shell shim. */
const EISODOI_ERGALEION = Object.freeze({
  vitest: 'vitest/vitest.mjs',
  eslint: 'eslint/bin/eslint.js',
  tsc: 'typescript/bin/tsc',
});

const LOCK_DIR = path.join(os.tmpdir(), 'DPS.guide-test-locks');
const MAX_SLOTS = 4;
const RETRY_INTERVAL_MS = 250;
const TIMEOUT_MS = 120_000;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore concurrent creation
    }
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
}

function tryAcquireSlot() {
  ensureDir(LOCK_DIR);
  for (let slot = 0; slot < MAX_SLOTS; slot++) {
    const lockPath = path.join(LOCK_DIR, `slot-${slot}.lock`);
    try {
      fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
      return { slot, lockPath };
    } catch (err) {
      if (err.code === 'EEXIST') {
        try {
          const content = fs.readFileSync(lockPath, 'utf8').trim();
          const pid = Number.parseInt(content, 10);
          if (Number.isFinite(pid) && !isProcessAlive(pid)) {
            fs.unlinkSync(lockPath);
            fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
            return { slot, lockPath };
          }
        } catch {
          // race condition reading or writing
        }
      }
    }
  }
  return null;
}

async function acquireLock() {
  const startTime = Date.now();
  while (Date.now() - startTime < TIMEOUT_MS) {
    const acquired = tryAcquireSlot();
    if (acquired) return acquired;
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
  }
  throw new Error(`Timeout after ${TIMEOUT_MS}ms waiting for DPS.guide test lock slot.`);
}

function releaseLock(lockPath) {
  try {
    if (fs.existsSync(lockPath)) {
      const content = fs.readFileSync(lockPath, 'utf8').trim();
      if (content === String(process.pid)) {
        fs.unlinkSync(lockPath);
      }
    }
  } catch {
    // ignore cleanup error
  }
}

/** Επιλέγει πώς να εκτελεστεί η εντολή: σε Windows το `vitest` υπάρχει μόνο ως vitest.cmd στο node_modules/.bin
 *  και το spawn χωρίς shell επιστρέφει ENOENT, άρα τρέχουμε το JS entry με τον ίδιο τον Node.
 */
function dialekse_diergasia(command, commandArgs) {
  const eisodos = EISODOI_ERGALEION[command];
  if (eisodos !== undefined) {
    const pliriDiadromi = path.join(RIZA_PROJECT, 'node_modules', eisodos);
    if (fs.existsSync(pliriDiadromi)) {
      return { file: process.execPath, args: [pliriDiadromi, ...commandArgs] };
    }
  }
  return { file: command, args: commandArgs };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node test-lock.mjs <command> [...args]');
    process.exit(1);
  }

  const { lockPath } = await acquireLock();

  const cleanup = () => {
    releaseLock(lockPath);
  };

  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(130); });
  process.on('SIGTERM', () => { cleanup(); process.exit(143); });

  const { file, args: commandArgs } = dialekse_diergasia(args[0], args.slice(1));

  const child = spawn(file, commandArgs, {
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code, signal) => {
    cleanup();
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  child.on('error', (err) => {
    cleanup();
    console.error('Failed to spawn command:', err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('Test lock error:', err.message);
  process.exit(1);
});
