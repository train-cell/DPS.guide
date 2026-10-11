import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ok } from '@dps/core';
import { dimiourgise_eisodos, DIADROMI_RYTHMISEON } from './eisodos-pipeline.js';
import { epikyrose_montelo } from './rythmiseis.js';
import { MiYpostirimenoEclassPyli } from './eclass-eksodon.js';
import { DpsEclassPyli } from '@dps/eclass';
import { MockEclassPyli } from '@dps/mock-eclass';
import type { ParastatesEntolhs } from '../entoles/grammatikopoio-entolhs.js';

const MONTELO = 'gemini-ypokpisteio';

function parastates(riza: string, montelo: string | null, xreiazetai_llm = false): ParastatesEntolhs {
  return { riza, montelo, xreiazetai_llm };
}

describe('epikyrose_montelo', () => {
  it('διαβάζει το montelo από έγκυρο αντικείμενο', () => {
    expect(epikyrose_montelo({ montelo: MONTELO })).toBe(MONTELO);
  });

  it('διαβάζει το montelo ακόμα κι αν υπάρχουν άλλα πεδία (§5.3)', () => {
    expect(epikyrose_montelo({ base_url: 'https://x.invalid', montelo: MONTELO, exetaseis: [] })).toBe(
      MONTELO
    );
  });

  it('κενό/λείπον/μη-κείμενο montelo → null (ποτέ ψεύτικο μοντέλο)', () => {
    expect(epikyrose_montelo({})).toBeNull();
    expect(epikyrose_montelo({ montelo: '' })).toBeNull();
    expect(epikyrose_montelo({ montelo: '   ' })).toBeNull();
    expect(epikyrose_montelo({ montelo: 42 })).toBeNull();
    expect(epikyrose_montelo(null)).toBeNull();
    expect(epikyrose_montelo('μην είναι αντικείμενο')).toBeNull();
  });
});

describe('dimiourgise_eisodos — χωρίς I/O', () => {
  it('με μοντέλο από σημαία στήνει όλα τα ports χωρίς δίκτυο', async () => {
    const apotelesma = await dimiourgise_eisodos(parastates('./riza', MONTELO, true));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.llm.montelo).toBe(MONTELO);
    expect(apotelesma.timi.riza).toBe('./riza');
    expect(apotelesma.timi.apothiki).toBeDefined();
    expect(apotelesma.timi.mystika).toBeDefined();
    expect(apotelesma.timi.katagrafi).toBeDefined();
    expect(apotelesma.timi.rologi.tora()).toBeInstanceOf(Date);
  });

  it('χωρίς μοντέλο, σε εντολή που δεν θέλει LLM, στήνει κανονικά τα ports', async () => {
    const apotelesma = await dimiourgise_eisodos(parastates('./riza', null, false));
    expect(apotelesma.ok).toBe(true);
  });

  it('χωρίς μοντέλο, σε εντολή που θέλει LLM, δίνει σφάλμα με οδηγίες', async () => {
    const apotelesma = await dimiourgise_eisodos(parastates('./riza', null, true));
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('--montelo');
    expect(apotelesma.sfalma.minima).toContain(DIADROMI_RYTHMISEON);
  });

  it('το port του eClass είναι ρητά «μη υλοποιημένο», όχι ψεύτικη επιτυχία', async () => {
    const apotelesma = await dimiourgise_eisodos(parastates('./riza', MONTELO, true));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.eclass).toBeInstanceOf(MiYpostirimenoEclassPyli);
    const syndesi = await apotelesma.timi.eclass.syndesi();
    expect(syndesi.ok).toBe(false);
    if (syndesi.ok) {
      return;
    }
    expect(syndesi.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });
});

