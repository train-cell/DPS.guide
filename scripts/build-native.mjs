import { spawn } from 'node:child_process';
import { cp, copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'apps', 'mobile');
const platform = process.argv[2];

function run(command, args, cwd = root) {
  return new Promise((resolveRun, rejectRun) => {
    const windowsCommand = process.platform === 'win32' && ['pnpm', 'xcodebuild', 'ditto'].includes(command)
      ? `${command}.cmd`
      : command;
    const child = spawn(windowsCommand, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    });
    child.once('error', rejectRun);
    child.once('exit', (code) => code === 0 ? resolveRun() : rejectRun(new Error(`${command} exited with ${code}`)));
  });
}

if (platform !== 'android' && platform !== 'ios') {
  throw new Error('Usage: pnpm mobile:android | pnpm mobile:ios');
}
if (platform === 'ios' && process.platform !== 'darwin') {
  throw new Error('Unsigned iOS IPA builds require macOS with Xcode. Run `pnpm mobile:ios` on a Mac; no signing key is used.');
}

await run('pnpm', ['--filter', '@dps/mobile', 'build']);
await run('pnpm', ['--filter', '@dps/mobile', 'exec', 'cap', 'sync', platform]);

const nativeOutput = join(app, 'native-artifacts');
await mkdir(nativeOutput, { recursive: true });

if (platform === 'android') {
  const wrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  await run(wrapper, ['assembleDebug'], join(app, 'android'));
  await copyFile(
    join(app, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    join(nativeOutput, 'DPS.guide-android-debug.apk'),
  );
  console.log(`Android APK: ${join(nativeOutput, 'DPS.guide-android-debug.apk')}`);
  process.exit(0);
}

const iosProject = join(app, 'ios', 'App');
const derivedData = join(iosProject, 'build', 'DerivedData');
await run('xcodebuild', [
  '-project', join(iosProject, 'App.xcodeproj'),
  '-scheme', 'App',
  '-configuration', 'Release',
  '-sdk', 'iphoneos',
  '-derivedDataPath', derivedData,
  'CODE_SIGNING_ALLOWED=NO',
  'build',
]);

const appBundle = join(derivedData, 'Build', 'Products', 'Release-iphoneos', 'App.app');
const temporary = await mkdtemp(join(tmpdir(), 'dps-guide-ipa-'));
const payload = join(temporary, 'Payload');
const ipa = join(nativeOutput, 'DPS.guide-unsigned.ipa');
await mkdir(payload, { recursive: true });
await cp(appBundle, join(payload, 'App.app'), { recursive: true });
await run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', 'Payload', ipa], temporary);
if (!resolve(temporary).startsWith(resolve(tmpdir()))) throw new Error('Refusing to clean an unexpected temporary path.');
await rm(temporary, { recursive: true, force: true });
console.log(`Unsigned iOS IPA: ${ipa}`);
