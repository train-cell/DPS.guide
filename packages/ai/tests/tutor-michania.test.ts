import { describe, expect, it } from 'vitest';
import { MockLlm } from '@dps/core';
import { prompt_tutor } from '../src/prompts/index.js';
import {
  FRASIS_ANESTIXTORI,
  FRASIS_DEN_MPORO_EPALITHEUSO,
  FRASIS_KATHODIGISI_ASKISIS,
  MEGISTES_KALLES_ERGALEION,
  PLIO_MESOI_ISTORIKOU,
  ftiaxe_michania_tutor,
  pram_ena_erotisi,
  zitisei_teleia_lusi,
} from '../src/tutor/index.js';
import type { EisodosStrih } from '../src/tutor/index.js';
import { ftiaxe_enotita } from './voitheia.js';
import {
  IchososKatagrafi,
  IerosErgaleia,
  ODIGOS_ENOTITAS_1,
  SkribinioLlm,
  apantisi_leitourgias,
  ergaleia_mathimatos,
  erotisi_arithmiki,
} from './tutor-voitheia.js';

const PARAPOMPI_SELIDA_2 = { arxeio_id: 'arx-1', selida: 2 };
const PARAPOMPI_SELIDA_4 = { arxeio_id: 'arx-1', selida: 4 };

function eisodos_strih(epateseis: Partial<EisodosStrih> = {}): EisodosStrih {
  return {
    enotita: ftiaxe_enotita(),
    odigos: ODIGOS_ENOTITAS_1,
    istoriko: [],
    leitourgia: 'exigisi',
    erotisi: 'Τι είναι λίστα;',
    ...epateseis,
  };
}

function periballon(llm: SkribinioLlm) {
  return {
    llm,
    ergaleia: new IerosErgaleia(ergaleia_mathimatos()),
    katagrafi: new IchososKatagrafi(),
  };
}

function metrisi_erotiseon(apantisi: string): number {
  const simvola = ['?', '\u037E'];
  return simvola.reduce((plithos, simvolo) => plithos + apantisi.split(simvolo).length - 1, 0);
}

