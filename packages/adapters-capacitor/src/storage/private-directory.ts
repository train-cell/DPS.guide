import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';

export const PRIVATE_DATA_DIRECTORY = Directory.LibraryNoCloud;

interface LegacyTree {
  readonly directories: readonly string[];
  readonly files: readonly string[];
}

interface PluginError extends Error {
  readonly code?: string;
}

const migrations = new Map<string, Promise<void>>();

function isMissing(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const pluginError = error as PluginError;
  return pluginError.code === 'OS-PLUG-FILE-0008' ||
    /does not exist|file not found/i.test(pluginError.message ?? '');
}

async function readLegacyTree(root: string): Promise<LegacyTree | null> {
  const directories = [root];
  const files: string[] = [];

  async function walk(path: string): Promise<boolean> {
    let entries: Awaited<ReturnType<typeof Filesystem.readdir>>['files'];
    try {
      entries = (await Filesystem.readdir({ path, directory: Directory.Data })).files;
    } catch (error) {
      if (path === root && isMissing(error)) return false;
      throw error;
    }
    for (const entry of entries) {
      const child = `${path}/${entry.name}`;
      if (entry.type === 'directory') {
        directories.push(child);
        await walk(child);
      } else {
        files.push(child);
      }
    }
    return true;
  }

  return await walk(root) ? { directories, files } : null;
}

async function exists(path: string, directory: Directory): Promise<boolean> {
  try {
    await Filesystem.stat({ path, directory });
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

async function ensureDirectory(path: string): Promise<void> {
  try {
    const entry = await Filesystem.stat({ path, directory: PRIVATE_DATA_DIRECTORY });
    if (entry.type !== 'directory') throw new Error('A private storage path is occupied by a file.');
  } catch (error) {
    if (!isMissing(error)) throw error;
    await Filesystem.mkdir({ path, directory: PRIVATE_DATA_DIRECTORY, recursive: true });
  }
}

async function migrateLegacyData(root: string): Promise<void> {
  const legacy = await readLegacyTree(root);
  if (legacy === null) return;

  if (!(await exists(root, PRIVATE_DATA_DIRECTORY))) {
    try {
      await Filesystem.rename({
        from: root,
        to: root,
        directory: Directory.Data,
        toDirectory: PRIVATE_DATA_DIRECTORY,
      });
      return;
    } catch {
      // Some iOS filesystem implementations cannot rename across Library roots.
      // Fall back to a native file-by-file copy; keep legacy data until all copies succeed.
    }
  }

  for (const directory of legacy.directories) await ensureDirectory(directory);
  for (const file of legacy.files) {
    if (await exists(file, PRIVATE_DATA_DIRECTORY)) continue;
    await Filesystem.copy({
      from: file,
      to: file,
      directory: Directory.Data,
      toDirectory: PRIVATE_DATA_DIRECTORY,
    });
  }
  await Filesystem.rmdir({ path: root, directory: Directory.Data, recursive: true });
}

/** Moves existing iOS Documents data into the app-private, non-cloud Library once. */
export function ensurePrivateDataDirectory(root: string): Promise<void> {
  if (Capacitor.getPlatform() !== 'ios' || root.trim() === '') return Promise.resolve();
  let migration = migrations.get(root);
  if (migration === undefined) {
    migration = migrateLegacyData(root);
    migrations.set(root, migration);
    void migration.catch(() => migrations.delete(root));
  }
  return migration;
}
