import { spawn } from 'node:child_process';
import { cp, copyFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findWindowsJdk21 } from './android-java.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'apps', 'mobile');
const platform = process.argv[2];

function run(command, args, cwd = root, env = process.env) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      env,
    });
    child.once('error', rejectRun);
    child.once('exit', (code) => code === 0 ? resolveRun() : rejectRun(new Error(`${command} exited with ${code}`)));
  });
}

function runPnpm(args) {
  const packageManager = process.env.npm_execpath;
  if (!packageManager) {
    throw new Error('Run this command through pnpm so its executable can be resolved safely.');
  }
  if (/\.(?:cjs|mjs|js)$/i.test(packageManager)) {
    return run(process.execPath, [packageManager, ...args]);
  }
  return run(packageManager, args);
}

if (platform !== 'android' && platform !== 'ios') {
  throw new Error('Usage: pnpm mobile:android | pnpm mobile:ios');
}
if (platform === 'ios' && process.platform !== 'darwin') {
  throw new Error('Unsigned iOS IPA builds require macOS with Xcode. Run `pnpm mobile:ios` on a Mac; no signing key is used.');
}

await runPnpm(['--filter', '@dps/mobile', 'build']);
await runPnpm(['--filter', '@dps/mobile', 'exec', 'cap', 'sync', platform]);

if (platform === 'ios') {
  await run('node', [
    join(root, 'scripts', 'ios', 'configure-private-files.mjs'),
    join(app, 'ios', 'App', 'App', 'Info.plist'),
  ]);
}

const nativeOutput = join(app, 'native-artifacts');
await mkdir(nativeOutput, { recursive: true });

if (platform === 'android') {
  const android = join(app, 'android');
  if (process.platform === 'win32') {
    const javaHome = await findWindowsJdk21(process.env);
    const java = join(javaHome, 'bin', 'java.exe');
    const wrapper = join(android, 'gradle', 'wrapper', 'gradle-wrapper.jar');
    const environment = {
      ...process.env,
      JAVA_HOME: javaHome,
      PATH: `${join(javaHome, 'bin')}${delimiter}${process.env.PATH ?? ''}`,
    };
    await run(java, ['-classpath', wrapper, 'org.gradle.wrapper.GradleWrapperMain', 'assembleDebug'], android, environment);
  } else {
    await run('./gradlew', ['assembleDebug'], android);
  }
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
