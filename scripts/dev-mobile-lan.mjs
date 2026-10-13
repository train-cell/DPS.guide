import { spawn, spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const localDirectory = join(root, '.local');
const certificate = join(localDirectory, 'mobile-lan.pem');
const privateKey = join(localDirectory, 'mobile-lan-key.pem');
const command = process.platform === 'win32' ? 'mkcert.exe' : 'mkcert';

function runMkcert(args, capture = false) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message ?? result.stderr?.trim() ?? `mkcert exited with ${result.status}`);
  }
  return capture ? result.stdout.trim() : '';
}

const addresses = [...new Set(Object.values(networkInterfaces())
  .flatMap((items) => items ?? [])
  .filter((item) => (item.family === 'IPv4' || item.family === 4) && !item.internal && !item.address.startsWith('169.254.'))
  .map((item) => item.address))];

if (addresses.length === 0) throw new Error('Δεν βρέθηκε ενεργή διεύθυνση IPv4 για LAN.');

try {
  runMkcert(['-version']);
} catch {
  throw new Error('Χρειάζεται εγκατεστημένο το mkcert. Εγκατέστησέ το για Windows/macOS και ξανατρέξε `pnpm mobile:dev:lan`.');
}

await mkdir(localDirectory, { recursive: true });
runMkcert(['-install']);
runMkcert(['-cert-file', certificate, '-key-file', privateKey, 'localhost', '127.0.0.1', ...addresses]);
const caDirectory = runMkcert(['-CAROOT'], true);
const rootCertificate = join(caDirectory, 'rootCA.pem');

console.log('\nDPS.guide LAN HTTPS ready:');
for (const address of addresses) console.log(`  https://${address}:5173`);
console.log('\nΣε iPhone/iPad, μετέφερε το παρακάτω root certificate στη συσκευή, εγκατέστησε το profile και ενεργοποίησε πλήρη εμπιστοσύνη Certificate Trust Settings:');
console.log(`  ${rootCertificate}`);
console.log('Το ιδιωτικό κλειδί server και η τοπική CA δεν μπαίνουν στο repository. Ο bridge pairing code θα εμφανιστεί όταν ξεκινήσει το Vite.\n');

const packageManager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const child = spawn(packageManager, ['--filter', '@dps/mobile', 'dev', '--host', '0.0.0.0', '--port', '5173', '--strictPort'], {
  cwd: root,
  env: { ...process.env, DPS_TLS_CERT: certificate, DPS_TLS_KEY: privateKey },
  stdio: 'inherit',
  shell: process.platform === 'win32',
  windowsHide: true,
});
child.once('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once('exit', (code) => { process.exitCode = code ?? 1; });
