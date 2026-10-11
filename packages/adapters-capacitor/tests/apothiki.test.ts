import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Filesystem } from '@capacitor/filesystem';
import { CapacitorApothiki, apo_base64, se_base64 } from '../src/storage/apothiki.js';

/** Κοινό in-memory filesystem για το mock του plugin. */
const h = vi.hoisted(() => {
  const arxeia = new Map<string, string>();
  return { arxeia, kliseis: [] as string[] };
});

vi.mock('@capacitor/filesystem', () => {
  const sfalma_den_vrethike = (): Error =>
    Object.assign(new Error('does not exist'), { code: 'OS-PLUG-FILE-0008' });
  return {
    Directory: { Documents: 'DOCUMENTS', Data: 'DATA' },
    Encoding: { UTF8: 'utf8', ASCII: 'ascii' },
    Filesystem: {
      readFile: vi.fn(async (opts: { path: string; encoding?: string }) => {
        h.kliseis.push(`readFile:${opts.path}`);
        const dedomena = h.arxeia.get(opts.path);
        if (dedomena === undefined) {
          throw sfalma_den_vrethike();
        }
        if (opts.encoding === 'utf8') {
          return { data: new TextDecoder().decode(apo(dedomena)) };
        }
        return { data: dedomena };
      }),
      writeFile: vi.fn(async (opts: { path: string; data: string }) => {
        h.kliseis.push(`writeFile:${opts.path}`);
        h.arxeia.set(opts.path, opts.data);
        return { uri: `file://${opts.path}` };
      }),
      deleteFile: vi.fn(async (opts: { path: string }) => {
        h.kliseis.push(`deleteFile:${opts.path}`);
        if (!h.arxeia.has(opts.path)) {
          throw sfalma_den_vrethike();
        }
        h.arxeia.delete(opts.path);
      }),
      mkdir: vi.fn(async (opts: { path: string }) => {
        h.kliseis.push(`mkdir:${opts.path}`);
      }),
      rename: vi.fn(async (opts: { from: string; to: string }) => {
        h.kliseis.push(`rename:${opts.from}>${opts.to}`);
        const dedomena = h.arxeia.get(opts.from);
        if (dedomena === undefined) {
          throw sfalma_den_vrethike();
        }
        h.arxeia.set(opts.to, dedomena);
        h.arxeia.delete(opts.from);
      }),
      stat: vi.fn(async (opts: { path: string }) => {
        h.kliseis.push(`stat:${opts.path}`);
        if (!h.arxeia.has(opts.path)) {
          throw sfalma_den_vrethike();
        }
        return { type: 'file', size: 10, mtime: 0, ctime: 0, uri: `file://${opts.path}` };
      }),
      readdir: vi.fn(async (opts: { path: string }) => {
        h.kliseis.push(`readdir:${opts.path}`);
        const prothema = `${opts.path}/`;
        const eggrafes: {
          name: string;
          type: 'file' | 'directory';
          size: number;
          mtime: number;
          ctime: number;
          uri: string;
        }[] = [];
        const ypokatalogoi = new Set<string>();
        for (const kleidi of h.arxeia.keys()) {
          if (!kleidi.startsWith(prothema)) {
            continue;
          }
          const ypoloipo = kleidi.slice(prothema.length);
          if (ypoloipo.includes('/')) {
            ypokatalogoi.add(ypoloipo.split('/')[0] ?? '');
            continue;
          }
          eggrafes.push({
            name: ypoloipo,
            type: 'file',
            size: 10,
            mtime: 0,
            ctime: 0,
            uri: `file://${kleidi}`,
          });
        }
        for (const onoma of ypokatalogoi) {
          eggrafes.push({
            name: onoma,
            type: 'directory',
            size: 0,
            mtime: 0,
            ctime: 0,
            uri: `file://${prothema}${onoma}`,
          });
        }
        return { files: eggrafes };
      }),
    },
  };
});

function apo(vasi: string): Uint8Array {
  return apo_base64(vasi.replace(/\s+/g, ''));
}

function diabase(elafry: string, dedomena: string): void {
  h.arxeia.set(elafry, dedomena);
}

describe('se_base64 / apo_base64', () => {
  it('κάνουν round-trip δυαδικών δεδομένων', () => {
    const dedomena = Uint8Array.from([0, 1, 2, 250, 255, 128]);
    expect(apo_base64(se_base64(dedomena))).toEqual(dedomena);
  });

  it('αποκωδικοποιεί base64 τυλιγμένο στους 76 χαρακτήρες (Android)', () => {
    const dedomena = new Uint8Array(200).fill(65);
    const tiliagmeno = se_base64(dedomena).replace(/(.{76})/g, '$1\n');
    expect(apo_base64(tiliagmeno)).toEqual(dedomena);
  });

  it('επιστρέφει κενό για κενή είσοδο', () => {
    expect(apo_base64('')).toEqual(new Uint8Array(0));
  });
});

