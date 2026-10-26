import type { ApothikiPyli, Apotelesma, Checkin, KatastasiMathisis } from '@dps/core';
import { add_imeres, arxikopoiisi_mathisis, katagrafe_apotelesma, parse_meri } from '@dps/core';
import type { Rytheseis, Proodhos } from './apothiki-typoi.js';
import { DIALOMI_RYTHMISEON, dialomos_proodhou } from './apothiki-typoi.js';
import { PROEDAFO_TEMPLATE } from '../programma/programma-vohthia.js';
import { migrateGeminiModel, PROEPILOGI_GEMINI_MONTELO } from '../ypiresies/ai-models.js';
import { entopise_paroxo_montelou } from '../ypiresies/ai-providers.js';

/** Προσωρινές προεπιλογές όσο δεν υπάρχει αποθηκευμένο αρχείο — τιμές παραδείγματος, όχι hardcoded μέσα στην οθόνη. */
export function proedapes_rytheseis(): Rytheseis {
  return {
    baseUrl: '',
    themaId: 'midnight',
    mathimataSynch: [],
    onomaMontelou: PROEPILOGI_GEMINI_MONTELO,
    paroxosLlm: 'gemini',
    urlOllama: 'http://localhost:11434',
    exeiKleidiLlm: false,
    einaiEidopoieseis: true,
    exetaseis: [],
    arxiExetastikis: null,
    templateLepton: PROEDAFO_TEMPLATE,
    overridesLepton: [],
  };
}

/** Προσωρινή πρόοδος (κενή) για μάθημα χωρίς αποθηκευμένο αρχείο. */
export function proedapes_proodhou(): Proodhos {
  return { aristeiesEnotiton: [] };
}

function anagnose_json<T>(keimeno: string): T | null {
  try {
    return JSON.parse(keimeno) as T;
  } catch {
    return null;
  }
}

/** Διαβάζει τις ρυθμίσεις από τη θύρα αποθήκευσης· αν λείπουν ή είναι χαλασμένες, δίνει τις προεπιλογές. */
export async function fortose_rytheseis(apothiki: ApothikiPyli): Promise<Rytheseis> {
  const diavase = await apothiki.diavase_keimeno(DIALOMI_RYTHMISEON);
  if (!diavase.ok) {
    return proedapes_rytheseis();
  }
  const anagnose = anagnose_json<Rytheseis>(diavase.timi);
  if (anagnose === null) return proedapes_rytheseis();
  const onomaMontelou =
    typeof anagnose.onomaMontelou === 'string' && anagnose.onomaMontelou.trim()
      ? migrateGeminiModel(anagnose.onomaMontelou.trim())
      : PROEPILOGI_GEMINI_MONTELO;
  return {
    ...anagnose,
    onomaMontelou,
    paroxosLlm:
      anagnose.paroxosLlm === 'gemini' || anagnose.paroxosLlm === 'ollama'
        ? anagnose.paroxosLlm
        : entopise_paroxo_montelou(onomaMontelou),
  };
}

/** Αποθηκεύει τις ρυθμίσεις στη θύρα αποθήκευσης. */
export async function grapse_rytheseis(apothiki: ApothikiPyli, rytheseis: Rytheseis): Promise<Apotelesma<void>> {
  return apothiki.grapse_keimeno(DIALOMI_RYTHMISEON, JSON.stringify(rytheseis, null, 2));
}

/** Διαβάζει την πρόοδο ενός μαθήματος· αν λείπει, δίνει κενή πρόοδο. */
export async function fortose_proodho(apothiki: ApothikiPyli, kodikos: string): Promise<Proodhos> {
  const diadromi = dialomos_proodhou(kodikos);
  const diavase = await apothiki.diavase_keimeno(diadromi);
  if (!diavase.ok) {
    return proedapes_proodhou();
  }
  const anagnose = anagnose_json<Proodhos>(diavase.timi);
  return anagnose ?? proedapes_proodhou();
}

/** Γράφει την πρόοδο ενός μαθήματος. */
export async function grapse_proodho(
  apothiki: ApothikiPyli,
  kodikos: string,
  proodhos: Proodhos
): Promise<Apotelesma<void>> {
  return apothiki.grapse_keimeno(dialomos_proodhou(kodikos), JSON.stringify(proodhos, null, 2));
}

