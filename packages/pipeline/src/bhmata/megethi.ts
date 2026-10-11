/**
 * Βήμα 7 (§4): εκτίμηση λεπτών, ΑΠΟΚΛΕΙΣΤΙΚΑ deterministic.
 *
 * Δεν γίνεται ΚΑΜΙΑ κλήση LLM (D4 / 50-50 boundary). Τα λεπτά κάθε ενότητας
 * προκύπτουν από το `ektimisi_lepton` του frozen core (L02), που χρησιμοποιεί
 * τον πίνακα `RYTHMOS_LEPTA_ANA_TYPO` και τα κλάσματα πυκνότητας του §7.3:
 * τα τμήματα των ενοτήτων χαρτογραφούνται στα τμήματα των περιγραμμάτων ώστε να
 * βρίσκουμε τον «τύπο» (`typos`) των σελίδων της ενότητας.
 */

import type { Apotelesma, Perigramma, Selida, Tmima, XartisMathimatos } from '@dps/core';
import { apotyxia, ektimisi_lepton, ok } from '@dps/core';

import type { EisodosPipeline } from '../porte.js';
import { arxeio_keimenou, arxeio_xarti, me_riza } from '../statheroi.js';
import { diavase_arxeia, diavase_xarti, grapse_json } from '../grammata/apothiki-json.js';
import { ektekseven_arxeio } from '../grammata/diadromes.js';

/** Κομμάτι σελίδων μιας ενότητας, με τον τύπο του αντίστοιχου τμήματος. */
type TmimaEnotitas = Tmima;

/** Εύρος μιας πηγής, όπως το κρατάει ο χάρτης. */
interface EuresPigis {
  readonly arxeio_id: string;
  readonly apo: number;
  readonly eos: number;
}

/**
 * Χαρτογράφηση τμημάτων: για κάθε τμήμα της ενότητας βρίσκει τα τμήματα του
 * περιγράμματος που τέμνουν το εύρος της πηγής και κρατάει τον τύπο τους.
 * Χωρίς επικάλυψη τα τμήματα του περιγράμματος δεν χρησιμοποιούνται (π.χ. ασκήσεις
 * που δεν ανήκουν στην ενότητα) — δεν επινοείται τύπος.
 */
function tmimata_enotitas(
  perigrammata: ReadonlyMap<string, Perigramma>,
  piges: readonly EuresPigis[]
): TmimaEnotitas[] {
  const apotelestes: TmimaEnotitas[] = [];
  for (const pige of piges) {
    const perigramma = perigrammata.get(pige.arxeio_id);
    if (perigramma === undefined) {
      continue;
    }
    for (const tmima of perigramma.tmimata) {
      const apo = Math.max(tmima.selides.apo, pige.apo);
      const eos = Math.min(tmima.selides.eos, pige.eos);
      if (apo > eos) {
        continue;
      }
      apotelestes.push({
        titlos: tmima.titlos,
        selides: { apo, eos },
        typos: tmima.typos,
        ennoies: tmima.ennoies,
        proapaitoumena: tmima.proapaitoumena,
      });
    }
  }
  return apotelestes;
}

/** Βήμα 7: συμπληρώνει το `lepta_ektimisi` κάθε ενότητας, χωρίς LLM. */
export async function megethi(
  p: EisodosPipeline,
  kodikos_mathimatos: string
): Promise<Apotelesma<XartisMathimatos>> {
  const xartis = await diavase_xarti(p.apothiki, p.riza, kodikos_mathimatos);
  if (!xartis.ok) {
    p.katagrafi.sfalma('megethi: ο χάρτης δεν διαβάστηκε', {
      kodikos: xartis.sfalma.kodikos,
      kodikos_mathimatos,
    });
    return xartis;
  }

  const eurethrio = await diavase_arxeia(p.apothiki, p.riza, kodikos_mathimatos);
  if (!eurethrio.ok) {
    p.katagrafi.sfalma('megethi: το ευρετήριο αρχείων δεν διαβάστηκε', {
      kodikos: eurethrio.sfalma.kodikos,
      kodikos_mathimatos,
    });
    return eurethrio;
  }

  const perigrammata = new Map<string, Perigramma>();
  for (const arxeio of eurethrio.timi) {
    if (!EXAGOGESIMES_EPITEKSEIS.has(ektekseven_arxeio(arxeio.diadromi))) {
      continue;
    }
    const gram = await p.apothiki.diavase_keimeno(
      me_riza(p.riza, `${kodikos_mathimatos}/.spoudes/perigrammata/${arxeio.id}.json`)
    );
    if (!gram.ok) {
      continue;
    }
    perigrammata.set(arxeio.id, JSON.parse(gram.timi) as Perigramma);
  }

  const enotimes = [];
  for (const enotita of xartis.timi.enotites) {
    const lepta = await lepta_enotitas(p, kodikos_mathimatos, enotita.piges, perigrammata);
    if (!lepta.ok) {
      return lepta;
    }
    enotimes.push({ ...enotita, lepta_ektimisi: lepta.timi });
  }

  const xartis_nikos: XartisMathimatos = { ...xartis.timi, enotites: enotimes };
  const grapse = await grapse_json(
    p.apothiki,
    me_riza(p.riza, arxeio_xarti(kodikos_mathimatos)),
    xartis_nikos
  );
  if (!grapse.ok) {
    p.katagrafi.sfalma('megethi: απέτυχε η εγγραφή του χάρτη', {
      kodikos: grapse.sfalma.kodikos,
      kodikos_mathimatos,
    });
    return grapse;
  }

  p.katagrafi.pliroforia('megethi: οι εκτιμήσεις λεπτών ενημερώθηκαν', {
    kodikos_mathimatos,
    enotites: enotimes.length,
  });
  return ok(xartis_nikos);
}

