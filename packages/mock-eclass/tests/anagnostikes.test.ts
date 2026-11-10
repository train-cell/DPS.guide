import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fortise_json_arxeio, yparxei_fakelos } from '../src/anagnostikes.js';

/** `fs.readFile` που πετάει αντί για Error — δεν έχει `code`. */
async function apotyxia_me_miti(): Promise<never> {
  throw 'δεν είναι Error';
}

/** `fs.readFile` που πετάει με `code` μη-string. */
async function apotyxia_me_kodikos(): Promise<never> {
  throw { code: 42 } as never;
}

const realReadFile = vi.spyOn(fs, 'readFile');

let riza_prosorini: string;

beforeEach(async () => {
  riza_prosorini = await fs.mkdtemp(path.join(os.tmpdir(), 'dps-mock-anagnostikes-'));
});

afterEach(async () => {
  await fs.rm(riza_prosorini, { recursive: true, force: true });
});

describe('fortise_json_arxeio', () => {
  it('διαβάζει και διασπεί το έγκυρο JSON', async () => {
    const diadromi = path.join(riza_prosorini, 'dokimasi.json');
    await fs.writeFile(diadromi, JSON.stringify({ a: 1 }), 'utf8');

    const r = await fortise_json_arxeio(diadromi);

    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('απέτυχε');
    expect(r.timi).toEqual({ a: 1 });
  });

  it('δίνει DEN_VRETHIKE όταν λείπει το αρχείο', async () => {
    const diadromi = path.join(riza_prosorini, 'den-uparxei.json');
    const r = await fortise_json_arxeio(diadromi);

    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('απέτυχε');
    expect(r.sfalma.kodikos).toBe('DEN_VRETHIKE');
    expect(r.sfalma.aitia?.code).toBe('ENOENT');
  });

  it('δίνει MI_EGKYRO_SXIMA όταν το JSON δεν είναι έγκυρο', async () => {
    const diadromi = path.join(riza_prosorini, 'adoxo.json');
    await fs.writeFile(diadromi, '{ δεν είναι json', 'utf8');
    const r = await fortise_json_arxeio(diadromi);

    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('απέτυχε');
    expect(r.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('δίνει MI_EGKYRO_SXIMA όταν η ανάγνωση πετάει άλλη', async () => {
    // ένα αρχείο που δεν μπορεί να αναγνωστεί (διαδρομή με μη-υπάρχοντα φάκελο)
    const diadromi = path.join(riza_prosorini, 'adoxo.json');
    await fs.mkdir(path.join(riza_prosorini, 'fakelos'), { recursive: true });
    await fs.chmod(path.join(riza_prosorini, 'fakelos'), 0o000);
    const r = await fortise_json_arxeio(path.join(riza_prosorini, 'fakelos', 'den.mpfr'));
    // το σφάλμα είναι EACCES (όχι ENOENT)
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('απέτυχε');
    expect(r.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('fortise_json_arxeio — σφάλματα ανάγνωσης', () => {
  it('δίνει MI_EGKYRO_SXIMA όταν η ανάγνωση πετάει μη Error (L8 false)', async () => {
    realReadFile.mockImplementationOnce(apotyxia_me_miti);
    const diadromi = path.join(riza_prosorini, 'adoxo.json');
    const r = await fortise_json_arxeio(diadromi);

    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('απέτυχε');
    expect(r.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('δίνει MI_EGKYRO_SXIMA όταν το code δεν είναι string (L10 false)', async () => {
    realReadFile.mockImplementationOnce(apotyxia_me_kodikos);
    const diadromi = path.join(riza_prosorini, 'adoxo.json');
    const r = await fortise_json_arxeio(diadromi);

    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('απέτυχε');
    expect(r.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('yparxei_fakelos', () => {
  it('δίνει false όταν δεν υπάρχει το αρχείο', async () => {
    expect(await yparxei_fakelos(path.join(riza_prosorini, 'den-uparxei'))).toBe(false);
  });

  it('δίνει true όταν είναι φάκελος', async () => {
    expect(await yparxei_fakelos(riza_prosorini)).toBe(true);
  });

  it('δίνει false όταν είναι αρχείο', async () => {
    const diadromi = path.join(riza_prosorini, 'arxeio.txt');
    await fs.writeFile(diadromi, 'x', 'utf8');
    expect(await yparxei_fakelos(diadromi)).toBe(false);
  });
});
