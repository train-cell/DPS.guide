/**
 * Βήμα 8 (§4): οδηγός ενότητας (LLM, LAZY) → `odigoi/<enotita_id>.md` + `.meta.json`.
 *
 * Lazy κατά το §4/κάρτα I1: ο οδηγός παράγεται ΜΟΝΟ όταν ζητηθεί. Το «ζητήθηκε»
 * είναι η κλήση της `odigos()` — δεν υπάρχει βήμα μαζικής παραγωγής.
 *
 * Το κείμενο πηγών προέρχεται ΑΠΟ ΤΑ `keimeno/<arxeio_id>.json`, τα οποία έχει
 * ήδη παράγει το βήμα `exagogi`. Η επικύρωση του Markdown (7 υποχρεωτικές ενότητες
 * + παραπομπές εντός εύρους) είναι η `epikyrose_odigo` του frozen core (L03).
 */

import type { Apotelesma, Enotita, OdigosMeta, Pigi, Selida } from '@dps/core';
import { OdigosMetaSchema, apotyxia, epikyrose_odigo, ok } from '@dps/core';
import { prompt_odigou } from '@dps/ai';
import type { EisodosPipeline } from '../porte.js';
import {
  THERMOKRASIA_ODIGOU,
  arxeio_meta_odigou,
  arxeio_odigou,
  arxeio_xarti,
  me_riza,
} from '../statheroi.js';
import { analysise_json, diavase_keimeno, diavase_xarti, grapse_json, parade_json } from '../grammata/apothiki-json.js';
import { vres_mathima_apo_enotita } from '../grammata/ves.js';
import type { IparastypotisProodou } from '../grammata/proodos.js';

/**
 * Βήμα 8: παράγει τον οδηγό μιας ενότητας αν δεν υπάρχει ήδη.
 *
 * ΥΠΟΓΡΑΦΗ ΣΥΜΒΑΤΗ ΠΡΟΣ ΤΑ ΠΙΣΩ: `(p, enotita_id)` — χωρίς κωδικό μαθήματος·
 * το μάθημα εντοπίζεται από τους χάρτες (`vres_mathima_apo_enotita`).
 */
export async function odigos(
  p: EisodosPipeline,
  enotita_id: string,
  parastypotis?: IparastypotisProodou
): Promise<Apotelesma<OdigosMeta>> {
  const kodikos_mathimatos = await vres_mathima_apo_enotita(p, enotita_id);
  if (!kodikos_mathimatos.ok) {
    return kodikos_mathimatos;
  }
  return odigos_mathimatos(p, kodikos_mathimatos.timi, enotita_id, parastypotis);
}

/** Παραλλαγή με ρητό κωδικό μαθήματος. */
export async function odigos_mathimatos(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  enotita_id: string,
  parastypotis?: IparastypotisProodou
): Promise<Apotelesma<OdigosMeta>> {
  const enotita = await vres_enotita(p, kodikos_mathimatos, enotita_id);
  if (!enotita.ok) {
    return enotita;
  }

  const uparxei_md = await p.apothiki.yparxei(me_riza(p.riza, arxeio_odigou(kodikos_mathimatos, enotita_id)));
  const uparxei_meta = await p.apothiki.yparxei(
    me_riza(p.riza, arxeio_meta_odigou(kodikos_mathimatos, enotita_id))
  );
  if (uparxei_md && uparxei_meta) {
    const palia = await diavase_meta_odigou(p, kodikos_mathimatos, enotita_id);
    if (!palia.ok) {
      return palia;
    }
    p.katagrafi.pliroforia('odigos: ο οδηγός υπάρχει ήδη (lazy, χωρίς κλήση LLM)', {
      kodikos_mathimatos,
      enotita_id,
    });
    return palia;
  }

  const selides = await fere_selides_pigon(p, kodikos_mathimatos, enotita.timi.piges);
  if (!selides.ok) {
    return selides;
  }

  let aitisi;
  try {
    aitisi = prompt_odigou({ enotita: enotita.timi, selides: selides.timi });
  } catch (aitia) {
    // Ο builder του P3 κάνεδρε αν το κείμενο ξεπερνά τα όρια κομματιού· το μετατρέπουμε
    // σε σφάλμα ορατό, ποτέ δεν αφήνουμε εξαίρεση να διαφύγει (κανόνας 9).
    const minima = aitia instanceof Error ? aitia.message : 'Άγνωστο σφάλμα στο P3';
    p.katagrafi.sfalma('odigos: το κείμενο της ενότητας ξεπερνά τα όρια', {
      kodikos_mathimatos,
      enotita_id,
    });
    return apotyxia('MI_YPOSTIRIZOMENO', minima);
  }

  const apantisi = await p.llm.parage_json({
    systima: aitisi.sistima,
    xristis: aitisi.xristis,
    sxima: aitisi.sisma,
    ekdosi_prompt: aitisi.ekdosi_prompt,
    thermokrasia: THERMOKRASIA_ODIGOU,
  });
  if (!apantisi.ok) {
    p.katagrafi.sfalma('odigos: το μοντέλο απέτυχε', {
      kodikos: apantisi.sfalma.kodikos,
      kodikos_mathimatos,
      enotita_id,
    });
    return apantisi;
  }

  const epikyrommenos = epikyrose_odigo(apantisi.timi.markdown, enotita.timi.piges);
  if (!epikyrommenos.ok) {
    p.katagrafi.sfalma('odigos: ο οδηγός δεν πέρασε την επικύρωση', {
      kodikos_mathimatos,
      enotita_id,
      minima: epikyrommenos.sfalma.minima,
    });
    return epikyrommenos;
  }

  const meta: OdigosMeta = {
    enotita_id,
    parapompes: epikyrommenos.timi.parapompes,
    montelo: p.llm.montelo,
    ekdosi_prompt: aitisi.ekdosi_prompt,
    hash_eisodou: hash_eisodou(selides.timi),
    proeidopoiiseis: [],
  };

  const grapse_md = await p.apothiki.grapse_keimeno(
    me_riza(p.riza, arxeio_odigou(kodikos_mathimatos, enotita_id)),
    apantisi.timi.markdown
  );
  if (!grapse_md.ok) {
    p.katagrafi.sfalma('odigos: απέτυχε η εγγραφή του οδηγού', {
      kodikos: grapse_md.sfalma.kodikos,
      kodikos_mathimatos,
      enotita_id,
    });
    return grapse_md;
  }

  const grapse_meta = await grapse_json(
    p.apothiki,
    me_riza(p.riza, arxeio_meta_odigou(kodikos_mathimatos, enotita_id)),
    meta
  );
  if (!grapse_meta.ok) {
    p.katagrafi.sfalma('odigos: απέτυχε η εγγραφή των μεταδεδομένων', {
      kodikos: grapse_meta.sfalma.kodikos,
      kodikos_mathimatos,
      enotita_id,
    });
    return grapse_meta;
  }

  p.katagrafi.pliroforia('odigos: ο οδηγός παράχθηκε', {
    kodikos_mathimatos,
    enotita_id,
    parapompes: meta.parapompes.length,
  });
  if (parastypotis !== undefined) {
    parastypotis({ vhima: 'odigos', synolo: 1, olokliromena: 1, minima: 'ο οδηγός παράχθηκε', oloklirothike: true });
  }
  return ok(meta);
}