/** Επεκτάσεις με πραγματική εξαγωγή κειμένου (ίδιες με του `exagogi`). */
const EXAGOGESIMES_EPITEKSEIS = new Set(['pdf', 'pptx', 'docx']);

/** Άθροισμα των λεπτών μιας ενότητας από τα τμήματά της (μέσω core `ektimisi_lepton`). */
async function lepta_enotitas(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  piges: readonly EuresPigis[],
  perigrammata: ReadonlyMap<string, Perigramma>
): Promise<Apotelesma<number>> {
  const tmimata = tmimata_enotitas(perigrammata, piges);
  if (tmimata.length === 0) {
    p.katagrafi.proeidopoiisi('megethi: η ενότητα δεν αντιστοιχεί σε κανένα τμήμα υλικού', {
      kodikos_mathimatos,
    });
    return ok(0);
  }

  let synolo = 0;
  const idi_arxeion = [...new Set(piges.map((pige) => pige.arxeio_id))];
  for (const arxeio_id of idi_arxeion) {
    const piges_arxeio = piges.filter((pige) => pige.arxeio_id === arxeio_id);
    const tmimata_arxeio = tmimata.filter((tmima) =>
      piges_arxeio.some(
        (pige) => tmima.selides.apo >= pige.apo && tmima.selides.eos <= pige.eos
      )
    );
    if (tmimata_arxeio.length === 0) {
      continue;
    }
    const selides = await diavase_keimeno_arxeiou(p, kodikos_mathimatos, arxeio_id);
    if (!selides.ok) {
      return selides;
    }
    const synthetiko: Perigramma = {
      arxeio_id,
      titlos: kodikos_mathimatos,
      tmimata: tmimata_arxeio,
    };
    const lepta = ektimisi_lepton(synthetiko, selides.timi);
    if (!lepta.ok) {
      p.katagrafi.sfalma('megethi: το κορέ εκτίμησης λεπτών απέτυχε', {
        kodikos_mathimatos,
        arxeio_id,
      });
      return lepta;
    }
    synolo += lepta.timi;
  }
  return ok(synolo);
}

/** Αναγνώζει το `keimeno/<arxeio_id>.json` (αντί για επανάληψη του `perigramma`). */
async function diavase_keimeno_arxeiou(
  p: EisodosPipeline,
  kodikos_mathimatos: string,
  arxeio_id: string
): Promise<Apotelesma<Selida[]>> {
  const gram = await p.apothiki.diavase_keimeno(
    me_riza(p.riza, arxeio_keimenou(kodikos_mathimatos, arxeio_id))
  );
  if (!gram.ok) {
    p.katagrafi.sfalma('megethi: το εξαγόμενο κείμενο δεν διαβάστηκε', {
      kodikos: gram.sfalma.kodikos,
      kodikos_mathimatos,
      arxeio_id,
    });
    return apotyxia('DEN_VRETHIKE', `Λείπει το κείμενο του αρχείου ${arxeio_id}`);
  }
  const tsti: unknown = JSON.parse(gram.timi);
  if (!Array.isArray(tsti)) {
    return apotyxia('MI_EGKYRO_SXIMA', `Το κείμενο του αρχείου ${arxeio_id} δεν είναι λίστα σελίδων`);
  }
  return ok(tsti as Selida[]);
}