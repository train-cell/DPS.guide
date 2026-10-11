/**
 * Βήμα 9 (§4): συνομιλία tutor (LLM) → `synomilies/<enotita_id>.jsonl`.
 *
 * Η ίδια η μηχανή στροφής (εργαλεία, σύγκριση αριθμητικής, προστασία από
 * επινόηση) είναι του `@dps/ai` (T1)· εδώ γράφεται ΜΟΝΟ η μορφή του jsonl και η
 * ανάγνωση/εγγραφή του ιστορικού. Το LLM ΔΕΝ βαθμολογεί αριθμητικές απαντήσεις
 * (§7.1 P4, 50/50 boundary).
 */

import type { Apotelesma, Enotita, Parapompi, Selida } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import type { LeitourgiaTutor, MinimaIstorikou, StrihTutor } from '@dps/ai';
import { ftiaxe_ergaleia_tutor, ftiaxe_michania_tutor } from '@dps/ai';
import type { ErotisiAskisis, PerigraphiEnnoia } from '@dps/ai';
import type { EisodosPipeline } from '../porte.js';
import { arxeio_odigou, arxeio_synomilias, me_riza } from '../statheroi.js';
import { analysise_json, diavase_keimeno, diavase_xarti } from '../grammata/apothiki-json.js';
import { vres_mathima_apo_enotita } from '../grammata/ves.js';

/** Μία γραμμή του `synomilies/<enotita_id>.jsonl` (§5.3). */
export interface GrammaSynomilias {
  readonly rolos: 'xristis' | 'montelo';
  readonly keimeno: string;
  readonly imerominia: string;
  readonly leitourgia: LeitourgiaTutor;
  readonly parapompes: readonly Parapompi[];
}

/** Αίτημα μιας στροφής του tutor. */
export interface AitisiTutor {
  readonly enotita_id: string;
  readonly erotisi: string;
  readonly leitourgia: LeitourgiaTutor;
  /** Εκκρεμής ερώτηση άσκησης για deterministic σύγκριση αριθμητικής. */
  readonly xekimena_erotisi?: ErotisiAskisis | null;
}

/**
 * Βήμα 9: μία στροφή συνομιλίας, με επιμονή στο jsonl.
 *
 * ΥΠΟΓΡΑΦΗ `(p, aitisi)`: το μάθημα εντοπίζεται από τους χάρτες, όπως στο `odigos`
 * (το `srixi_tutor` δεν υπήρχε στο κοινό συμβόλαιο — προσθέτως δεν σπάει τίποτα).
 */
export async function srixi_tutor(
  p: EisodosPipeline,
  aitisi: AitisiTutor
): Promise<Apotelesma<StrihTutor>> {
  const kodikos_mathimatos = await vres_mathima_apo_enotita(p, aitisi.enotita_id);
  if (!kodikos_mathimatos.ok) {
    return kodikos_mathimatos;
  }
  return srixi_tutor_mathimatos(p, kodikos_mathimatos.timi, aitisi);
}

/** Παραλλαγή με ρητό κωδικό μαθήματος. */
export async function srixi_tutor_mathimatos(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  aitisi: AitisiTutor
): Promise<Apotelesma<StrihTutor>> {
  const enotita = await vres_enotita(p, kodikos_mathimatos, aitisi.enotita_id);
  if (!enotita.ok) {
    return enotita;
  }

  const odigos = await p.apothiki.diavase_keimeno(
    me_riza(p.riza, arxeio_odigou(kodikos_mathimatos, aitisi.enotita_id))
  );
  if (!odigos.ok) {
    p.katagrafi.sfalma('tutor: ο οδηγός της ενότητας δεν υπάρχει', {
      kodikos_mathimatos,
      enotita_id: aitisi.enotita_id,
    });
    return apotyxia(
      'DEN_VRETHIKE',
      `Ο οδηγός της ενότητας «${aitisi.enotita_id}» δεν έχει παραχθεί· τρέξε πρώτα το βήμα odigos`
    );
  }

  const istoriko = await diavase_istoriko(p, kodikos_mathimatos, aitisi.enotita_id);
  if (!istoriko.ok) {
    return istoriko;
  }

  const uliko = await fere_uliko_tutor(p, kodikos_mathimatos, enotita.timi);
  if (!uliko.ok) {
    return uliko;
  }

  const michania = ftiaxe_michania_tutor({
    llm: p.llm,
    ergaleia: ftiaxe_ergaleia_tutor(uliko.timi),
    katagrafi: p.katagrafi,
  });

  const strih = await michania.strih({
    enotita: enotita.timi,
    odigos: odigos.timi,
    istoriko: istoriko.timi,
    leitourgia: aitisi.leitourgia,
    erotisi: aitisi.erotisi,
    xekimena_erotisi: aitisi.xekimena_erotisi ?? null,
  });
  if (!strih.ok) {
    p.katagrafi.sfalma('tutor: η στροφή απέτυχε', {
      kodikos: strih.sfalma.kodikos,
      kodikos_mathimatos,
      enotita_id: aitisi.enotita_id,
    });
    return strih;
  }

  const imerominia = p.rologi.tora().toISOString().slice(0, 10);
  const grammes: GrammaSynomilias[] = [
    {
      rolos: 'xristis',
      keimeno: aitisi.erotisi,
      imerominia,
      leitourgia: aitisi.leitourgia,
      parapompes: [],
    },
    {
      rolos: 'montelo',
      keimeno: strih.timi.apantisi,
      imerominia,
      leitourgia: aitisi.leitourgia,
      parapompes: strih.timi.parapompes,
    },
  ];
  const grapse = await grapse_grammes(
    p,
    kodikos_mathimatos,
    aitisi.enotita_id,
    grammes
  );
  if (!grapse.ok) {
    return grapse;
  }

  return ok(strih.timi);
}

