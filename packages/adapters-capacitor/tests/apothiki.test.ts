import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Filesystem } from '@capacitor/filesystem';
import { CapacitorApothiki, apo_base64, dimiourgise_apothiki_pyli, se_base64 } from '../src/storage/apothiki.js';
import { ensurePrivateDataDirectory } from '../src/storage/private-directory.js';

/** Κοινό in-memory filesystem για το mock του plugin. */
const h = vi.hoisted(() => {
  const arxeia = new Map<string, string>();
  const fakeloi = new Set<string>();
  return { arxeia, fakeloi, kliseis: [] as string[] };
});

vi.mock('@capacitor/filesystem', () => {
  const sfalma_den_vrethike = (): Error =>
    Object.assign(new Error('does not exist'), { code: 'OS-PLUG-FILE-0008' });
  return {
    Directory: { Documents: 'DOCUMENTS', Data: 'DATA', LibraryNoCloud: 'LIBRARY_NO_CLOUD' },
    Encoding: { UTF8: 'utf8', ASCII: 'ascii' },
    Filesystem: {
      readFile: vi.fn(async (opts: { path: string; encoding?: string }) => {
        h.kliseis.push(`readFile:${opts.path}`);
        const dedomena = h.arxeia.get(opts.path);
        if (dedomena === undefined) {
          throw sfalma_den_vrethike();
        }
        return { data: dedomena };
      }),
      writeFile: vi.fn(async (opts: { path: string; data: string }) => {
        h.kliseis.push(`writeFile:${opts.path}`);
        const goneas = opts.path.includes('/') ? opts.path.slice(0, opts.path.lastIndexOf('/')) : '';
        if ((goneas !== '' && !h.fakeloi.has(goneas)) || h.fakeloi.has(opts.path)) {
          throw new Error('parent directory does not exist or target is a directory');
        }
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
        const tmimata = opts.path.split('/');
        for (let idx = 1; idx <= tmimata.length; idx += 1) {
          h.fakeloi.add(tmimata.slice(0, idx).join('/'));
        }
      }),
      rename: vi.fn(async (opts: { from: string; to: string }) => {
        h.kliseis.push(`rename:${opts.from}>${opts.to}`);
        const dedomena = h.arxeia.get(opts.from);
        if (dedomena === undefined) {
          throw sfalma_den_vrethike();
        }
        const goneas = opts.to.includes('/') ? opts.to.slice(0, opts.to.lastIndexOf('/')) : '';
        if ((goneas !== '' && !h.fakeloi.has(goneas)) || h.fakeloi.has(opts.to)) {
          throw new Error('parent directory does not exist or target is a directory');
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

vi.mock('@capacitor/core', () => ({ Capacitor: { getPlatform: () => 'android' } }));

vi.mock('../src/storage/private-directory.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    ensurePrivateDataDirectory: vi.fn(original.ensurePrivateDataDirectory),
  };
});

function diabase(elafry: string, dedomena: string): void {
  h.arxeia.set(elafry, dedomena);
}

beforeEach(() => {
  h.arxeia.clear();
  h.fakeloi.clear();
  h.kliseis.length = 0;
  vi.mocked(Filesystem.readFile).mockClear();
  vi.mocked(Filesystem.writeFile).mockClear();
  vi.mocked(Filesystem.deleteFile).mockClear();
  vi.mocked(Filesystem.mkdir).mockClear();
  vi.mocked(Filesystem.stat).mockClear();
  vi.mocked(Filesystem.rename).mockClear();
  vi.mocked(Filesystem.readdir).mockClear();
});

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
  it('γράφει και διαβάζει κείμενο με κωδικοποίηση UTF-8', async () => {
    const apothiki = new CapacitorApothiki('');
    const egkrisi = await apothiki.grapse_keimeno('mathimata.json', 'κόσμος');
    expect(egkrisi.ok).toBe(true);
    expect(h.arxeia.get('mathimata.json')).toBe('κόσμος');
    expect(vi.mocked(Filesystem.writeFile)).toHaveBeenCalledWith(expect.objectContaining({
      data: 'κόσμος',
      encoding: 'utf8',
    }));
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
    expect(h.arxeia.get('PLI101/arxeio.pdf')).toBe(se_base64(dedomena));
    const anagnosi = await apothiki.diavase_dyadiko('PLI101/arxeio.pdf');
    expect(anagnosi.ok).toBe(true);
    if (anagnosi.ok) {
      expect(anagnosi.timi).toEqual(dedomena);
    }
  });

  it('δημιουργεί μόνο τον γονικό φάκελο σε nested path', async () => {
    const apothiki = new CapacitorApothiki('');
    expect((await apothiki.grapse_keimeno('PLI101/arxeio.json', '{}')).ok).toBe(true);
    expect(h.kliseis).toContain('mkdir:PLI101');
    expect(h.kliseis).not.toContain('mkdir:PLI101/arxeio.json');
  });

  it('δεν δημιουργεί κατά λάθος directory για αρχείο στη ρίζα', async () => {
    const apothiki = new CapacitorApothiki('');
    expect((await apothiki.grapse_keimeno('mathimata.json', '{}')).ok).toBe(true);
    expect(h.kliseis.filter((k) => k.startsWith('mkdir:'))).toEqual([]);
  });

  it('γράφει ατομικά: temp → backup υπάρχοντος → rename → διαγραφή backup', async () => {
    const apothiki = new CapacitorApothiki('');
    diabase('mathimata.json', 'παλιό');
    await apothiki.grapse_keimeno('mathimata.json', 'νέο');

    const reumat = h.kliseis.filter((k) => k.startsWith('writeFile:mathimata.json.tmp-'));
    const antigrafa = h.kliseis.filter((k) => /^rename:mathimata\.json>mathimata\.json\.bak-.*$/.test(k));
    const metonomasies = h.kliseis.filter((k) => /^rename:mathimata\.json\.tmp-.*>mathimata\.json$/.test(k));
    const diagrafesBackup = h.kliseis.filter((k) => /^deleteFile:mathimata\.json\.bak-.*$/.test(k));
    const diagrafesProorismou = h.kliseis.filter((k) => k === 'deleteFile:mathimata.json');

    expect(reumat).toHaveLength(1);
    expect(antigrafa).toHaveLength(1);
    expect(metonomasies).toHaveLength(1);
    expect(diagrafesBackup).toHaveLength(1);
    expect(diagrafesProorismou).toHaveLength(0); // Δεν σβήνεται ποτέ πρόωρα ο προορισμός
    const prosorina = [...h.arxeia.keys()].filter(
      (k) => k.startsWith('mathimata.json.tmp-') || k.startsWith('mathimata.json.bak-')
    );
    expect(prosorina).toHaveLength(0);
    const teliko = await apothiki.diavase_keimeno('mathimata.json');
    expect(teliko.ok && teliko.timi).toBe('νέο');
  });

  it('κάνει rollback από το αντίγραφο ασφαλείας αν αποτύχει το rename του temp', async () => {
    const apothiki = new CapacitorApothiki('');
    diabase('mathimata.json', 'παλιό');

    let metritisRename = 0;
    const proigoumeniYlopoiisi = vi.mocked(Filesystem.rename).getMockImplementation();
    vi.mocked(Filesystem.rename).mockImplementation(async (opts) => {
      metritisRename += 1;
      if (metritisRename === 2) {
        throw Object.assign(new Error('rename failed'), { code: 'OS-PLUG-FILE-0013' });
      }
      h.kliseis.push(`rename:${opts.from}>${opts.to}`);
      const dedomena = h.arxeia.get(opts.from);
      if (dedomena === undefined) {
        throw Object.assign(new Error('does not exist'), { code: 'OS-PLUG-FILE-0008' });
      }
      h.arxeia.set(opts.to, dedomena);
      h.arxeia.delete(opts.from);
    });

    try {
      const res = await apothiki.grapse_keimeno('mathimata.json', 'νέο');
      expect(res.ok).toBe(false);

      // Το παλιό περιεχόμενο έχει αποκατασταθεί
      const periexomeno = await apothiki.diavase_keimeno('mathimata.json');
      expect(periexomeno.ok && periexomeno.timi).toBe('παλιό');
    } finally {
      if (proigoumeniYlopoiisi) {
        vi.mocked(Filesystem.rename).mockImplementation(proigoumeniYlopoiisi);
      }
    }
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

describe('σφάλματα', () => {
  it('readFile: μη-αντικείμενο σφάλμα (L44/br L43 true)', async () => {
    vi.mocked(Filesystem.readFile).mockImplementationOnce(async () => {
      throw 'δεν είναι σφάλμα';
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_keimeno('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('readFile: κωδικός μη string (br L47 false)', async () => {
    vi.mocked(Filesystem.readFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('unknown'), { code: 42 });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_keimeno('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('readFile: μήνυμα "does not exist" με άλλο κωδικό (br L54 true)', async () => {
    vi.mocked(Filesystem.readFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('does not exist'), { code: 'OTHER' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_keimeno('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('tixaio_id: fallback χωρίς crypto (L89)', async () => {
    vi.stubGlobal('crypto', undefined);
    try {
      const apothiki = new CapacitorApothiki('');
      await apothiki.grapse_keimeno('crypto-fallback.json', 'x');
      expect(h.arxeia.has('crypto-fallback.json')).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('diavase_keimeno: non-string data (L145)', async () => {
    vi.mocked(Filesystem.readFile).mockImplementationOnce(async () => ({ data: 42 } as never));
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_keimeno('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('diavase_keimeno: άκυρη διαδρομή → MI_EGKYRO_SXIMA (L153/L154)', async () => {
    vi.mocked(Filesystem.readFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('invalid path'), { code: 'OS-PLUG-FILE-0006' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_keimeno('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('diavase_keimeno: άλλος κωδικός → AGNOSTO (L156)', async () => {
    vi.mocked(Filesystem.readFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('unknown'), { code: 'OS-PLUG-FILE-0001' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_keimeno('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('diavase_dyadiko: άκυρη διαδρομή (L162/L163)', async () => {
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_dyadiko('../ekso.json');
    expect(apotelesma.ok).toBe(false);
    expect(vi.mocked(Filesystem.readFile)).not.toHaveBeenCalled();
  });

  it('diavase_dyadiko: non-string data (L174)', async () => {
    vi.mocked(Filesystem.readFile).mockImplementationOnce(async () => ({ data: 42 } as never));
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_dyadiko('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('diavase_dyadiko: DEN_VRETHIKE (L179/L180)', async () => {
    vi.mocked(Filesystem.readFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('does not exist'), { code: 'OS-PLUG-FILE-0008' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_dyadiko('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('diavase_dyadiko: άλλος κωδικός → AGNOSTO (L182)', async () => {
    vi.mocked(Filesystem.readFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('unknown'), { code: 'OS-PLUG-FILE-0001' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diavase_dyadiko('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('grapse: άκυρη διαδρομή (L201/L202)', async () => {
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.grapse_keimeno('../ekso.json', 'x');
    expect(apotelesma.ok).toBe(false);
    expect(vi.mocked(Filesystem.writeFile)).not.toHaveBeenCalled();
  });

  it('grapse: AGNOSTO σφάλμα εγγραφής (L233)', async () => {
    vi.mocked(Filesystem.writeFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('write failed'), { code: 'OS-PLUG-FILE-0001' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.grapse_keimeno('a.json', 'x');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
      expect(apotelesma.sfalma.minima).toContain('a.json');
    }
  });

  it('yparxei: άκυρη διαδρομή → false (L242)', async () => {
    const apothiki = new CapacitorApothiki('');
    expect(await apothiki.yparxei('../ekso.json')).toBe(false);
  });

  it('yparxei: σφάλμα secure directory → false (L248)', async () => {
    vi.mocked(ensurePrivateDataDirectory).mockImplementationOnce(async () => {
      throw new Error('secure storage failed');
    });
    const apothiki = new CapacitorApothiki('');
    expect(await apothiki.yparxei('a.json')).toBe(false);
  });

  it('lista: άκυρη διαδρομή (L254/L255)', async () => {
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.lista('../ekso.json');
    expect(apotelesma.ok).toBe(false);
  });

  it('lista: σφάλμα secure directory → AGNOSTO (L260)', async () => {
    vi.mocked(ensurePrivateDataDirectory).mockImplementationOnce(async () => {
      throw new Error('secure storage failed');
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.lista('PLI101');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('lista: readdir αποτυγχάνει → AGNOSTO (L263/L280/L284)', async () => {
    vi.mocked(Filesystem.readdir).mockImplementationOnce(async () => {
      throw Object.assign(new Error('read failed'), { code: 'OS-PLUG-FILE-0001' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.lista('PLI101');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
      expect(apotelesma.sfalma.minima).toContain('PLI101');
    }
  });

  it('lista: readdir δεν βρήκε → κενό (L281/L282)', async () => {
    vi.mocked(Filesystem.readdir).mockImplementationOnce(async () => {
      throw Object.assign(new Error('does not exist'), { code: 'OS-PLUG-FILE-0008' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.lista('PLI101');
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi).toEqual([]);
    }
  });

  it('lista: μη τυπικός τύπος αρχείου (L300 false)', async () => {
    vi.mocked(Filesystem.readdir).mockImplementationOnce(async () => {
      return {
        files: [{ name: 'symlink', type: 'symlink' as never, size: 0, mtime: 0, ctime: 0, uri: 'file://PLI101/symlink' }],
      } as never;
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.lista('PLI101');
    expect(apotelesma.ok).toBe(true);
    if (apotelesma.ok) {
      expect(apotelesma.timi).toEqual([]);
    }
  });

  it('lista: αναδρομική αποτυχία → AGNOSTO (L295)', async () => {
    vi.mocked(Filesystem.readdir).mockImplementationOnce(async () => {
      const prothema = 'PLI101/';
      return {
        files: [{ name: 'upokatalogos', type: 'directory', size: 0, mtime: 0, ctime: 0, uri: 'file://PLI101/upokatalogos' }],
      } as never;
    }).mockImplementationOnce(async () => {
      throw Object.assign(new Error('read failed'), { code: 'OS-PLUG-FILE-0001' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.lista('PLI101');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('diagrafi: άκυρη διαδρομή (L309/L310)', async () => {
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diagrafi('../ekso.json');
    expect(apotelesma.ok).toBe(false);
  });

  it('diagrafi: AGNOSTO σφάλμα (L322)', async () => {
    vi.mocked(Filesystem.deleteFile).mockImplementationOnce(async () => {
      throw Object.assign(new Error('delete failed'), { code: 'OS-PLUG-FILE-0001' });
    });
    const apothiki = new CapacitorApothiki('');
    const apotelesma = await apothiki.diagrafi('a.json');
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AGNOSTO');
      expect(apotelesma.sfalma.minima).toContain('a.json');
    }
  });

  it('διαγραφή γραμμένου αρχείου → ok (L316)', async () => {
    const apothiki = new CapacitorApothiki('');
    await apothiki.grapse_keimeno('a.json', '1');
    const apotelesma = await apothiki.diagrafi('a.json');
    expect(apotelesma.ok).toBe(true);
    expect(await apothiki.yparxei('a.json')).toBe(false);
  });

  it('dimiourgise_apothiki_pyli (L329)', () => {
    const pyli = dimiourgise_apothiki_pyli('DPS.guide');
    expect(pyli).toBeInstanceOf(CapacitorApothiki);
    expect((pyli as { riza: string }).riza).toBe('DPS.guide');
  });
});
