import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  Apotelesma,
  ApothikiPyli,
  EclassPyli,
  KatagrafiPyli,
  KomvosArxeiou,
  LlmPyli,
  Mathima,
  OdigosMeta,
  Sfalma,
  XartisMathimatos,
} from '@dps/core';
import { FakeRologi, MnimiApothiki, FakeMystika, apotyxia, ok } from '@dps/core';
import type { EisodosPipeline, Metriti } from '@dps/pipeline';

/** Ψεύτικα βήματα του `@dps/pipeline` — το εργοστάσιο του vi.mock. */
const bima = vi.hoisted(() => ({
  syndesi: vi.fn(),
  anakalypsi: vi.fn(),
  sygxronismos: vi.fn(),
  exagogi: vi.fn(),
  perigramma: vi.fn(),
  xartis: vi.fn(),
  megethi: vi.fn(),
  odigos: vi.fn(),
  programma: vi.fn(),
  trekse_analysi: vi.fn(),
  trekse_oloklirosi: vi.fn(),
}));

vi.mock('@dps/pipeline', () => ({
  ...bima,
  KLEIDIA_PIPELINE: ['eclass_onoma_xristi', 'eclass_kodikos', 'llm_api_key'],
}));

const { trexe_entoles } = await import('./eksodiki.js');

const KODIKOS_OK = 0;
const KODIKOS_SFALMA = 1;

const RIZA = '/riza-upokpistea';
const MONTELO = 'gemini-ypokpisteio';

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

const XARTIS: XartisMathimatos = {
  kodikos_mathimatos: 'MATH101',
  enotites: [
    {
      id: 'en-1',
      titlos: 'Δεντικά δέντρα',
      piges: [],
      ennoies: [],
      proapaitoumenes: [],
      seira: 1,
      lepta_ektimisi: 120,
      apodosi_exetasis: null,
    },
    {
      id: 'en-2',
      titlos: 'Αναζήτηση',
      piges: [],
      ennoies: [],
      proapaitoumenes: [],
      seira: 2,
      lepta_ektimisi: null,
      apodosi_exetasis: null,
    },
  ],
  ekdosi_prompt: 'p2',
  dimiourgithike: '2026-10-09T10:00:00.000Z',
};

const ODIGOS_META: OdigosMeta = {
  enotita_id: 'en-1',
  parapompes: [{ arxeio_id: 'arx-1', selida: 12 }],
  montelo: MONTELO,
  ekdosi_prompt: 'p3',
  hash_eisodou: 'abc123',
  proeidopoiiseis: ['Αναφέρθηκε στη σελίδα 3, όχι στο υλικό'],
};

function ekliron_eclass(): EclassPyli {
  const apotelesma = <T,>(): Apotelesma<T> =>
    apotyxia<T>('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test');
  return {
    syndesi: async () => apotelesma<void>(),
    fere_mathimata: async () => apotelesma<Mathima[]>(),
    fere_dentro_arxeion: async () => apotelesma<KomvosArxeiou[]>(),
  };
}