describe('tutor — λειτουργίες του P4', () => {
  it('exigisi: απαντά grounded με παραπομπές και κρατά το ιστορικό', async () => {
    const eisodos = eisodos_strih({ leitourgia: 'exigisi' });
    const llm = new MockLlm();
    llm.orise_json(
      prompt_tutor(eisodos).xristis,
      apantisi_leitourgias({
        apantisi: 'Λίστα είναι ακολουθία στοιχείων. [[arx-1:2]]',
        parapompes: [PARAPOMPI_SELIDA_2],
      })
    );
    const michania = ftiaxe_michania_tutor({
      llm,
      ergaleia: ergaleia_mathimatos(),
      katagrafi: new IchososKatagrafi(),
    });

    const apotelesma = await michania.strih(eisodos);

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.apantisi).toBe('Λίστα είναι ακολουθία στοιχείων. [[arx-1:2]]');
    expect(apotelesma.timi.parapompes).toEqual([PARAPOMPI_SELIDA_2]);
    expect(apotelesma.timi.istoriko).toEqual([
      { rolos: 'xristis', keimeno: 'Τι είναι λίστα;' },
      { rolos: 'montelo', keimeno: 'Λίστα είναι ακολουθία στοιχείων. [[arx-1:2]]' },
    ]);
  });

  it('exigisi: στέλνει στο μοντέλο το prompt P4 της ενότητας', async () => {
    const llm = new SkribinioLlm([apantisi_leitourgias()]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    await michania.strih(eisodos_strih({ leitourgia: 'exigisi' }));

    expect(llm.zitiseis[0]).toBe(prompt_tutor(eisodos_strih({ leitourgia: 'exigisi' })).xristis);
  });

  it('exetasi_me: ρωτά μία και μόνο μία ερώτηση ανά στροφή', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'exetasi_me',
        apantisi: 'Ποια είναι η λίστα\u037E Πώς δημιουργείται\u037E Τι περιέχει\u037E',
        parapompes: [PARAPOMPI_SELIDA_2],
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(eisodos_strih({ leitourgia: 'exetasi_me' }));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.apantisi).toBe('Ποια είναι η λίστα\u037E');
    expect(metrisi_erotiseon(apotelesma.timi.apantisi)).toBe(1);
  });

  it('exetasi_me: αξιολογεί την απάντηση με παραπομπή, ακόμη κι αν το μοντέλο δεν έδωσε', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'exetasi_me',
        apantisi: 'Σωστό, ακολουθία στοιχείων.',
        parapompes: [],
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(
      eisodos_strih({ leitourgia: 'exetasi_me', erotisi: 'ναι', xekimena_erotisi: erotisi_arithmiki() })
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.apantisi).toBe('Σωστό, ακολουθία στοιχείων.');
    expect(apotelesma.timi.parapompes).toEqual([PARAPOMPI_SELIDA_4]);
    expect(apotelesma.timi.xekimena_erotisi).toBeNull();
  });

  it('kathodigisi_askisis: δίνει υποδείξεις και όχι πλήρη λύση', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'kathodigisi_askisis',
        erotisi: 'Βοήθα με την άσκηση 3.',
        apantisi: 'Η λύση είναι 42.',
        apantisi_teleia_lusi: true,
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(
      eisodos_strih({ leitourgia: 'kathodigisi_askisis', erotisi: 'Βοήθα με την άσκηση 3.' })
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.apantisi).toBe(FRASIS_KATHODIGISI_ASKISIS);
    expect(apotelesma.timi.apantisi).not.toContain('42');
    expect(apotelesma.timi.parapompes).toEqual([]);
  });

  it('kathodigisi_askisis: δίνει την πλήρη λύση όταν ζητηθεί ρητά', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'kathodigisi_askisis',
        apantisi: 'Η λύση είναι 42. [[arx-1:5]]',
        apantisi_teleia_lusi: true,
        parapompes: [{ arxeio_id: 'arx-1', selida: 5 }],
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(
      eisodos_strih({
        leitourgia: 'kathodigisi_askisis',
        erotisi: 'δείξε μου τη λύση της άσκησης 3',
      })
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.apantisi).toBe('Η λύση είναι 42. [[arx-1:5]]');
  });

  it('kathodigisi_askisis: περνά ανέπαφο τις υποδείξεις που δεν είναι λύση', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'kathodigisi_askisis',
        erotisi: 'Από πού ξεκινάω;',
        apantisi: 'Ξεκίνα από τον ορισμό του δείκτη.',
        apantisi_teleia_lusi: false,
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(
      eisodos_strih({ leitourgia: 'kathodigisi_askisis', erotisi: 'Από πού ξεκινάω;' })
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.apantisi).toBe('Ξεκίνα από τον ορισμό του δείκτη.');
  });
});

describe('tutor — φρουροί grounded', () => {
  it('η ασφαλιστική φράση είναι αυτή που ζητά το §7.1', () => {
    expect(FRASIS_ANESTIXTORI).toBe('Δεν υπάρχει στο υλικό');
    expect(FRASIS_DEN_MPORO_EPALITHEUSO).toBe('δεν μπορώ να επαληθεύσω');
  });

  it('απαντά «Δεν υπάρχει στο υλικό» και κόβει τις παραπομπές', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        exexigmeni: false,
        apantisi: 'Ο συγγραφέας έγραψε το βιβλίο του το 1997.',
        parapompes: [{ arxeio_id: 'arx-2', selida: 3 }],
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(eisodos_strih({ erotisi: 'Ποιος έγραψε το βιβλίο;' }));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.apantisi).toBe('Δεν υπάρχει στο υλικό');
    expect(apotelesma.timi.parapompes).toEqual([]);
  });
});

