import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, readdir, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NodeFsApothiki } from '../src/storage/fs-apothiki.js';

let riza: string;
let apothiki: NodeFsApothiki;

beforeAll(async () => {
  riza = await mkdtemp(path.join(tmpdir(), 'dps-storage-'));
  apothiki = new NodeFsApothiki(riza);
});

afterAll(async () => {
  await rm(riza, { recursive: true, force: true });
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
});