/** Επιστρέφει την ενημερωμένη πρόοδο αφού προστεθεί ή αφαιρεθεί μια ενότητα. */
export async function allaxe_aristeia(
  apothiki: ApothikiPyli,
  kodikos: string,
  enotitaId: string,
  telia: boolean
): Promise<Proodhos> {
  const trexousa = await fortose_proodho(apothiki, kodikos);
  const yparxei = trexousa.aristeiesEnotiton.includes(enotitaId);
  let nees: string[];
  if (telia && !yparxei) {
    nees = [...trexousa.aristeiesEnotiton, enotitaId];
  } else if (!telia && yparxei) {
    nees = trexousa.aristeiesEnotiton.filter((id) => id !== enotitaId);
  } else {
    nees = [...trexousa.aristeiesEnotiton];
  }
  const neosProodhos: Proodhos = { ...trexousa, aristeiesEnotiton: nees };
  await grapse_proodho(apothiki, kodikos, neosProodhos);
  return neosProodhos;
}

/**
 * Καταγράφει απάντηση Leitner για μία έννοια μαθήματος και αποθηκεύει την πρόοδο στο proodhos.json.
 */
export async function katagrapse_leitner_apantisi(
  apothiki: ApothikiPyli,
  kodikosMathimatos: string,
  ennoia: string,
  sosto: boolean,
  simera: string
): Promise<Apotelesma<KatastasiMathisis[]>> {
  const trexousa = await fortose_proodho(apothiki, kodikosMathimatos);
  let katastaseis: KatastasiMathisis[] = trexousa.katastasiMathisis
    ? [...trexousa.katastasiMathisis]
    : [];

  if (!katastaseis.some((k) => k.ennoia === ennoia)) {
    const arxiko = arxikopoiisi_mathisis([ennoia], simera);
    if (!arxiko.ok) {
      return arxiko;
    }
    katastaseis = [...katastaseis, ...arxiko.timi];
  }

  const apotelesma = katagrafe_apotelesma(katastaseis, ennoia, sosto, simera);
  if (!apotelesma.ok) {
    return apotelesma;
  }

  const neaProodhos: Proodhos = {
    ...trexousa,
    katastasiMathisis: apotelesma.timi,
  };
  const grapse = await grapse_proodho(apothiki, kodikosMathimatos, neaProodhos);
  if (!grapse.ok) {
    return grapse;
  }

  return apotelesma;
}

/**
 * Καταγράφει ένα check-in μελέτης για μία ενότητα μαθήματος στο proodhos.json
 * και ενημερώνει τις αριστείες ενοτήτων αν η μελέτη ολοκληρώθηκε.
 */
export async function katagrapse_checkin(
  apothiki: ApothikiPyli,
  kodikosMathimatos: string,
  enotitaId: string,
  lepta: number,
  oloklirothike: boolean,
  imerominia: string
): Promise<Proodhos> {
  const trexousa = await fortose_proodho(apothiki, kodikosMathimatos);
  const neoCheckin: Checkin = {
    enotita_id: enotitaId,
    imerominia,
    pragmatika_lepta: lepta,
    oloklirothike,
  };
  const checkins: Checkin[] = [...(trexousa.checkins ?? []), neoCheckin];

  let aristeiesEnotiton = [...trexousa.aristeiesEnotiton];
  if (oloklirothike && !aristeiesEnotiton.includes(enotitaId)) {
    aristeiesEnotiton = [...aristeiesEnotiton, enotitaId];
  }

  const neaProodhos: Proodhos = {
    ...trexousa,
    aristeiesEnotiton,
    checkins,
  };

  await grapse_proodho(apothiki, kodikosMathimatos, neaProodhos);
  return neaProodhos;
}

/**
 * Υπολογίζει το τρέχον συνεχόμενο σερί ημερών μελέτης (streak) βάσει των check-ins.
 * Καθαρή, ντετερμινιστική συνάρτηση (50/50 boundary).
 */
export function ypologismos_seri_meletis(
  checkins: readonly Checkin[],
  simera: string
): number {
  if (!checkins || checkins.length === 0) {
    return 0;
  }
  const meri = parse_meri(simera);
  if (meri === null) {
    return 0;
  }

  const imerominies = new Set<string>();
  for (const c of checkins) {
    if (c.imerominia) {
      imerominies.add(c.imerominia);
    }
  }

  let arxiOffset = 0;
  if (imerominies.has(simera)) {
    arxiOffset = 0;
  } else {
    const xthes = add_imeres(meri, -1);
    if (imerominies.has(xthes)) {
      arxiOffset = 1;
    } else {
      return 0;
    }
  }

  let seri = 0;
  let offset = arxiOffset;
  while (true) {
    const imera = add_imeres(meri, -offset);
    if (imerominies.has(imera)) {
      seri++;
      offset++;
    } else {
      break;
    }
  }

  return seri;
}