function ekliron_llm(): LlmPyli {
  return {
    montelo: MONTELO,
    parage_json: async <T>(): Promise<Apotelesma<T>> =>
      apotyxia<T>('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
    parage_keimeno: async () => apotyxia('MI_YPOSTIRIZOMENO', 'δεν χρειάζεται στο test'),
  };
}

function ekliron_katagrafi(): KatagrafiPyli {
  return {
    pliroforia: () => undefined,
    proeidopoiisi: () => undefined,
    sfalma: () => undefined,
  };
}

interface ParastatesEksodiki {
  readonly eisodos: EisodosPipeline;
  readonly apothiki: ApothikiPyli;
  readonly mystika: FakeMystika;
  readonly grammes: string[];
  readonly sfalmes: Sfalma[];
  readonly trexe: (argv: readonly string[]) => Promise<number>;
}

/** CLI παράσταση με ψεύτικα ports και καταγραφή εξόδου. */
function parastates(): ParastatesEksodiki {
  const apothiki = new MnimiApothiki();
  const mystika = new FakeMystika();
  const grammes: string[] = [];
  const sfalmes: Sfalma[] = [];
  const eisodos: EisodosPipeline = {
    eclass: ekliron_eclass(),
    apothiki,
    llm: ekliron_llm(),
    mystika,
    rologi: new FakeRologi(),
    katagrafi: ekliron_katagrafi(),
    riza: RIZA,
  };
  return {
    eisodos,
    apothiki,
    mystika,
    grammes,
    sfalmes,
    trexe: (argv) =>
      trexe_entoles(argv, {
        dimiourgise_eisodos: async () => ok(eisodos),
        eksodosi: {
          grapse_grammi: (grammi) => grammes.push(grammi),
          grapse_sfalma: (sfalma) => sfalmes.push(sfalma),
        },
      }),
  };
}

/** Γράφει το `mathimata.json` της ρίζας μέσω του port αποθήκευσης. */
function grapse_mathimata(apothiki: ApothikiPyli, mathimata: readonly Mathima[]): Promise<Apotelesma<void>> {
  return apothiki.grapse_keimeno('mathimata.json', JSON.stringify(mathimata));
}

beforeEach(() => {
  vi.clearAllMocks();
  bima.syndesi.mockResolvedValue(ok(undefined));
  bima.anakalypsi.mockResolvedValue(ok([MATHIMA_EPILEGMENO, MATHIMA_MH_EPILEGMENO]));
  bima.sygxronismos.mockResolvedValue(ok({ megaliteres: 7 } satisfies Metriti));
  bima.odigos.mockResolvedValue(ok(ODIGOS_META));
  bima.programma.mockResolvedValue(ok({ simera: 2 }));
  bima.trekse_analysi.mockResolvedValue(ok(XARTIS));
  bima.trekse_oloklirosi.mockResolvedValue(ok({ mathimata: 1 }));
});

describe('mathimata', () => {
  it('καλεί το βήμα anakalypsi με την EisodosPipeline', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['mathimata']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(bima.anakalypsi).toHaveBeenCalledTimes(1);
    expect(bima.anakalypsi).toHaveBeenCalledWith(p.eisodos);
  });

  it('τυπώνει τα μαθήματα με τον κωδικό και τον τίτλο τους', async () => {
    const p = parastates();
    await p.trexe(['mathimata']);
    const oles = p.grammes.join('\n');
    expect(oles).toContain('MATH101');
    expect(oles).toContain('Δομές Δεδομένων');
    expect(oles).toContain('MATH202');
    expect(p.sfalmes).toHaveLength(0);
  });

  it('σε --json δίνει μία εγγραφή JSON με ok=true', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['mathimata', '--json']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(p.grammes).toHaveLength(1);
    const dedomena: unknown = JSON.parse(p.grammes[0] as string);
    expect(dedomena).toMatchObject({
      ok: true,
      apotelesma: { eidos: 'mathimata' },
    });
  });
});

