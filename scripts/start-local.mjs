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

export function pnpmInvocation(args, packageManager, executablePath) {
  if (!packageManager) {
    throw new Error('Run this command through pnpm so its executable can be resolved safely.');
  }
  const packageManagerIsScript = /\.(?:cjs|mjs|js)$/i.test(packageManager);
  return {
    command: packageManagerIsScript ? executablePath : packageManager,
    args: [...(packageManagerIsScript ? [packageManager] : []), ...args],
  };
}

function run(command, args, environment) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: false, env: environment });
    child.once('error', rejectRun);
    child.once('exit', (code) => code === 0
      ? resolveRun()
      : rejectRun(new Error(`${command} exited with ${code ?? 'a signal'}`)));
  });
}

async function startLocal() {
  const production = process.argv[2] === '--production';
  const nodeOptions = withSystemCaOption(process.env.NODE_OPTIONS, process.platform);
  const environment = { ...process.env };
  if (nodeOptions) environment.NODE_OPTIONS = nodeOptions;

  try {
    if (production) {
      const build = pnpmInvocation(['--filter', '@dps/mobile', 'build'], process.env.npm_execpath, process.execPath);
      await run(build.command, build.args, environment);
    }
    const serve = pnpmInvocation(
      production
        ? ['--filter', '@dps/mobile', 'exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', '5173', '--strictPort']
        : ['--filter', '@dps/mobile', 'dev', '--host', '127.0.0.1', '--strictPort'],
      process.env.npm_execpath,
      process.execPath,
    );
    await run(serve.command, serve.args, environment);
  } catch (error) {
    const action = production ? 'build or start the local PWA' : 'start the local development server';
    console.error(`Could not ${action}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  void startLocal();
}