describe('tutor — βρόχος εργαλείων', () => {
  it('εκτελεί την anoixe_selida με τα ορίσματα του μοντέλου και τροφοδοτεί το αποτέλεσμα', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        ergaleio: { onoma: 'anoixe_selida', arguments: { arxeio_id: 'arx-1', selida: 4 } },
        apantisi: '',
        parapompes: [],
      }),
      apantisi_leitourgias({
        apantisi: 'Ο δείκτης δείχνει πόσα στοιχεία δείχνουν στον πίνακα.',
        parapompes: [PARAPOMPI_SELIDA_4],
      }),
    ]);
    const periballon_ergaleiou = periballon(llm);
    const michania = ftiaxe_michania_tutor(periballon_ergaleiou);

    const apotelesma = await michania.strih(eisodos_strih({ erotisi: 'Τι κάνει ο δείκτης;' }));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(periballon_ergaleiou.ergaleia.kalles).toEqual([
      { onoma: 'anoixe_selida', orismata: { arxeio_id: 'arx-1', selida: 4 } },
    ]);
    expect(llm.zitiseis[1]).toContain('Αποτέλεσμα εργαλείου anoixe_selida');
    expect(llm.zitiseis[1]).toContain('Ο δείκτης δείχνει πόσα στοιχεία δείχνουν');
    expect(apotelesma.timi.kalles_ergaleion).toEqual([
      { onoma_zitisis: 'anoixe_selida', ektelestike: true, parapompi: PARAPOMPI_SELIDA_4 },
    ]);
    expect(apotelesma.timi.ereges_ergaleion).toEqual([]);
  });

  it('εκτελεί την vres_ennoia και τροφοδοτεί τον ορισμό', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        ergaleio: { onoma: 'vres_ennoia', arguments: { ennoia: 'λίστα' } },
        apantisi: '',
        parapompes: [],
      }),
      apantisi_leitourgias(),
    ]);
    const periballon_ergaleiou = periballon(llm);
    const michania = ftiaxe_michania_tutor(periballon_ergaleiou);

    const apotelesma = await michania.strih(eisodos_strih({ erotisi: 'Τι είναι λίστα;' }));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(periballon_ergaleiou.ergaleia.kalles[0]).toEqual({
      onoma: 'vres_ennoia',
      orismata: { ennoia: 'λίστα' },
    });
    expect(llm.zitiseis[1]).toContain('Λίστα είναι ακολουθία στοιχείων.');
  });

  it('κρατά την ερώτηση του εργαλείου ως εκκρεμή για την επόμενη στροφή', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'exetasi_me',
        ergaleio: { onoma: 'ftiaxe_erotisi', arguments: { enotita_id: 'enotita-1' } },
        apantisi: '',
        parapompes: [],
      }),
      apantisi_leitourgias({
        leitourgia: 'exetasi_me',
        apantisi: 'Ποια είναι η μέση τιμή;',
        parapompes: [PARAPOMPI_SELIDA_4],
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(
      eisodos_strih({ leitourgia: 'exetasi_me', erotisi: 'Δώσε μου μια άσκηση.' })
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.xekimena_erotisi?.apantisi_dekdomeni).toBe('3.14');
  });

  it('άγνωστο όνομα εργαλείου: ρητό σφάλμα, καμία κλήση στο εργαλείο, ο βρόχος συνεχίζεται', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        ergaleio: { onoma: 'agios_eis', arguments: {} },
        apantisi: '',
        parapompes: [],
      }),
      apantisi_leitourgias({ apantisi: 'Δεν χρειάζεται εργαλείο.' }),
    ]);
    const periballon_ergaleiou = periballon(llm);
    const michania = ftiaxe_michania_tutor(periballon_ergaleiou);

    const apotelesma = await michania.strih(eisodos_strih({ erotisi: 'Άνοιξε τη σελίδα 4.' }));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(periballon_ergaleiou.ergaleia.kalles).toEqual([]);
    expect(apotelesma.timi.ereges_ergaleion).toEqual([
      {
        onoma_zitisis: 'agios_eis',
        kodikos: 'MI_EGKYRO_SXIMA',
        minima: 'Μη έγκυρο αίτημα εργαλείου από το μοντέλο',
      },
    ]);
    expect(apotelesma.timi.kalles_ergaleion).toEqual([]);
    expect(llm.zitiseis[1]).toContain('Σφάλμα εργαλείου agios_eis');
    expect(apotelesma.timi.apantisi).toBe('Δεν χρειάζεται εργαλείο.');
  });

  it('ορίσματα λάθους τύπου: ρητό σφάλμα χωρίς μερική κατάσταση', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        ergaleio: { onoma: 'anoixe_selida', arguments: { arxeio_id: 'arx-1', selida: 'τέσσερα' } },
        apantisi: '',
        parapompes: [],
      }),
      apantisi_leitourgias(),
    ]);
    const periballon_ergaleiou = periballon(llm);
    const michania = ftiaxe_michania_tutor(periballon_ergaleiou);

    const apotelesma = await michania.strih(eisodos_strih({ erotisi: 'Άνοιξε τη σελίδα 4.' }));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(periballon_ergaleiou.ergaleia.kalles).toEqual([]);
    expect(apotelesma.timi.ereges_ergaleion[0]?.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(apotelesma.timi.kalles_ergaleion).toEqual([]);
  });

  it('σφάλμα του ίδιου του εργαλείου καταγράφεται και δίνεται πίσω στο μοντέλο', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        ergaleio: { onoma: 'anoixe_selida', arguments: { arxeio_id: 'arx-9', selida: 1 } },
        apantisi: '',
        parapompes: [],
      }),
      apantisi_leitourgias(),
    ]);
    const periballon_ergaleiou = periballon(llm);
    const michania = ftiaxe_michania_tutor(periballon_ergaleiou);

    const apotelesma = await michania.strih(eisodos_strih({ erotisi: 'Άνοιξε τη σελίδα 1.' }));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.ereges_ergaleion[0]?.kodikos).toBe('DEN_VRETHIKE');
    expect(llm.zitiseis[1]).toContain('Σφάλμα εργαλείου anoixe_selida');
  });

  it('σταματά στο όριο κλήσεων εργαλείων ανά στροφή', async () => {
    const zitisi = apantisi_leitourgias({
      ergaleio: { onoma: 'vres_ennoia', arguments: { ennoia: 'λίστα' } },
      apantisi: '',
      parapompes: [],
    });
    const llm = new SkribinioLlm(
      Array.from({ length: MEGISTES_KALLES_ERGALEION + 1 }, () => zitisi)
    );
    const periballon_ergaleiou = periballon(llm);
    const michania = ftiaxe_michania_tutor(periballon_ergaleiou);

    const apotelesma = await michania.strih(eisodos_strih({ erotisi: 'Τι είναι λίστα;' }));

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('PROYPOLOGISMOS');
    expect(periballon_ergaleiou.ergaleia.kalles).toHaveLength(MEGISTES_KALLES_ERGALEION);
    expect(llm.zitiseis).toHaveLength(MEGISTES_KALLES_ERGALEION + 1);
  });
});

