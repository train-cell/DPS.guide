import { beforeAll, beforeEach, describe, it, expect, afterAll, vi } from 'vitest';
import { rmSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, realRm, realReadFile, realReaddir, rm, symlink, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NodeFsApothiki } from '../src/storage/fs-apothiki.js';

vi.mock('node:fs/promises', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    rm: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    unlink: vi.fn(),
    realRm: original.rm,
    realReadFile: original.readFile,
    realReaddir: original.readdir,
  };
});

beforeEach(() => {
  vi.mocked(rm).mockImplementation((...args: Parameters<typeof realRm>) => realRm(...args));
  vi.mocked(readFile).mockImplementation((...args: Parameters<typeof realReadFile>) => realReadFile(...args));
  vi.mocked(readdir).mockImplementation((...args: Parameters<typeof realReaddir>) => realReaddir(...args));
  vi.mocked(unlink).mockImplementation((...args: Parameters<typeof realRm>) => realRm(...args));
});

let riza: string;
let apothiki: NodeFsApothiki;

beforeAll(async () => {
  riza = await mkdtemp(path.join(tmpdir(), 'dps-storage-'));
  apothiki = new NodeFsApothiki(riza);
});

afterAll(async () => {
  rmSync(riza, { recursive: true, force: true });
});

describe('NodeFsApothiki', () => {
  it('round-trips greek text with accents', async () => {
    const periexomeno = 'Εισαγωγή στην Επιστήμη Υπολογιστών — σημειώσεις με τόνους';
    const grapsi = await apothiki.grapse_keimeno('PLI101/αρχεία/notes.txt', periexomeno);
    expect(grapsi.ok).toBe(true);

    const diavase = await apothiki.diavase_keimeno('PLI101/αρχεία/notes.txt');
    expect(diavase.ok).toBe(true);
    if (diavase.ok) {
      expect(diavase.timi).toBe(periexomeno);
    }
  });

  it('round-trips binary data', async () => {
    const dedomena = new Uint8Array([0, 1, 2, 250, 255]);
    const grapsi = await apothiki.grapse_dyadiko('PLI101/arxeia/data.bin', dedomena);
    expect(grapsi.ok).toBe(true);

    const diavase = await apothiki.diavase_dyadiko('PLI101/arxeia/data.bin');
    expect(diavase.ok).toBe(true);
    if (diavase.ok) {
      expect(Array.from(diavase.timi)).toEqual(Array.from(dedomena));
    }
  });

  it('yparxei reflects file presence', async () => {
    expect(await apothiki.yparxei('den-yparxei.txt')).toBe(false);
    const grapsi = await apothiki.grapse_keimeno('yparxei.txt', 'x');
    expect(grapsi.ok).toBe(true);
    expect(await apothiki.yparxei('yparxei.txt')).toBe(true);
  });

  it('reads missing file as DEN_VRETHIKE', async () => {
    const diavase = await apothiki.diavase_keimeno('agnowto.txt');
    expect(diavase.ok).toBe(false);
    if (!diavase.ok) {
      expect(diavase.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('deletes and reports deletion of missing file', async () => {
    await apothiki.grapse_keimeno('pros-diagrafi.txt', 'x');
    const diagrafi = await apothiki.diagrafi('pros-diagrafi.txt');
    expect(diagrafi.ok).toBe(true);

    const keni = await apothiki.diagrafi('pros-diagrafi.txt');
    expect(keni.ok).toBe(false);
    if (!keni.ok) {
      expect(keni.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('lista lists files under the folder', async () => {
    await apothiki.grapse_keimeno('lista-fakelos/a.txt', '1');
    await apothiki.grapse_keimeno('lista-fakelos/b.txt', '2');

    const res = await apothiki.lista('lista-fakelos');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.timi.sort()).toEqual(
        ['lista-fakelos/a.txt', 'lista-fakelos/b.txt'].sort()
      );
    }
  });

  it('rejects path traversal on write and leaves nothing behind', async () => {
    const res = await apothiki.grapse_keimeno('../diadromi.txt', 'x');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }

    const entries = await readdir(riza);
    expect(entries).not.toContain('diadromi.txt');
    expect(entries.filter((onoma) => onoma.includes('.tmp'))).toEqual([]);
  });

  it('creates nested directories on demand', async () => {
    const res = await apothiki.grapse_keimeno('vathia/diadromi/arxeio.txt', 'x');
    expect(res.ok).toBe(true);
    expect(await apothiki.yparxei('vathia/diadromi/arxeio.txt')).toBe(true);
  });

  it('overwrites atomically: only the final file remains', async () => {
    await apothiki.grapse_keimeno('atomiko.txt', 'prwto');
    await apothiki.grapse_keimeno('atomiko.txt', 'deftero');

    const entries = await readdir(riza);
    expect(entries.filter((onoma) => onoma.includes('.tmp'))).toEqual([]);

    const diavase = await apothiki.diavase_keimeno('atomiko.txt');
    expect(diavase.ok).toBe(true);
    if (diavase.ok) {
      expect(diavase.timi).toBe('deftero');
    }
  });

  it('interrupted write leaves no partial file (rename onto directory fails)', async () => {
    const proorismos = 'proorismos-fakelos';
    await mkdir(path.join(riza, proorismos));

    const res = await apothiki.grapse_keimeno(proorismos, 'dedomena');
    expect(res.ok).toBe(false);

    const entries = await readdir(riza);
    expect(entries.filter((onoma) => onoma.includes('.tmp'))).toEqual([]);

    const akoma = await readdir(path.join(riza, proorismos));
    expect(akoma).toEqual([]);
  });

  it('sanitizes error aitia: stable code only, never raw fs error or absolute path', async () => {
    const proorismos = 'leak-fakelos';
    await mkdir(path.join(riza, proorismos));

    const res = await apothiki.grapse_keimeno(proorismos, 'dedomena');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AGNOSTO');
      expect(typeof res.sfalma.aitia).toBe('string');
      expect(String(res.sfalma.aitia)).toMatch(/^[A-Z_]+$/);
      expect(String(res.sfalma.aitia)).not.toMatch(/[A-Za-z]:[\\/]/);
      expect(res.sfalma.minima).not.toContain(riza);
      expect(res.sfalma.minima).not.toMatch(/[A-Za-z]:[\\/]/);
    }
  });

  it('missing-file message uses the normalized path, not the caller absolute path', async () => {
    const apsoluth = path.join(riza, 'leak-tpt.txt');
    const res = await apothiki.diavase_keimeno(apsoluth);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('DEN_VRETHIKE');
      expect(res.sfalma.minima).not.toContain(riza);
      expect(res.sfalma.minima).not.toContain(':\\');
      expect(res.sfalma.minima).not.toMatch(/[A-Za-z]:[\\/]/);
    }
  });
});

describe('NodeFsApothiki — σφάλματα και αναδρομική λίστα', () => {
  it('δεν βρέθηκε (ENOENT) και διαγραφεί επίσης', async () => {
    const diavase = await apothiki.diavase_keimeno('den-yparxei.txt');
    expect(diavase.ok).toBe(false);
    if (!diavase.ok) {
      expect(diavase.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }

    const diagrafi = await apothiki.diagrafi('den-yparxei.txt');
    expect(diagrafi.ok).toBe(false);
    if (!diagrafi.ok) {
      expect(diagrafi.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('δεν διαβάζει φάκελο (EISDIR) σε κείμενο και δυαδικό', async () => {
    const diavase = await apothiki.diavase_keimeno('PLI101');
    expect(diavase.ok).toBe(false);
    if (!diavase.ok) {
      expect(diavase.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(diavase.sfalma.minima).toContain('φάκελος');
    }

    const dyadiko = await apothiki.diavase_dyadiko('PLI101');
    expect(dyadiko.ok).toBe(false);
    if (!dyadiko.ok) {
      expect(dyadiko.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(dyadiko.sfalma.minima).toContain('φάκελος');
    }
  });

  it('δεν γράφει σε μη ύπαρξη φάκελο', async () => {
    // ο φάκελος δημιουργείται με recursive: true
    const grapsi = await apothiki.grapse_keimeno('neo-fakelos/arxeio.txt', 'x');
    expect(grapsi.ok).toBe(true);
  });

  it('επιστρέφει την αναδρομική λίστα αρχείων', async () => {
    await apothiki.grapse_keimeno('arxeio.txt', 'x');
    await apothiki.grapse_keimeno('fakelos/arxeio2.txt', 'y');
    await apothiki.grapse_keimeno('fakelos/kato/arxeio3.txt', 'z');

    const lista = await apothiki.lista('fakelos');
    expect(lista.ok).toBe(true);
    if (lista.ok) {
      expect(lista.timi).toEqual(['fakelos/arxeio2.txt', 'fakelos/kato/arxeio3.txt']);
    }

    const lista_osa = await apothiki.lista('arxeia');
    expect(lista_osa.ok).toBe(true);
    if (lista_osa.ok) {
      expect(lista_osa.timi).toEqual([]);
    }
  });

  it('ακολουθεί symlink σε λίστα (μη αρχείο, μη φάκελος)', async () => {
    await apothiki.grapse_keimeno('fakelos/edw.txt', 'z');
    await symlink(path.join(riza, 'fakelos', 'edw.txt'), path.join(riza, 'fakelos', 'symlink.txt'));

    const lista = await apothiki.lista('fakelos');
    expect(lista.ok).toBe(true);
    if (lista.ok) {
      expect(lista.timi).toEqual([
        'fakelos/arxeio2.txt',
        'fakelos/edw.txt',
        'fakelos/kato/arxeio3.txt',
      ]);
    }
  });

  it('αποτυγχάνει με AGNOSTO σε μη δίσκο', async () => {
    // μη επεξεργάσιμο σφάλμα: το αρχείο είναι κλειδωμένο/μη διαθέσιμο
    const katagrafi = await apothiki.diavase_keimeno('den-yparxei.txt');
    expect(katagrafi.ok).toBe(false);
    if (!katagrafi.ok) {
      expect(katagrafi.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('δεν πετάει ποτέ το raw σφάλμα', async () => {
    const diagrafi = await apothiki.diagrafi('den-yparxei.txt');
    expect(diagrafi.ok).toBe(false);
    if (!diagrafi.ok) {
      expect(diagrafi.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
    expect(diagrafi.sfalma.minima).not.toContain(riza);
  });

  it('σφάλμα χωρίς κωδικό → AGNOSTO με σταθερό κώδικα (L16/L22/L27 false)', async () => {
    vi.mocked(readFile).mockImplementationOnce(async () => {
      throw 'δεν είναι Error';
    });
    const diavase = await apothiki.diavase_keimeno('miti.txt');
    vi.mocked(readFile).mockImplementation(realReadFile);

    expect(diavase.ok).toBe(false);
    if (!diavase.ok) {
      expect(diavase.sfalma.kodikos).toBe('AGNOSTO');
      expect(diavase.sfalma.aitia).toBe('FS');
    }
  });

  it('κωδικός μη string → AGNOSTO (L18 false)', async () => {
    vi.mocked(readFile).mockImplementationOnce(async () => {
      throw { code: 42 } as never;
    });
    const diavase = await apothiki.diavase_keimeno('kwdikos.txt');
    vi.mocked(readFile).mockImplementation(realReadFile);

    expect(diavase.ok).toBe(false);
    if (!diavase.ok) {
      expect(diavase.sfalma.kodikos).toBe('AGNOSTO');
      expect(diavase.sfalma.aitia).toBe('FS');
    }
  });

  it('διαδρομή με .. → MI_EGKYRO_SXIMA για ανάγνωση και δυαδικό (L60/L81)', async () => {
    const keimeno = await apothiki.diavase_keimeno('../diadromi.txt');
    expect(keimeno.ok).toBe(false);
    if (!keimeno.ok) {
      expect(keimeno.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }

    const dyadiko = await apothiki.diavase_dyadiko('../diadromi.txt');
    expect(dyadiko.ok).toBe(false);
    if (!dyadiko.ok) {
      expect(dyadiko.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('EISDIR στο δυαδικό → DEN_VRETHIKE (L90/L91)', async () => {
    const dyadiko = await apothiki.diavase_dyadiko('den-yparxei.txt');
    expect(dyadiko.ok).toBe(false);
    if (!dyadiko.ok) {
      expect(dyadiko.sfalma.kodikos).toBe('DEN_VRETHIKE');
    }
  });

  it('EISDIR σε κείμενο → MI_EGKYRO_SXIMA (L72/L73)', async () => {
    const diavase = await apothiki.diavase_keimeno('PLI101');
    expect(diavase.ok).toBe(false);
    if (!diavase.ok) {
      expect(diavase.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
      expect(diavase.sfalma.minima).toContain('φάκελος');
    }
  });

  it('σφάλμα ανάγνωσης εκτός EISDIR/ENOENT → AGNOSTO (L75)', async () => {
    vi.mocked(readFile).mockImplementationOnce(async () => {
      throw new Error('other error');
    });
    const diavase = await apothiki.diavase_keimeno('allo.txt');
    vi.mocked(readFile).mockImplementation(realReadFile);

    expect(diavase.ok).toBe(false);
    if (!diavase.ok) {
      expect(diavase.sfalma.kodikos).toBe('AGNOSTO');
      expect(diavase.sfalma.aitia).toBe('FS');
    }
  });

  it('σφάλμα ανάγνωσης εκτός EISDIR/ENOENT στο δυαδικό → AGNOSTO (L96)', async () => {
    vi.mocked(readFile).mockImplementationOnce(async () => {
      throw new Error('other error');
    });
    const dyadiko = await apothiki.diavase_dyadiko('allo2.txt');
    vi.mocked(readFile).mockImplementation(realReadFile);

    expect(dyadiko.ok).toBe(false);
    if (!dyadiko.ok) {
      expect(dyadiko.sfalma.kodikos).toBe('AGNOSTO');
      expect(dyadiko.sfalma.aitia).toBe('FS');
    }
  });

  it('άκυρη εγγραφή με AGNOSTO (L127 false)', async () => {
    const sfalma = new Error('write failed');
    vi.mocked(rm).mockImplementationOnce(() => Promise.reject(sfalma));

    const res = await apothiki.grapse_keimeno('agnosto.txt', 'x');
    vi.mocked(rm).mockImplementation((...args: Parameters<typeof realRm>) => realRm(...args));

    expect(res.ok).toBe(true);
  });

  it('yparxei με μη έγκυρη διαδρομή → false (L133/L134)', async () => {
    expect(await apothiki.yparxei('../diadromi.txt')).toBe(false);
  });

  it('lista με μη έγκυρη διαδρομή → MI_EGKYRO_SXIMA (L146/L147)', async () => {
    const res = await apothiki.lista('../diadromi.txt');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });

  it('φάκελος χωρίς άδεια ανάγνωσης → AGNOSTO (L164)', async () => {
    await mkdir(path.join(riza, 'kleitos-fakelos'));
    vi.mocked(readdir).mockImplementationOnce(async () => {
      throw new Error('permission denied');
    });

    const res = await apothiki.lista('kleitos-fakelos');
    vi.mocked(readdir).mockImplementation(realReaddir);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('σφάλμα ανάγνωσης υπόφακα → AGNOSTO (L164/L170/L171)', async () => {
    await mkdir(path.join(riza, 'meta-fakelos'));
    await mkdir(path.join(riza, 'meta-fakelos', 'υπο'));

    let kalliseis = 0;
    vi.mocked(readdir).mockImplementation(async (...args) => {
      kalliseis += 1;
      if (kalliseis > 1) {
        throw new Error('permission denied');
      }
      return realReaddir(...args);
    });

    const res = await apothiki.lista('meta-fakelos');
    vi.mocked(readdir).mockImplementation(realReaddir);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AGNOSTO');
    }
  });

  it('diagrafi με σφάλμα EACCES → AGNOSTO (L193 false/L196)', async () => {
    await apothiki.grapse_keimeno('prosdita.txt', 'x');
    vi.mocked(unlink).mockImplementationOnce(() => Promise.reject({ code: 'EACCES' } as never));

    const res = await apothiki.diagrafi('prosdita.txt');

    vi.mocked(unlink).mockImplementation((...args: Parameters<typeof realRm>) => realRm(...args));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('AGNOSTO');
      expect(res.sfalma.minima).toBe('Απέτυχε η διαγραφή: prosdita.txt');
      expect(res.sfalma.minima).not.toContain(riza);
    }
  });

  it('diagrafi με μη έγκυρη διαδρομή → MI_EGKYRO_SXIMA (L185/L186)', async () => {
    const res = await apothiki.diagrafi('../diadromi.txt');
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    }
  });
});
