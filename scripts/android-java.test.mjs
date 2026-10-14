import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { findWindowsJdk21, parseJavaMajorVersion } from './android-java.mjs';

const temporaryDirectories = [];

async function temporaryDirectory() {
  const directory = await mkdtemp(join(tmpdir(), 'dps-guide-jdk-'));
  temporaryDirectories.push(directory);
  return directory;
}

async function createJdk(home, version) {
  await mkdir(join(home, 'bin'), { recursive: true });
  await writeFile(join(home, 'release'), `JAVA_VERSION="${version}"\n`);
  await writeFile(join(home, 'bin', 'java.exe'), '');
  await writeFile(join(home, 'bin', 'javac.exe'), '');
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('Windows Android JDK discovery', () => {
  it('parses both modern and legacy Java release versions', () => {
    expect(parseJavaMajorVersion('JAVA_VERSION="21.0.8"\n')).toBe(21);
    expect(parseJavaMajorVersion('JAVA_VERSION="1.8.0_481"\n')).toBe(8);
    expect(parseJavaMajorVersion('IMPLEMENTOR="Microsoft"\n')).toBeNull();
  });

  it('skips an old JAVA_HOME and finds a compatible JDK in the Android OpenJDK folder', async () => {
    const root = await temporaryDirectory();
    const oldJavaHome = join(root, 'old-java');
    const androidJdk = join(root, 'Android', 'openjdk', 'jdk-21.0.8');
    await createJdk(oldJavaHome, '1.8.0_481');
    await createJdk(androidJdk, '21.0.8');

    await expect(findWindowsJdk21({ JAVA_HOME: oldJavaHome, ProgramFiles: root })).resolves.toBe(androidJdk);
  });

  it('prefers a compatible JAVA_HOME over discovered installations', async () => {
    const root = await temporaryDirectory();
    const configured = join(root, 'configured-jdk');
    const discovered = join(root, 'Android', 'openjdk', 'jdk-21.0.8');
    await createJdk(configured, '21.0.7');
    await createJdk(discovered, '21.0.8');

    await expect(findWindowsJdk21({ JAVA_HOME: configured, ProgramFiles: root })).resolves.toBe(configured);
  });

  it('gives an actionable error when no Java 21 installation is available', async () => {
    const root = await temporaryDirectory();
    const oldJavaHome = join(root, 'old-java');
    await createJdk(oldJavaHome, '17.0.12');

    await expect(findWindowsJdk21({ JAVA_HOME: oldJavaHome, ProgramFiles: root })).rejects.toThrow(
      'Android builds require JDK 21 or newer'
    );
  });

  it('does not mistake a Java runtime without javac for a JDK', async () => {
    const root = await temporaryDirectory();
    const javaRuntime = join(root, 'Android', 'openjdk', 'jdk-21-runtime-only');
    await mkdir(join(javaRuntime, 'bin'), { recursive: true });
    await writeFile(join(javaRuntime, 'release'), 'JAVA_VERSION="21.0.8"\n');
    await writeFile(join(javaRuntime, 'bin', 'java.exe'), '');

    await expect(findWindowsJdk21({ ProgramFiles: root })).rejects.toThrow(
      'Android builds require JDK 21 or newer'
    );
  });
});