describe('dimiourgise_eisodos — ανάγνωση rythmiseis.json', () => {
  let riza = '';

  beforeEach(async () => {
    riza = await mkdtemp(path.join(tmpdir(), 'dps-cli-'));
  });

  afterEach(async () => {
    await rm(riza, { recursive: true, force: true });
  });

  it('διαβάζει το montelo από το <riza>/rythmiseis.json', async () => {
    await writeFile(
      path.join(riza, DIADROMI_RYTHMISEON),
      JSON.stringify({ montelo: MONTELO, base_url: 'https://example.invalid' }),
      'utf8'
    );
    const apotelesma = await dimiourgise_eisodos(parastates(riza, null, true));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.llm.montelo).toBe(MONTELO);
  });

  it('η σημαία --montelo υπερισχύει του αρχείου ρυθμίσεων', async () => {
    await writeFile(path.join(riza, DIADROMI_RYTHMISEON), JSON.stringify({ montelo: 'apo-arxeio' }), 'utf8');
    const apotelesma = await dimiourgise_eisodos(parastates(riza, 'apo-semeia', true));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.llm.montelo).toBe('apo-semeia');
  });

  it('άθλιο rythmiseis.json + ζητούμενο LLM → σφάλμα, όχι default μοντέλο', async () => {
    await writeFile(path.join(riza, DIADROMI_RYTHMISEON), 'όχι JSON', 'utf8');
    const apotelesma = await dimiourgise_eisodos(parastates(riza, null, true));
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('λείποντο rythmiseis.json + ζητούμενο LLM → σφάλμα με οδηγίες', async () => {
    const apotelesma = await dimiourgise_eisodos(parastates(riza, null, true));
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.minima).toContain('--montelo');
  });

  it('το apothiki port δεσμεύεται στη ρίζα που δώθηκε', async () => {
    const apotelesma = await dimiourgise_eisodos(parastates(riza, MONTELO, true));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    const grapse = await apotelesma.timi.apothiki.grapse_keimeno('arkeio.txt', 'periexomeno');
    expect(grapse.ok).toBe(true);
    const diavase = await apotelesma.timi.apothiki.diavase_keimeno('arkeio.txt');
    expect(diavase.ok).toBe(true);
    if (!diavase.ok) {
      return;
    }
    expect(diavase.timi).toBe('periexomeno');
  });
});

describe('dimiourgise_eisodos — επιλογή EclassPyli', () => {
  let riza = '';
  const palioUser = process.env.ECLASS_USERNAME;
  const palioPass = process.env.ECLASS_PASSWORD;
  const palioMock = process.env.ECLASS_MOCK;
  const palioBase = process.env.ECLASS_BASE_URL;

  beforeEach(async () => {
    riza = await mkdtemp(path.join(tmpdir(), 'dps-cli-eclass-'));
    delete process.env.ECLASS_USERNAME;
    delete process.env.ECLASS_PASSWORD;
    delete process.env.ECLASS_MOCK;
    delete process.env.ECLASS_BASE_URL;
  });

  afterEach(async () => {
    if (palioUser !== undefined) process.env.ECLASS_USERNAME = palioUser;
    else delete process.env.ECLASS_USERNAME;
    if (palioPass !== undefined) process.env.ECLASS_PASSWORD = palioPass;
    else delete process.env.ECLASS_PASSWORD;
    if (palioMock !== undefined) process.env.ECLASS_MOCK = palioMock;
    else delete process.env.ECLASS_MOCK;
    if (palioBase !== undefined) process.env.ECLASS_BASE_URL = palioBase;
    else delete process.env.ECLASS_BASE_URL;
    await rm(riza, { recursive: true, force: true });
  });

  it('στήνει πραγματική DpsEclassPyli όταν υπάρχουν διαπιστευτήρια και base_url', async () => {
    process.env.ECLASS_USERNAME = 'dokimi_xristis';
    process.env.ECLASS_PASSWORD = 'dokimi_kodikos';
    await writeFile(
      path.join(riza, DIADROMI_RYTHMISEON),
      JSON.stringify({ montelo: MONTELO, base_url: 'https://thales.cs.unipi.gr' }),
      'utf8'
    );
    const apotelesma = await dimiourgise_eisodos(parastates(riza, null, false));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi.eclass).toBeInstanceOf(DpsEclassPyli);
  });

  it('στήνει MockEclassPyli όταν έχει οριστεί mock_eclass: true στις ρυθμίσεις', async () => {
    await writeFile(
      path.join(riza, DIADROMI_RYTHMISEON),
      JSON.stringify({ montelo: MONTELO, mock_eclass: true }),
      'utf8'
    );
    const apotelesma = await dimiourgise_eisodos(parastates(riza, null, false));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi.eclass).toBeInstanceOf(MockEclassPyli);
  });

  it('στήνει MockEclassPyli όταν έχει οριστεί ECLASS_MOCK=true στο περιβάλλον', async () => {
    process.env.ECLASS_MOCK = 'true';
    const apotelesma = await dimiourgise_eisodos(parastates(riza, MONTELO, false));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi.eclass).toBeInstanceOf(MockEclassPyli);
  });
});

describe('συμβατότητα αποτελεσμάτων', () => {
  it('το apotelesma επιστρέφει ok(true) όταν στηθεί', () => {
    const apotelesma = ok({ montelo: MONTELO });
    expect(apotelesma.ok).toBe(true);
  });
});