/** Σταθερός δείκτης της εισόδου του οδηγού (hash των κειμένων πηγών). */
function hash_eisodou(selides: readonly Selida[]): string {
  return parade_json(selides.map((s) => ({ arxeio_id: s.arxeio_id, arithmos: s.arithmos, keimeno: s.keimeno })));
}

/** Ανακτά την ενότητα από τον χάρτη του μαθήματος. */
async function vres_enotita(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  enotita_id: string
): Promise<Apotelesma<Enotita>> {
  const xartis = await diavase_xarti(p.apothiki, p.riza, kodikos_mathimatos);
  if (!xartis.ok) {
    p.katagrafi.sfalma('odigos: ο χάρτης δεν διαβάστηκε', {
      kodikos: xartis.sfalma.kodikos,
      kodikos_mathimatos,
      enotita_id,
    });
    return xartis;
  }
  const enotita = xartis.timi.enotites.find((e) => e.id === enotita_id);
  if (enotita === undefined) {
    p.katagrafi.sfalma('odigos: η ενότητα δεν βρέθηκε στον χάρτη', { kodikos_mathimatos, enotita_id });
    return apotyxia('DEN_VRETHIKE', `Η ενότητα «${enotita_id}» δεν υπάρχει στο χάρτη του μαθήματος ${kodikos_mathimatos}`);
  }
  return ok(enotita);
}

/** Αθροίζει τις σελίδες όλων των πηγών της ενότητας, με σειρά `arxeio_id` + αρίθμηση. */
async function fere_selides_pigon(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  piges: readonly Pigi[]
): Promise<Apotelesma<Selida[]>> {
  const selides: Selida[] = [];
  for (const pige of piges) {
    const gram = await diavase_keimeno(p.apothiki, p.riza, kodikos_mathimatos, pige.arxeio_id);
    if (!gram.ok) {
      p.katagrafi.sfalma('odigos: το κείμενο της πηγής δεν διαβάστηκε', {
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
  if (selides.length === 0) {
    p.katagrafi.sfalma('odigos: η ενότητα δεν έχει σελίδες πηγής', { kodikos_mathimatos });
    return apotyxia('DEN_VRETHIKE', 'Η ενότητα δεν έχει καμία σελίδα πηγής για παραγωγή οδηγού');
  }
  return ok(selides);
}

/** Αναγνώζει τα `odigoi/<enotita_id>.meta.json` με επικύρωση του frozen schema. */
async function diavase_meta_odigou(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  enotita_id: string
): Promise<Apotelesma<OdigosMeta>> {
  const gram = await p.apothiki.diavase_keimeno(
    me_riza(p.riza, arxeio_meta_odigou(kodikos_mathimatos, enotita_id))
  );
  if (!gram.ok) {
    p.katagrafi.sfalma('odigos: τα μεταδεδομένα του οδηγού δεν διαβάστηκαν', {
      kodikos_mathimatas: kodikos_mathimatos,
      enotita_id,
    });
    return gram;
  }
  const anal = analysise_json(gram.timi, `odigoi/${enotita_id}.meta.json`);
  if (!anal.ok) {
    return anal;
  }
  const meta = OdigosMetaSchema.safeParse(anal.timi);
  if (!meta.success) {
    return apotyxia('MI_EGKYRO_SXIMA', 'Τα μεταδεδομένα του οδηγού δεν ταιριάζουν με το σχήμα', meta.error);
  }
  return ok(meta.data);
}

/** Επανεξαγωγή: η διαδρομή του Markdown του οδηγού και των μεταδεδομένων (για το UI). */
export { arxeio_meta_odigou, arxeio_odigou, arxeio_xarti };