describe('tutor — κανόνας 50/50 στα αριθμητικά', () => {
  it('η σύγκριση αρθρώνεται από τον κώδικα, ακόμη κι αν το μοντέλο λέει λάθος', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'exetasi_me',
        apantisi: 'Θα σε διορθώσω, η απάντηση είναι λάθος.',
        symkrisi_arithmetikis: 'lathos',
        parapompes: [],
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(
      eisodos_strih({ leitourgia: 'exetasi_me', erotisi: '3,14', xekimena_erotisi: erotisi_arithmiki() })
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.symkrisi_arithmetikis?.poreia).toBe('sosto');
    expect(apotelesma.timi.parapompes).toEqual([PARAPOMPI_SELIDA_4]);
    expect(llm.zitiseis[0]).toContain('πόρισμα: sosto');
    expect(llm.zitiseis[0]).toContain('Η κρίση είναι οριστική');
  });

  it('κρίνει λάθος όταν η απάντηση διαφέρει από την τιμή του υλικού', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'exetasi_me',
        apantisi: 'Όχι, η σωστή τιμή είναι άλλη.',
        symkrisi_arithmetikis: 'sosto',
        parapompes: [],
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(
      eisodos_strih({ leitourgia: 'exetasi_me', erotisi: '7', xekimena_erotisi: erotisi_arithmiki() })
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.symkrisi_arithmetikis?.poreia).toBe('lathos');
  });

  it('δεν βαθμολογεί ποτέ τιμή που λείπει από το υλικό', async () => {
    const erotisi = { ...erotisi_arithmiki(), apantisi_dekdomeni: '42' };
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'exetasi_me',
        apantisi: 'Η απάντησή σου είναι σωστή!',
        symkrisi_arithmetikis: 'sosto',
        parapompes: [{ arxeio_id: 'arx-1', selida: 9 }],
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(
      eisodos_strih({ leitourgia: 'exetasi_me', erotisi: '42', xekimena_erotisi: erotisi })
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.apantisi).toBe('δεν μπορώ να επαληθεύσω');
    expect(apotelesma.timi.parapompes).toEqual([]);
    expect(apotelesma.timi.symkrisi_arithmetikis?.poreia).toBe('den_epalythevomene');
  });

  it('αγνοεί την κρίση του μοντέλου όταν η απάντηση δεν είναι καθαρός αριθμός', async () => {
    const llm = new SkribinioLlm([
      apantisi_leitourgias({
        leitourgia: 'exetasi_me',
        apantisi: 'Κατάλαβα τι εννοείς.',
        symkrisi_arithmetikis: 'sosto',
        parapompes: [],
      }),
    ]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(
      eisodos_strih({
        leitourgia: 'exetasi_me',
        erotisi: 'νομίζω πως είναι 3,14',
        xekimena_erotisi: erotisi_arithmiki(),
      })
    );

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(apotelesma.timi.symkrisi_arithmetikis).toBeNull();
    expect(llm.zitiseis[0]).not.toContain('πόρισμα');
  });
});

