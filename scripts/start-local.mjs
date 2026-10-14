import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Use the OS trust store on the supported desktop platforms for bridge HTTPS requests. */
export function withSystemCaOption(nodeOptions, platform) {
  const current = nodeOptions?.trim() ?? '';
  if (platform !== 'win32' && platform !== 'darwin') return current;
  if (/(?:^|\s)--use-system-ca(?:\s|$)/.test(current)) return current;
  return [current, '--use-system-ca'].filter(Boolean).join(' ');
}

function startLocalDev() {
  const packageManager = process.env.npm_execpath;
  if (!packageManager) {
    throw new Error('Run `pnpm mobile:dev` through pnpm so its executable can be resolved safely.');
  }
  const packageManagerIsScript = /\.(?:cjs|mjs|js)$/i.test(packageManager);
  const command = packageManagerIsScript ? process.execPath : packageManager;
  const args = [
    ...(packageManagerIsScript ? [packageManager] : []),
    '--filter', '@dps/mobile', 'dev', '--host', '127.0.0.1',
  ];
  const nodeOptions = withSystemCaOption(process.env.NODE_OPTIONS, process.platform);
  const environment = { ...process.env };
  if (nodeOptions) environment.NODE_OPTIONS = nodeOptions;

  const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: false, env: environment });
  child.once('error', (error) => {
    console.error(`Could not start the local development server: ${error.message}`);
    process.exitCode = 1;
  });
  child.once('exit', (code) => { process.exitCode = code ?? 1; });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  startLocalDev();
}