describe('CapacitorApothiki', () => {
  beforeEach(() => {
    h.arxeia.clear();
    h.kliseis.length = 0;
    vi.mocked(Filesystem.readFile).mockClear();
  });

  it('γράφει και διαβάζει κείμενο με κωδικοποίηση UTF-8', async () => {
    const apothiki = new CapacitorApothiki('');
    const egkrisi = await apothiki.grapse_keimeno('mathimata.json', 'κόσμος');
    expect(egkrisi.ok).toBe(true);
    const anagnosi = await apothiki.diavase_keimeno('mathimata.json');
    expect(anagnosi.ok).toBe(true);
    if (anagnosi.ok) {
      expect(anagnosi.timi).toBe('κόσμος');
    }
  });

  it('γράφει και διαβάζει δυαδικά δεδομένα', async () => {
    const apothiki = new CapacitorApothiki('');
    const dedomena = Uint8Array.from([1, 2, 3, 4, 5]);
    expect((await apothiki.grapse_dyadiko('PLI101/arxeio.pdf', dedomena)).ok).toBe(true);
    const anagnosi = await apothiki.diavase_dyadiko('PLI101/arxeio.pdf');
    expect(anagnosi.ok).toBe(true);
    if (anagnosi.ok) {
      expect(anagnosi.timi).toEqual(dedomena);
    }
  });

  it('γράφει ατομικά: temp → delete προορισμού → rename', async () => {
    const apothiki = new CapacitorApothiki('');
    diabase('mathimata.json', se_base64(new TextEncoder().encode('παλιό')));
    await apothiki.grapse_keimeno('mathimata.json', 'νέο');

    const reumat = h.kliseis.filter((k) => k.startsWith('writeFile:mathimata.json.tmp-'));
    const diagrafes = h.kliseis.filter((k) => k === 'deleteFile:mathimata.json');
    const metonomasies = h.kliseis.filter((k) => /^rename:mathimata\.json\.tmp-.*>mathimata\.json$/.test(k));

    expect(reumat).toHaveLength(1);
    expect(diagrafes).toHaveLength(1);
    expect(metonomasies).toHaveLength(1);
    const prosorina = [...h.arxeia.keys()].filter((k) => k.startsWith('mathimata.json.tmp-'));
    expect(prosorina).toHaveLength(0);
    const teliko = await apothiki.diavase_keimeno('mathimata.json');
    expect(teliko.ok && teliko.timi).toBe('νέο');
  });

  it('διαγραφέας λείπειντος αρχείου → DEN_VRETHIKE', async () => {
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diagrafi('den-yparxei.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('ανάγνωση λείπειντος αρχείου → DEN_VRETHIKE', async () => {
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_keimeno('den-yparxei.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('ακυρη διαδρομή (..) → σφάλμα, χωρίς κλήση plugin', async () => {
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_keimeno('../ekso.json');
    expect(apotelesma.ok).toBe(false);
    expect(vi.mocked(Filesystem.readFile)).not.toHaveBeenCalled();
  });

  it('yparxei: true για γραμμένο αρχείο, false για απόν', async () => {
    const apothiki = new CapacitorApothiki('');
    await apothiki.grapse_keimeno('a.json', '1');
    expect(await apothiki.yparxei('a.json')).toBe(true);
    expect(await apothiki.yparxei('b.json')).toBe(false);
  });

  it('lista: σχετικές διαδρομές, αναδρομικά, ταξινομημένες', async () => {
    const apothiki = new CapacitorApothiki('');
    await apothiki.grapse_keimeno('PLI101/b.json', '1');
    await apothiki.grapse_keimeno('PLI101/upokatalogos/c.json', '2');
    const apotelesma = await apothiki.lista('PLI101');
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi).toEqual(['PLI101/b.json', 'PLI101/upokatalogos/c.json']);
    }
  });

  it('riza προθέματος: η διαδρομή του plugin περιέχει τη ρίζα', async () => {
    const apothiki = new CapacitorApothiki('DPS.guide');
    await apothiki.grapse_keimeno('a.json', '1');
    expect(h.arxeia.has('DPS.guide/a.json')).toBe(true);
  });
});
