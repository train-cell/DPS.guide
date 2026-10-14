import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const MINIMUM_JAVA_MAJOR = 21;

/** Reads the major version from a JDK's release file, including legacy `1.8` versions. */
export function parseJavaMajorVersion(releaseContents) {
  const version = /^JAVA_VERSION="([^"]+)"/m.exec(releaseContents)?.[1];
  if (version === undefined) return null;
  const major = /^(?:1\.)?(\d+)/.exec(version)?.[1];
  if (major === undefined) return null;
  const parsed = Number.parseInt(major, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Finds a compatible Windows JDK without changing the user's machine-wide environment. */
export async function findWindowsJdk21(environment = process.env) {
  const programFiles = environment.ProgramW6432 ?? environment.ProgramFiles;
  const localAppData = environment.LOCALAPPDATA;
  const roots = [
    programFiles && join(programFiles, 'Android', 'openjdk'),
    programFiles && join(programFiles, 'Java'),
    programFiles && join(programFiles, 'Eclipse Adoptium'),
    programFiles && join(programFiles, 'Microsoft'),
    localAppData && join(localAppData, 'Programs', 'Eclipse Adoptium'),
    localAppData && join(localAppData, 'Programs', 'Microsoft'),
  ].filter((root) => root !== undefined);

  const candidates = [];
  const add = (home) => {
    if (home && !candidates.includes(home)) candidates.push(home);
  };
  add(environment.JAVA_HOME);
  if (programFiles) add(join(programFiles, 'Android', 'Android Studio', 'jbr'));
  if (environment.ANDROID_SDK_ROOT) add(join(environment.ANDROID_SDK_ROOT, 'jbr'));
  if (environment.ANDROID_HOME) add(join(environment.ANDROID_HOME, 'jbr'));

  for (const root of roots) {
    add(root);
    try {
      const entries = await readdir(root, { withFileTypes: true });
      entries
        .filter((entry) => entry.isDirectory())
        .sort((left, right) => right.name.localeCompare(left.name, undefined, { numeric: true }))
        .forEach((entry) => add(join(root, entry.name)));
    } catch {
      // This installation root is optional; continue with the remaining locations.
    }
  }

  for (const home of candidates) {
    try {
      const release = await readFile(join(home, 'release'), 'utf8');
      if ((parseJavaMajorVersion(release) ?? 0) < MINIMUM_JAVA_MAJOR) continue;
      await Promise.all([
        access(join(home, 'bin', 'java.exe')),
        access(join(home, 'bin', 'javac.exe')),
      ]);
      return home;
    } catch {
      // Ignore missing JDKs and continue looking for a compatible installation.
    }
  }

  throw new Error(
    'Android builds require JDK 21 or newer. Set JAVA_HOME to a JDK 21 installation or install JDK 21 with Android Studio.'
  );
}
