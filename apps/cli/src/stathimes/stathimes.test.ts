import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ok } from '@dps/core';
import { dimiourgise_eisodos, DIADROMI_RYTHMISEON } from './eisodos-pipeline.js';
import { epikyrose_montelo } from './rythmiseis.js';
import { MiYpostirimenoEclassPyli } from './eclass-eksodon.js';
import { DpsEclassPyli } from '@dps/eclass';
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

describe('dimiourgise_eisodos — όρια privacy του CLI', () => {
  it('αρνείται κάθε AI εντολή πριν διαβάσει μυστικά ή στήσει provider', async () => {
    const apotelesma = await dimiourgise_eisodos(parastates('./riza', MONTELO, true));
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
    expect(apotelesma.sfalma.minima).toContain('συναίνεση ανά μάθημα');
    expect(apotelesma.sfalma.minima).toContain('ακριβούς prompt');
  });

  it('οι μη-AI εντολές στήνουν πραγματικά ports με provider που αποτυγχάνει κλειστά', async () => {
    const apotelesma = await dimiourgise_eisodos(parastates('./riza', null, false));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    // Node adapters already include --riza; pipeline paths therefore stay relative.
    expect(apotelesma.timi.riza).toBe('');
    expect(apotelesma.timi.apothiki).toBeDefined();
    expect(apotelesma.timi.mystika).toBeDefined();
    expect(apotelesma.timi.katagrafi).toBeDefined();
    expect(apotelesma.timi.rologi.tora()).toBeInstanceOf(Date);
    const generated = await apotelesma.timi.llm.parage_keimeno({
      systima: 'test',
      minimata: [{ rolos: 'xristis', keimeno: 'test' }],
      ekdosi_prompt: '1',
      thermokrasia: 0,
    });
    expect(generated.ok).toBe(false);
  });
});

describe('dimiourgise_eisodos — αποθήκευση και πραγματικό Open eClass port', () => {
  let riza = '';

  beforeEach(async () => {
    riza = await mkdtemp(path.join(tmpdir(), 'dps-cli-'));
  });

  afterEach(async () => {
    await rm(riza, { recursive: true, force: true });
  });

  it('η ρύθμιση μοντέλου ή η σημαία --montelo δεν παρακάμπτουν το CLI privacy gate', async () => {
    await writeFile(path.join(riza, DIADROMI_RYTHMISEON), JSON.stringify({ montelo: MONTELO }), 'utf8');
    const apotelesma = await dimiourgise_eisodos(parastates(riza, 'gemini-2.5-flash', true));
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) expect(apotelesma.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('το apothiki port δεσμεύεται στη ρίζα που δώθηκε', async () => {
    const apotelesma = await dimiourgise_eisodos(parastates(riza, null, false));
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
  const palioMockEclass = process.env.MOCK_ECLASS;
  const palioBase = process.env.ECLASS_BASE_URL;

  beforeEach(async () => {
    riza = await mkdtemp(path.join(tmpdir(), 'dps-cli-eclass-'));
    delete process.env.ECLASS_USERNAME;
    delete process.env.ECLASS_PASSWORD;
    delete process.env.ECLASS_MOCK;
    delete process.env.MOCK_ECLASS;
    delete process.env.ECLASS_BASE_URL;
  });

  afterEach(async () => {
    if (palioUser !== undefined) process.env.ECLASS_USERNAME = palioUser;
    else delete process.env.ECLASS_USERNAME;
    if (palioPass !== undefined) process.env.ECLASS_PASSWORD = palioPass;
    else delete process.env.ECLASS_PASSWORD;
    if (palioMock !== undefined) process.env.ECLASS_MOCK = palioMock;
    else delete process.env.ECLASS_MOCK;
    if (palioMockEclass !== undefined) process.env.MOCK_ECLASS = palioMockEclass;
    else delete process.env.MOCK_ECLASS;
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

  it('αγνοεί legacy mock_eclass ρύθμιση και επιστρέφει σαφές unsupported port', async () => {
    await writeFile(
      path.join(riza, DIADROMI_RYTHMISEON),
      JSON.stringify({ montelo: MONTELO, mock_eclass: true }),
      'utf8'
    );
    const apotelesma = await dimiourgise_eisodos(parastates(riza, null, false));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi.eclass).toBeInstanceOf(MiYpostirimenoEclassPyli);
    const connection = await apotelesma.timi.eclass.syndesi();
    expect(connection.ok).toBe(false);
    if (!connection.ok) expect(connection.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('αγνοεί legacy ECLASS_MOCK και δεν εμφανίζει ψεύτικη επιτυχία', async () => {
    process.env.ECLASS_MOCK = 'true';
    const apotelesma = await dimiourgise_eisodos(parastates(riza, MONTELO, false));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi.eclass).toBeInstanceOf(MiYpostirimenoEclassPyli);
    const connection = await apotelesma.timi.eclass.syndesi();
    expect(connection.ok).toBe(false);
    if (!connection.ok) expect(connection.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });
});

describe('συμβατότητα αποτελεσμάτων', () => {
  it('το apotelesma επιστρέφει ok(true) όταν στηθεί', () => {
    const apotelesma = ok({ montelo: MONTELO });
    expect(apotelesma.ok).toBe(true);
  });
});