describe('tutor — αντοχή και ντετερμινισμός', () => {
  it('μεταδίδει τη σφάλμα του μοντέλου χωρίς να το κρύψει', async () => {
    const llm = new SkribinioLlm([]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(eisodos_strih());

    expect(apotelesma.ok).toBe(false);
    if (apotelesma.ok) {
      return;
    }
    expect(apotelesma.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('κόβει το ιστορικό στο prompt αλλά το επιστρέφει ολόκληρο', async () => {
    const istoriko = Array.from({ length: PLIO_MESOI_ISTORIKOU + 4 }, (_, i) => ({
      rolos: 'xristis' as const,
      keimeno: `μήνυμα-${i}`,
    }));
    const llm = new SkribinioLlm([apantisi_leitourgias()]);
    const michania = ftiaxe_michania_tutor(periballon(llm));

    const apotelesma = await michania.strih(eisodos_strih({ istoriko: istoriko }));

    expect(apotelesma.ok).toBe(true);
    if (!apotelesma.ok) {
      return;
    }
    expect(llm.zitiseis[0]).not.toContain('μήνυμα-0');
    expect(llm.zitiseis[0]).toContain(`μήνυμα-${istoriko.length - 1}`);
    expect(apotelesma.timi.istoriko).toHaveLength(istoriko.length + 2);
  });

  it('είναι ντετερμινιστικό για πανομοιότυπη είσοδο', async () => {
    const script = [
      apantisi_leitourgias({
        ergaleio: { onoma: 'ftiaxe_erotisi', arguments: { enotita_id: 'enotita-1' } },
        leitourgia: 'exetasi_me',
        apantisi: 'Ποια είναι η μέση τιμή;',
        parapompes: [PARAPOMPI_SELIDA_4],
      }),
      apantisi_leitourgias({
        leitourgia: 'exetasi_me',
        apantisi: 'Η απάντησή σου είναι σωστή.',
        symkrisi_arithmetikis: 'sosto',
        parapompes: [],
      }),
    ];
    async function trexei_ena_rolo(): Promise<unknown> {
      const llm = new SkribinioLlm(script);
      const michania = ftiaxe_michania_tutor(periballon(llm));
      const peryti = await michania.strih(
        eisodos_strih({ leitourgia: 'exetasi_me', erotisi: 'Δώσε μου μια άσκηση.' })
      );
      const apokrisi = await michania.strih(
        eisodos_strih({
          leitourgia: 'exetasi_me',
          erotisi: '3,14',
          istoriko: peryti.ok ? peryti.timi.istoriko : [],
          xekimena_erotisi: peryti.ok ? peryti.timi.xekimena_erotisi : null,
        })
      );
      return { peryti, apokrisi };
    }

    expect(await trexei_ena_rolo()).toEqual(await trexei_ena_rolo());
  });
});

describe('tutor — καθαροί κανόνες κειμένου', () => {
  it('κρατά μόνο την πρώτη ερώτηση', () => {
    expect(pram_ena_erotisi('Πρώτη\u037E Δεύτερη\u037E')).toBe('Πρώτη\u037E');
    expect(pram_ena_erotisi('Χωρίς ερώτηση')).toBe('Χωρίς ερώτηση');
  });

  it('αναγνωρίζει ρητό αίτημα για την πλήρη λύση', () => {
    expect(zitisei_teleia_lusi('δείξε μου τη λύση')).toBe(true);
    expect(zitisei_teleia_lusi('Βοήθα με την άσκηση')).toBe(false);
  });
});