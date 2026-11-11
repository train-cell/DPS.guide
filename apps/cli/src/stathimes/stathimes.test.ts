import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ok, apotyxia } from '@dps/core';
import type { ApothikiPyli, Mathima } from '@dps/core';
import { dimiourgise_eisodos, DIADROMI_RYTHMISEON } from './eisodos-pipeline.js';
import { epikyrose_montelo, epikyrose_base_url, fere_montelo_apo_ryza, fere_base_url_apo_ryza } from './rythmiseis.js';
import { MiYpostirimenoEclassPyli } from './eclass-eksodon.js';
import { MiOrismenoMonteloLlmPyli } from './llm-choris-montelou.js';
import { KonsoladaKatagrafi } from './katagrafi-konsolada.js';
import { MONTELO_ME_ORISMENO } from './llm-choris-montelou.js';
import { DIADROMI_MATHIMATON, epilegmena_mathimata, fere_mathimata_apo_ryza } from './mathimata-apo-ryza.js';
import { DpsEclassPyli } from '@dps/eclass';
import type { ParastatesEntolhs } from '../entoles/grammatikopoio-entolhs.js';

const MATHIMA_EPILEGMENO: Mathima = {
  kodikos: 'MATH101',
  titlos: 'Δομές Δεδομένων',
  url: 'https://example.invalid/MATH101',
  epilegmeno: true,
};

const MATHIMA_MH_EPILEGMENO: Mathima = {
  kodikos: 'MATH202',
  titlos: 'Αλγόριθμοι',
  url: 'https://example.invalid/MATH202',
  epilegmeno: false,
};

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

  it('η καταγραφή γράφει στο stderr μέσω της ιδιωτικής κλειδωμένης συνάρτησης', async () => {
    const grapse = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      const apotelesma = await dimiourgise_eisodos(parastates('./riza', null, false));
      expect(apotelesma.ok).toBe(true);
      if (!apotelesma.ok) {
        return;
      }
      apotelesma.timi.katagrafi.sfalma('μηνυμα καταγραφής');
      expect(grapse).toHaveBeenCalledWith('[ΣΦΑΛΜΑ] μηνυμα καταγραφής\n');
    } finally {
      grapse.mockRestore();
    }
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

describe('epikyrose_base_url — εξαγωγή από ρυθμίσεις', () => {
  it('διαβάζει το base_url από έγκυρο αντικείμενο', () => {
    expect(epikyrose_base_url({ base_url: 'https://thales.cs.unipi.gr' })).toBe('https://thales.cs.unipi.gr');
  });

  it('διαβάζει το base_url ακόμα κι αν υπάρχουν άλλα πεδία (§5.3)', () => {
    expect(epikyrose_base_url({ montelo: MONTELO, base_url: 'https://thales.cs.unipi.gr' })).toBe(
      'https://thales.cs.unipi.gr'
    );
  });

  it('κενό/λείπον/μη-κείμενο base_url → null', () => {
    expect(epikyrose_base_url({})).toBeNull();
    expect(epikyrose_base_url({ base_url: '' })).toBeNull();
    expect(epikyrose_base_url({ base_url: '   ' })).toBeNull();
    expect(epikyrose_base_url({ base_url: 42 })).toBeNull();
    expect(epikyrose_base_url(null)).toBeNull();
    expect(epikyrose_base_url('μην είναι αντικείμενο')).toBeNull();
  });
});

describe('fere_montelo_apo_ryza / fere_base_url_apo_ryza', () => {
  let riza = '';

  beforeEach(async () => {
    riza = await mkdtemp(path.join(tmpdir(), 'dps-cli-rythisies-'));
  });

  afterEach(async () => {
    await rm(riza, { recursive: true, force: true });
  });

  function apothiki_grammatos(gram: string): ApothikiPyli {
    return { diavase_keimeno: async () => ok(gram) } as unknown as ApothikiPyli;
  }

  it('διαβάζει το montelo και το base_url από έγκυρο rythmiseis.json', async () => {
    const gram = JSON.stringify({ montelo: MONTELO, base_url: 'https://thales.cs.unipi.gr' });
    const apotelesma_montelo = await fere_montelo_apo_ryza(apothiki_grammatos(gram));
    const apotelesma_base = await fere_base_url_apo_ryza(apothiki_grammatos(gram));
    expect(apotelesma_montelo).toBe(MONTELO);
    expect(apotelesma_base).toBe('https://thales.cs.unipi.gr');
  });

  it('ακυρό JSON δίνει null (δεν πετάει)', async () => {
    const gram = 'αυτό δεν είναι JSON';
    expect(await fere_montelo_apo_ryza(apothiki_grammatos(gram))).toBeNull();
    expect(await fere_base_url_apo_ryza(apothiki_grammatos(gram))).toBeNull();
  });

  it('λείπον αρχείο δίνει null (δεν πετάει)', async () => {
    const apothiki = {
      diavase_keimeno: async () => apotyxia('MI_EGKYRO_SXIMA', 'δεν βρέθηκε αρχείο'),
    } as unknown as ApothikiPyli;
    expect(await fere_montelo_apo_ryza(apothiki)).toBeNull();
    expect(await fere_base_url_apo_ryza(apothiki)).toBeNull();
  });
});

describe('fere_mathimata_apo_ryza', () => {
  function apothiki_mathimaton(mathimata: readonly Mathima[]): ApothikiPyli {
    return { diavase_keimeno: async () => ok(JSON.stringify(mathimata)) } as unknown as ApothikiPyli;
  }

  it('επικυρώνει κάθε στοιχείο με το MathimaSchema', async () => {
    const mathimata = [MATHIMA_EPILEGMENO, MATHIMA_MH_EPILEGMENO];
    const apotelesma = await fere_mathimata_apo_ryza(apothiki_mathimaton(mathimata));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi).toEqual(mathimata);
  });

  it('άθλιο JSON δίνει MI_EGKYRO_SXIMA', async () => {
    const apotelesma = await fere_mathimata_apo_ryza(
      { diavase_keimeno: async () => ok('αυτό δεν είναι JSON') } as unknown as ApothikiPyli
    );
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('μη πίνακας δίνει MI_EGKYRO_SXIMA', async () => {
    const apotelesma = await fere_mathimata_apo_ryza(
      { diavase_keimeno: async () => ok(JSON.stringify({ kodikos: 'MATH101' })) } as unknown as ApothikiPyli
    );
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('μη έγκυρο στοιχείο δίνει MI_EGKYRO_SXIMA με τις λεπτομέρειες', async () => {
    const apotelesma = await fere_mathimata_apo_ryza(
      apothiki_mathimaton([{ kodikos: 'MATH101' }] as unknown as Mathima[])
    );
    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) return;
    expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.sfalma.minima).toContain('θέση 0');
  });

  it('κενή λίστα επιστρέφει κενή λίστα (όχι σφάλμα)', async () => {
    const apotelesma = await fere_mathimata_apo_ryza(apothiki_mathimaton([]));
    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) return;
    expect(apotelesma.timi).toEqual([]);
  });
});

describe('epilegmena_mathimata', () => {
  it('κρατά μόνο τα επιλεγμένα', () => {
    expect(epilegmena_mathimata([MATHIMA_EPILEGMENO, MATHIMA_MH_EPILEGMENO])).toEqual([MATHIMA_EPILEGMENO]);
  });

  it('κενή λίστα δίνει κενή λίστα', () => {
    expect(epilegmena_mathimata([])).toEqual([]);
  });
});

describe('MiYpostirimenoEclassPyli', () => {
  it('η fere_mathimata δίνει σαφές unsupported error', async () => {
    const pili = new MiYpostirimenoEclassPyli();
    const apotelesma = await pili.fere_mathimata();
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) expect(apotelesma.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });

  it('η fere_dentro_arxeion δίνει σαφές unsupported error', async () => {
    const pili = new MiYpostirimenoEclassPyli();
    const apotelesma = await pili.fere_dentro_arxeion();
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) expect(apotelesma.sfalma.kodikos).toBe('MI_YPOSTIRIZOMENO');
  });
});