describe('sygxronismos', () => {
  it('με κωδικό καλεί το βήμα για αυτόν τον ένα κωδικό', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['sygxronismos', 'MATH101']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(bima.sygxronismos).toHaveBeenCalledTimes(1);
    expect(bima.sygxronismos).toHaveBeenCalledWith(p.eisodos, 'MATH101');
  });

  it('χωρίς κωδικό περνά από τα επιλεγμένα μαθήματα του mathimata.json', async () => {
    const p = parastates();
    await grapse_mathimata(p.apothiki, [MATHIMA_EPILEGMENO, MATHIMA_MH_EPILEGMENO]);
    const kodikos = await p.trexe(['sygxronismos']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(bima.sygxronismos).toHaveBeenCalledTimes(1);
    expect(bima.sygxronismos).toHaveBeenCalledWith(p.eisodos, 'MATH101');
  });

  it('χωρίς επιλεγμένα μαθήματα δίνει σφάλμα χωρίς να καλέσει το βήμα', async () => {
    const p = parastates();
    await grapse_mathimata(p.apothiki, [MATHIMA_MH_EPILEGMENO]);
    const kodikos = await p.trexe(['sygxronismos']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(bima.sygxronismos).not.toHaveBeenCalled();
    expect(p.sfalmes).toHaveLength(1);
    expect(p.sfalmes[0]?.kodikos).toBe('DEN_VRETHIKE');
  });

  it('χωρίς mathimata.json δίνει σφάλμα, όχι κενή επιτυχία', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['sygxronismos']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(bima.sygxronismos).not.toHaveBeenCalled();
    expect(p.sfalmes[0]?.kodikos).toBe('DEN_VRETHIKE');
  });

  it('άθλιο mathimata.json δίνει σφάλμα και όχι ψεύτικη επιτυχία', async () => {
    const p = parastates();
    await p.apothiki.grapse_keimeno('mathimata.json', 'αυτό δεν είναι JSON');
    const kodikos = await p.trexe(['sygxronismos']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(bima.sygxronismos).not.toHaveBeenCalled();
    expect(p.sfalmes[0]?.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('καταρρέει στο δεύτερο μάθημα → exit 1, χωρίς ψεύτικη επιτυχία', async () => {
    const p = parastates();
    const allh = { ...MATHIMA_EPILEGMENO, kodikos: 'MATH303' };
    await grapse_mathimata(p.apothiki, [MATHIMA_EPILEGMENO, allh]);
    bima.sygxronismos
      .mockResolvedValueOnce(ok({ megaliteres: 3 } satisfies Metriti))
      .mockResolvedValueOnce(apotyxia('DIKTYO', 'δεν απαντά ο διακομιστής'));
    const kodikos = await p.trexe(['sygxronismos']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(p.sfalmes[0]?.kodikos).toBe('DIKTYO');
  });
});

describe('analysi', () => {
  it('καλεί τη σύνθετη ροή exagogi→perigramma→xartis→megethi με τον κωδικό', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['analysi', 'MATH101']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(bima.trekse_analysi).toHaveBeenCalledTimes(1);
    expect(bima.trekse_analysi).toHaveBeenCalledWith(p.eisodos, 'MATH101');
  });

  it('τυπώνει τις ενότητες με σειρά και λεπτά (— όταν δεν υπάρχουν)', async () => {
    const p = parastates();
    await p.trexe(['analysi', 'MATH101']);
    const oles = p.grammes.join('\n');
    expect(oles).toContain('Δεντικά δέντρα');
    expect(oles).toContain('120');
    expect(oles).toContain('Αναζήτηση');
  });

  it('χωρίς κωδικό δίνει σφάλμα χρήσης χωρίς να καλέσει τη ροή', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['analysi']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(bima.trekse_analysi).not.toHaveBeenCalled();
    expect(p.sfalmes[0]?.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(p.sfalmes[0]?.minima).toContain('KODIKOS');
  });
});

describe('odigos', () => {
  it('καλεί το βήμα odigos με το id της ενότητας', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['odigos', 'en-1']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(bima.odigos).toHaveBeenCalledTimes(1);
    expect(bima.odigos).toHaveBeenCalledWith(p.eisodos, 'en-1');
  });

  it('τυπώνει παραπομπές, μοντέλο και προειδποιήσεις', async () => {
    const p = parastates();
    await p.trexe(['odigos', 'en-1']);
    const oles = p.grammes.join('\n');
    expect(oles).toContain('arx-1');
    expect(oles).toContain('12');
    expect(oles).toContain(MONTELO);
    expect(oles).toContain('Αναφέρθηκε στη σελίδα 3, όχι στο υλικό');
  });

  it('χωρίς id δίνει σφάλμα χρήσης', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['odigos']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(bima.odigos).not.toHaveBeenCalled();
  });
});

describe('programma', () => {
  it('καλεί το βήμα programma χωρίς ορίσματα', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['programma']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(bima.programma).toHaveBeenCalledTimes(1);
    expect(bima.programma).toHaveBeenCalledWith(p.eisodos);
  });

  it('τυπώνει το άγνωστης μορφής αποτέλεσμα ως JSON', async () => {
    const p = parastates();
    await p.trexe(['programma']);
    expect(p.grammes.join('\n')).toContain('"simera": 2');
  });
});

describe('run', () => {
  it('καλεί την ολοκληρη ροή χωρίς ορίσματα', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['run']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(bima.trekse_oloklirosi).toHaveBeenCalledTimes(1);
    expect(bima.trekse_oloklirosi).toHaveBeenCalledWith(p.eisodos);
  });
});