/** Ανακτά την ενότητα από τον χάρτη. */
async function vres_enotita(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  enotita_id: string
): Promise<Apotelesma<Enotita>> {
  const xartis = await diavase_xarti(p.apothiki, p.riza, kodikos_mathimatos);
  if (!xartis.ok) {
    p.katagrafi.sfalma('tutor: ο χάρτης δεν διαβάστηκε', {
      kodikos: xartis.sfalma.kodikos,
      kodikos_mathimatos,
      enotita_id,
    });
    return xartis;
  }
  const enotita = xartis.timi.enotites.find((e) => e.id === enotita_id);
  if (enotita === undefined) {
    p.katagrafi.sfalma('tutor: η ενότητα δεν βρέθηκε στον χάρτη', { kodikos_mathimatos, enotita_id });
    return apotyxia('DEN_VRETHIKE', `Η ενότητα «${enotita_id}» δεν υπάρχει στο χάρτη του μαθήματος`);
  }
  return ok(enotita);
}

/** Διαβάζει το ιστορικό από το jsonl, χωρίς να γράψει τίποτα. */
async function diavase_istoriko(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  enotita_id: string
): Promise<Apotelesma<MinimaIstorikou[]>> {
  const gram = await p.apothiki.diavase_keimeno(
    me_riza(p.riza, arxeio_synomilias(kodikos_mathimatos, enotita_id))
  );
  if (!gram.ok) {
    return ok([]);
  }
  const istoriko: MinimaIstorikou[] = [];
  for (const grammi of gram.timi.split('\n')) {
    if (grammi.trim() === '') {
      continue;
    }
    const anagnosmeno = analysise_json(grammi, `synomilies/${enotita_id}.jsonl`);
    if (!anagnosmeno.ok) {
      p.katagrafi.sfalma('tutor: μη έγκυρη γραμμή στο ιστορικό συνομιλίας', {
        kodikos_mathimatos,
        enotita_id,
      });
      return anagnosmeno;
    }
    const anagnosmenou = anagnosmeno.timi;
    if (
      typeof anagnosmenou === 'object' &&
      anagnosmenou !== null &&
      'rolos' in anagnosmenou &&
      (anagnosmenou.rolos === 'xristis' || anagnosmenou.rolos === 'montelo') &&
      'keimeno' in anagnosmenou &&
      typeof anagnosmenou.keimeno === 'string'
    ) {
      istoriko.push({ rolos: anagnosmenou.rolos, keimeno: anagnosmenou.keimeno });
    }
  }
  return ok(istoriko);
}

/**
 * Προσθέτει γραμμές στο jsonl διατηρώντας το υπάρχον ιστορικό.
 * Μία ΓΡΑΜΜΗ ανά μήνυμα (jsonl): συνθλίκνωση χωρίς εσωτερικά νέα γραμμή,
 * αλλιώς ο αναγνώστης θα έπαιρνε σε λάθος θέση.
 */
async function grapse_grammes(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  enotita_id: string,
  grammes: readonly GrammaSynomilias[]
): Promise<Apotelesma<void>> {
  const diadromi = me_riza(p.riza, arxeio_synomilias(kodikos_mathimatos, enotita_id));
  const palio = await p.apothiki.diavase_keimeno(diadromi);
  const proigoumeno = palio.ok ? palio.timi.replace(/\n+$/, '') : '';
  const nees = grammes.map((grammi) => JSON.stringify(grammi)).join('\n');
  const periexomeno = proigoumeno === '' ? `${nees}\n` : `${proigoumeno}\n${nees}\n`;
  return p.apothiki.grapse_keimeno(diadromi, periexomeno);
}

/** Συλλέγει το υλικό των εργαλείων του tutor (ενότητα + σελίδες πηγών). */
async function fere_uliko_tutor(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  enotita: Enotita
): Promise<Apotelesma<{ enotites: Enotita[]; selides: Selida[]; perigrafies: PerigraphiEnnoia[]; erotiseis: ErotisiAskisis[] }>> {
  const selides: Selida[] = [];
  for (const pige of enotita.piges) {
    const gram = await diavase_keimeno(p.apothiki, p.riza, kodikos_mathimatos, pige.arxeio_id);
    if (!gram.ok) {
      p.katagrafi.sfalma('tutor: το κείμενο της πηγής δεν διαβάστηκε', {
        kodikos: gram.sfalma.kodikos,
        kodikos_mathimatos,
        arxeio_id: pige.arxeio_id,
      });
      return gram;
    }
    for (const selida of gram.timi) {
      if (selida.arithmos >= pige.apo && selida.arithmos <= pige.eos) {
        selides.push(selida);
      }
    }
  }
  // Οι ορισμοί (`vres_ennoia`) και οι ερωτήσεις άσκησης (`ftiaxe_erotisi`)
  // παράγονται από τα βήματα T1/T3, που δεν είναι στο branch: τα εργαλεία
  // επιστρέφουν `DEN_VRETHIKE` (ποτέ επινοημένο περιεχόμενο) αν τα ζητηθούν.
  return ok({ enotites: [enotita], selides, perigrafies: [], erotiseis: [] });
}