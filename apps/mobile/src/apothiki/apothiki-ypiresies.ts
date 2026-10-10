import type { ApothikiPyli, Apotelesma } from '@dps/core';
import type { Rytheseis, Proodhos } from './apothiki-typoi.js';
import { DIALOMI_RYTHMISEON, dialomos_proodhou } from './apothiki-typoi.js';
import { PROEDAFO_TEMPLATE } from '../programma/programma-vohthia.js';

/** Προσωρινές προεπιλογές όσο δεν υπάρχει αποθηκευμένο αρχείο — τιμές παραδείγματος, όχι hardcoded μέσα στην οθόνη. */
export function proedapes_rytheseis(): Rytheseis {
  return {
    baseUrl: 'https://thales.cs.unipi.gr',
    mathimataSynch: [],
    onomaMontelou: 'gemini-2.5-flash',
    exeiKleidiLlm: false,
    onomasApothikefsis: 'Documents/DPS.guide',
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
  return anagnose ?? proedapes_rytheseis();
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
  const neosProodhos: Proodhos = { aristeiesEnotiton: nees };
  await grapse_proodho(apothiki, kodikos, neosProodhos);
  return neosProodhos;
}