describe('syndesi', () => {
  it('χωρίς διαπιστευτήρια δεν καλεί το βήμα και δίνει σφάλμα', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['syndesi']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(bima.syndesi).not.toHaveBeenCalled();
    expect(p.sfalmes[0]?.kodikos).toBe('DEN_VRETHIKE');
  });

  it('με διαπιστευτήρια στο MystikaPyli καλεί το βήμα σύνδεσης', async () => {
    const p = parastates();
    await p.mystika.vale('eclass_onoma_xristi', 'student');
    await p.mystika.vale('eclass_kodikos', 'kodikos-ypokpisteios');
    const kodikos = await p.trexe(['syndesi']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(bima.syndesi).toHaveBeenCalledTimes(1);
    expect(bima.syndesi).toHaveBeenCalledWith(p.eisodos);
  });

  it('ποΤΕ δεν τυπώνει τις τιμές των μυστικών', async () => {
    const p = parastates();
    await p.mystika.vale('eclass_onoma_xristi', 'ONOMA_MYSTEIKO');
    await p.mystika.vale('eclass_kodikos', 'KODIKOS_MYSTEIKOS');
    await p.trexe(['syndesi']);
    const oles = [...p.grammes, ...p.sfalmes.map((s) => s.minima)].join('\n');
    expect(oles).not.toContain('ONOMA_MYSTEIKO');
    expect(oles).not.toContain('KODIKOS_MYSTEIKOS');
  });

  it('το κλειδί LLM που λείπει δεν εμποδίζει τη σύνδεση', async () => {
    const p = parastates();
    await p.mystika.vale('eclass_onoma_xristi', 'student');
    await p.mystika.vale('eclass_kodikos', 'kodikos-ypokpisteios');
    const kodikos = await p.trexe(['syndesi']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(bima.syndesi).toHaveBeenCalledTimes(1);
  });
});

describe('σφάλματα — καμία ψεύτικη επιτυχία, καμένο unhandled rejection', () => {
  it('Apotelesma με ok=false → exit 1 και τυπώνει τον κωδικό σφάλματος', async () => {
    const p = parastates();
    bima.anakalypsi.mockResolvedValue(apotyxia('SESSION_LIXI', 'Η συνεδρία λήξησε'));
    const kodikos = await p.trexe(['mathimata']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(p.grammes).toHaveLength(0);
    expect(p.sfalmes).toHaveLength(1);
    expect(p.sfalmes[0]?.kodikos).toBe('SESSION_LIXI');
    expect(p.sfalmes[0]?.minima).toBe('Η συνεδρία λήξησε');
  });

  it('βήμα που πετάει εξαίρεση → exit 1, χωρίς να διακλαδωθεί', async () => {
    const p = parastates();
    bima.anakalypsi.mockRejectedValue(new Error('ακροηγός σφάλμα του adapter'));
    const kodikos = await p.trexe(['mathimata']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(p.sfalmes).toHaveLength(1);
    expect(p.sfalmes[0]?.kodikos).toBe('AGNOSTO');
  });

  it('μη-Error rejection (raw object) → exit 1, χωρίς unhandled rejection', async () => {
    const p = parastates();
    bima.anakalypsi.mockRejectedValue({ sfalma: { kodikos: 'DEN_VRETHIKE', minima: 'χ' } });
    const kodikos = await p.trexe(['mathimata']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(p.sfalmes).toHaveLength(1);
    expect(p.sfalmes[0]?.kodikos).toBe('DEN_VRETHIKE');
  });

  it('σφάλμα στη δημιουργία ports → exit 1 και κανένα βήμα δεν καλείται', async () => {
    const p = parastates();
    const kodikos = await trexe_entoles(['mathimata'], {
      dimiourgise_eisodos: async () => apotyxia('MI_EGKYRO_SXIMA', 'λείπει το μοντέλο'),
      eksodosi: {
        grapse_grammi: (grammi) => p.grammes.push(grammi),
        grapse_sfalma: (sfalma) => p.sfalmes.push(sfalma),
      },
    });
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(bima.anakalypsi).not.toHaveBeenCalled();
    expect(p.sfalmes[0]?.minima).toContain('μοντέλο');
  });

  it('σφάλμα στο --json είναι μία εγγραφή JSON με ok=false', async () => {
    const p = parastates();
    bima.programma.mockResolvedValue(apotyxia('PROYPOLOGISMOS', 'ξεπεράστηκε το ημερήσιο όριο'));
    const kodikos = await p.trexe(['programma', '--json']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(p.grammes).toHaveLength(1);
    const dedomena: unknown = JSON.parse(p.grammes[0] as string);
    expect(dedomena).toMatchObject({
      ok: false,
      sfalma: { kodikos: 'PROYPOLOGISMOS' },
    });
  });
});

describe('χρήση CLI', () => {
  it('άγνωστη εντολη → exit 1 με υπενθύμιση, χωρίς βήματα', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['tsekaraki']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(p.sfalmes[0]?.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(p.sfalmes[0]?.minima).toContain('tsekaraki');
    expect(bima.anakalypsi).not.toHaveBeenCalled();
  });

  it('καμία εντολή → exit 1 και εμφανίζει τη χρήση', async () => {
    const p = parastates();
    const kodikos = await p.trexe([]);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(p.sfalmes[0]?.minima).toContain('dps-guide');
  });

  it('--help → exit 0, χρήση στο stdout και κανένα βήμα', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['--help']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(p.sfalmes).toHaveLength(0);
    const oles = p.grammes.join('\n');
    expect(oles).toContain('dps-guide');
    for (const onoma of ['syndesi', 'mathimata', 'sygxronismos', 'analysi', 'odigos', 'programma', 'run']) {
      expect(oles).toContain(onoma);
    }
    expect(bima.anakalypsi).not.toHaveBeenCalled();
  });

  it('-h λειτουργεί όπως το --help', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['-h']);
    expect(kodikos).toBe(KODIKOS_OK);
    expect(p.grammes.join('\n')).toContain('dps-guide');
  });

  it('παράθετο όρισμα σε εντολή χωρίς ορίσματα → exit 1', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['mathimata', 'MATH101']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(bima.anakalypsi).not.toHaveBeenCalled();
  });

  it('πολλά ορίσματα σε εντολή με ένα → exit 1', async () => {
    const p = parastates();
    const kodikos = await p.trexe(['analysi', 'MATH101', 'MATH202']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(bima.trekse_analysi).not.toHaveBeenCalled();
  });

  it('το --riza φτάνει στη δημιουργία ports', async () => {
    const p = parastates();
    let pare_received: string | null = null;
    const kodikos = await trexe_entoles(['mathimata', '--riza', './自定义'], {
      dimiourgise_eisodos: async (parastates_entolhs) => {
        pare_received = parastates_entolhs.riza;
        return ok(p.eisodos);
      },
      eksodosi: {
        grapse_grammi: (grammi) => p.grammes.push(grammi),
        grapse_sfalma: (sfalma) => p.sfalmes.push(sfalma),
      },
    });
    expect(kodikos).toBe(KODIKOS_OK);
    expect(pare_received).toBe('./自定义');
  });

  it('το --montelo φτάνει στη δημιουργία ports', async () => {
    const p = parastates();
    let pare_received: string | null = null;
    await trexe_entoles(['run', '--montelo', MONTELO], {
      dimiourgise_eisodos: async (parastates_entolhs) => {
        pare_received = parastates_entolhs.montelo;
        return ok(p.eisodos);
      },
      eksodosi: {
        grapse_grammi: (grammi) => p.grammes.push(grammi),
        grapse_sfalma: (sfalma) => p.sfalmes.push(sfalma),
      },
    });
    expect(pare_received).toBe(MONTELO);
  });
});

describe('αναφορά σφαλμάτων', () => {
  it('ο κώδικας σφάλματος δεν εμφανίζεται ποτέ ως undefined', async () => {
    const p = parastates();
    bima.anakalypsi.mockResolvedValue({ ok: false } as unknown as Apotelesma<Mathima[]>);
    const kodikos = await p.trexe(['mathimata']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(p.sfalmes[0]?.kodikos).not.toBeUndefined();
  });

  it('καταρρέει με άγνωστη δομή σφάλματος αλλά δεν πετάει έξω', async () => {
    const p = parastates();
    bima.anakalypsi.mockResolvedValue({ ok: false, sfalma: 'μην είναι αντικείμενο' } as unknown as Apotelesma<Mathima[]>);
    const kodikos = await p.trexe(['mathimata']);
    expect(kodikos).toBe(KODIKOS_SFALMA);
    expect(p.sfalmes[0]?.kodikos).toBe('AGNOSTO');
  });
});
