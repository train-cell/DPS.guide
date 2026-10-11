import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';
import { sygxronismos } from '@dps/pipeline';
import type { EisodosPipeline } from '@dps/pipeline';
import type { ExodosEn, MetritiMathimatos } from '../eksodos/exodos-en.js';
import { DIADROMI_MATHIMATON, epilegmena_mathimata, fere_mathimata_apo_ryza } from '../stathimes/mathimata-apo-ryza.js';

/** Βήμα 3 (§4) για ένα μάθημα, με την επανάληψη του κωδικού στο αποτέλεσμα. */
async function sygxronise_ena(
  eisodos: EisodosPipeline,
  kodikos_mathimatos: string
): Promise<Apotelesma<MetritiMathimatos>> {
  const apotelesma = await sygxronismos(eisodos, kodikos_mathimatos);
  if (!apotelesma.ok) {
    return apotelesma;
  }
  return ok({ kodikos_mathimatos, megaliteres: apotelesma.timi.megaliteres });
}

/**
 * Βήμα 3 (§4): συγχρονισμός αρχείων.
 *
 * Με κωδικό: ένα μάθημα. Χωρίς κωδικό: τα μαθήματα με `epilegmeno: true` από το
 * `mathimata.json`. Αν δεν υπάρχει κανένα, είναι σφάλμα — όχι κενή επιτυχία.
 */
export async function trexe_sygxronismos(
  eisodos: EisodosPipeline,
  ori_arg: readonly string[]
): Promise<Apotelesma<ExodosEn>> {
  const kodikos = ori_arg[0];
  if (kodikos !== undefined) {
    const ena = await sygxronise_ena(eisodos, kodikos);
    if (!ena.ok) {
      return ena;
    }
    return ok({ eidos: 'sygxronismos', apotelesmata: [ena.timi] });
  }

  const mathimata = await fere_mathimata_apo_ryza(eisodos.apothiki);
  if (!mathimata.ok) {
    return mathimata;
  }
  const epilegmena = epilegmena_mathimata(mathimata.timi);
  if (epilegmena.length === 0) {
    return apotyxia(
      'DEN_VRETHIKE',
      `Δεν υπάρχουν επιλεγμένα μαθήματα στο ${DIADROMI_MATHIMATON}. ` +
        'Δώσε κωδικό ρητά ή σημείωσε μαθήματα ως επιλεγμένα.'
    );
  }

  const apotelesmata: MetritiMathimatos[] = [];
  for (const mathima of epilegmena) {
    const ena = await sygxronise_ena(eisodos, mathima.kodikos);
    if (!ena.ok) {
      return ena;
    }
    apotelesmata.push(ena.timi);
  }
  return ok({ eidos: 'sygxronismos', apotelesmata });
}
