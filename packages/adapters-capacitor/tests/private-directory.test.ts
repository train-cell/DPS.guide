import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  platform: 'ios',
  directories: new Set<string>(),
  files: new Map<string, string>(),
  calls: [] as string[],
}));

function key(directory: string | undefined, path: string): string {
  return `${directory ?? 'DATA'}:${path}`;
}

function notFound(): Error {
  return Object.assign(new Error('File does not exist.'), { code: 'OS-PLUG-FILE-0008' });
}

function entries(directory: string | undefined, path: string) {
  const prefix = `${key(directory, path)}/`;
  const names = new Map<string, 'directory' | 'file'>();
  for (const candidate of h.directories) {
    if (!candidate.startsWith(prefix)) continue;
    const remainder = candidate.slice(prefix.length);
    if (!remainder.includes('/')) names.set(remainder, 'directory');
  }
  for (const candidate of h.files.keys()) {
    if (!candidate.startsWith(prefix)) continue;
    const remainder = candidate.slice(prefix.length);
    if (!remainder.includes('/')) names.set(remainder, 'file');
  }
  return [...names].map(([name, type]) => ({ name, type, size: 12, mtime: 0, ctime: 0, uri: `file://${name}` }));
}

vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => h.platform } }));

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Data: 'DATA', LibraryNoCloud: 'LIBRARY_NO_CLOUD' },
  Filesystem: {
    readdir: vi.fn(async (options: { path: string; directory?: string }) => {
      const folder = key(options.directory, options.path);
      if (!h.directories.has(folder)) throw notFound();
      h.calls.push(`readdir:${folder}`);
      return { files: entries(options.directory, options.path) };
    }),
    stat: vi.fn(async (options: { path: string; directory?: string }) => {
      const path = key(options.directory, options.path);
      if (h.directories.has(path)) return { type: 'directory', size: 0, mtime: 0, ctime: 0, uri: `file://${path}` };
      if (h.files.has(path)) return { type: 'file', size: 12, mtime: 0, ctime: 0, uri: `file://${path}` };
      throw notFound();
    }),
    mkdir: vi.fn(async (options: { path: string; directory?: string; recursive?: boolean }) => {
      const path = key(options.directory, options.path);
      h.directories.add(path);
      h.calls.push(`mkdir:${path}`);
    }),
    rename: vi.fn(async (options: { from: string; to: string; directory?: string; toDirectory?: string }) => {
      const source = key(options.directory, options.from);
      const destination = key(options.toDirectory ?? options.directory, options.to);
      h.calls.push(`rename:${source}>${destination}`);
      if (!h.directories.has(source)) throw notFound();
      if (h.directories.has(destination)) throw new Error('destination already exists');
      const oldPrefix = `${source}/`;
      const newPrefix = `${destination}/`;
      for (const item of [...h.directories]) {
        if (item === source || item.startsWith(oldPrefix)) {
          h.directories.delete(item);
          h.directories.add(`${destination}${item.slice(source.length)}`);
        }
      }
      for (const [item, data] of [...h.files]) {
        if (item.startsWith(oldPrefix)) {
          h.files.delete(item);
          h.files.set(`${newPrefix}${item.slice(oldPrefix.length)}`, data);
        }
      }
    }),
    copy: vi.fn(async (options: { from: string; to: string; directory?: string; toDirectory?: string }) => {
      const source = key(options.directory, options.from);
      const destination = key(options.toDirectory ?? options.directory, options.to);
      const data = h.files.get(source);
      if (data === undefined) throw notFound();
      h.files.set(destination, data);
      h.calls.push(`copy:${source}>${destination}`);
      return { uri: `file://${destination}` };
    }),
    rmdir: vi.fn(async (options: { path: string; directory?: string; recursive?: boolean }) => {
      const source = key(options.directory, options.path);
      const prefix = `${source}/`;
      h.directories.delete(source);
      for (const item of [...h.directories]) if (item.startsWith(prefix)) h.directories.delete(item);
      for (const item of [...h.files.keys()]) if (item.startsWith(prefix)) h.files.delete(item);
      h.calls.push(`rmdir:${source}`);
    }),
  },
}));

function seedLegacyVault(): void {
  h.directories.add('DATA:DPS.guide');
  h.directories.add('DATA:DPS.guide/.dps-vault');
  h.files.set('DATA:DPS.guide/.dps-vault/header.json', 'encrypted-vault-header');
}

describe('ensurePrivateDataDirectory', () => {
  beforeEach(() => {
    h.platform = 'ios';
    h.directories.clear();
    h.files.clear();
    h.calls.length = 0;
    vi.resetModules();
  });

  it('μεταφέρει το υπάρχον iOS vault στον μη συγχρονιζόμενο χώρο χωρίς αλλαγή περιεχομένου', async () => {
    seedLegacyVault();
    const { ensurePrivateDataDirectory } = await import('../src/storage/private-directory.js');

    await ensurePrivateDataDirectory('DPS.guide');

    expect(h.files.get('LIBRARY_NO_CLOUD:DPS.guide/.dps-vault/header.json')).toBe('encrypted-vault-header');
    expect(h.files.has('DATA:DPS.guide/.dps-vault/header.json')).toBe(false);
    expect(h.calls).toContain('rename:DATA:DPS.guide>LIBRARY_NO_CLOUD:DPS.guide');
  });

  it('αν το native rename δεν είναι δυνατό, αντιγράφει αρχεία πριν διαγράψει την παλιά ρίζα', async () => {
    seedLegacyVault();
    const plugin = await import('@capacitor/filesystem');
    vi.mocked(plugin.Filesystem.rename).mockRejectedValueOnce(new Error('cross-directory rename unavailable'));
    const { ensurePrivateDataDirectory } = await import('../src/storage/private-directory.js');

    await ensurePrivateDataDirectory('DPS.guide');

    expect(h.files.get('LIBRARY_NO_CLOUD:DPS.guide/.dps-vault/header.json')).toBe('encrypted-vault-header');
    expect(h.files.has('DATA:DPS.guide/.dps-vault/header.json')).toBe(false);
    expect(h.calls.at(-1)).toBe('rmdir:DATA:DPS.guide');
  });

  it('δεν τρέχει migration στην Android, όπου το LibraryNoCloud είναι ήδη app-private storage', async () => {
    h.platform = 'android';
    seedLegacyVault();
    const { ensurePrivateDataDirectory } = await import('../src/storage/private-directory.js');

    await ensurePrivateDataDirectory('DPS.guide');

    expect(h.calls).toEqual([]);
    expect(h.files.has('DATA:DPS.guide/.dps-vault/header.json')).toBe(true);
  });

  it('δεν μετακινεί ολόκληρο το Documents όταν δεν έχει οριστεί app-specific root', async () => {
    seedLegacyVault();
    const { ensurePrivateDataDirectory } = await import('../src/storage/private-directory.js');

    await ensurePrivateDataDirectory('');

    expect(h.calls).toEqual([]);
    expect(h.files.has('DATA:DPS.guide/.dps-vault/header.json')).toBe(true);
  });
});