describe('MiOrismenoMonteloLlmPyli', () => {
  it('δείχνει το ρητό κενό μοντέλο', () => {
    expect(new MiOrismenoMonteloLlmPyli().montelo).toBe(MONTELO_ME_ORISMENO);
  });

  it('η parage_json δίνει σφάλμα', async () => {
    const pili = new MiOrismenoMonteloLlmPyli();
    const apotelesma = await pili.parage_json();
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('η parage_keimeno δίνει σφάλμα', async () => {
    const pili = new MiOrismenoMonteloLlmPyli();
    const apotelesma = await pili.parage_keimeno();
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) expect(apotelesma.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });
});

describe('KonsoladaKatagrafi', () => {
  it('γράφει pliroforia με δεδομένα', () => {
    const grammes: string[] = [];
    const katagrafi = new KonsoladaKatagrafi((grammi) => grammes.push(grammi));
    katagrafi.pliroforia('msg', { a: 1 });
    expect(grammes).toEqual(['[ΠΛΗΡΟΦΟΡΙΑ] msg {"a":1}']);
  });

  it('γράφει pliroforia χωρίς δεδομένα', () => {
    const grammes: string[] = [];
    const katagrafi = new KonsoladaKatagrafi((grammi) => grammes.push(grammi));
    katagrafi.pliroforia('msg');
    expect(grammes).toEqual(['[ΠΛΗΡΟΦΟΡΙΑ] msg']);
  });

  it('γράφει proeidopoiisi και sfalma', () => {
    const grammes: string[] = [];
    const katagrafi = new KonsoladaKatagrafi((grammi) => grammes.push(grammi));
    katagrafi.proeidopoiisi('proe');
    katagrafi.sfalma('sfd', { x: true });
    expect(grammes).toEqual(['[ΠΡΟΕΙΔΟΠΟΙΗΣΗ] proe', '[ΣΦΑΛΜΑ] sfd {"x":true}']);
  });

  it('δεν πετάει όταν δεν χωράει τα δεδομένα στο JSON', () => {
    const grammes: string[] = [];
    const katagrafi = new KonsoladaKatagrafi((grammi) => grammes.push(grammi));
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    katagrafi.sfalma('sfd', circular);
    expect(grammes).toEqual(['[ΣΦΑΛΜΑ] sfd [δεν σειριοποιήθηκε]']);
  });
});

