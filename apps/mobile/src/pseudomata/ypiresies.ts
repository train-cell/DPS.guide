import type { Mathima, Enotita, XartisMathimatos } from '@dps/core';
import type { Katastasi } from '../kathstasi/index.js';
import { etimo, adeio, sfalma } from '../kathstasi/index.js';
import { KATHYSTERISI_PSEDON_MS, pseudos_mathimata, pseudos_xartis } from './pseudomata.js';

/** Ένας φορτωτής δεδομένων με προσομοιωμένη καθυστέρηση, ώστε το UI να δείχνει πραγματική φόρτωση. */
async function psefaios<T>(epivroi: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(epivroi());
    }, KATHYSTERISI_PSEDON_MS);
  });
}

/** Φορτώνει τη λίστα μαθημάτων. Κενή λίστα οδηγεί σε κατάσταση adeio. */
export async function fortose_mathimata(): Promise<Katastasi<readonly Mathima[]>> {
  const mathimata = await psefaios(pseudos_mathimata);
  if (mathimata.length === 0) {
    return adeio();
  }
  return etimo([...mathimata]);
}

/** Φορτώνει τον χάρτη ενοτήτων του μαθήματος. */
export async function fortose_xartis(): Promise<Katastasi<XartisMathimatos>> {
  const xartis = await psefaios(pseudos_xartis);
  if (xartis.enotites.length === 0) {
    return adeio();
  }
  return etimo(xartis);
}

/** Επιστρέφει τις ενότητες, ή σφάλμα αν δεν βρεθεί ο κωδικός. */
export async function fortose_enotites(kodikos: string): Promise<Katastasi<readonly Enotita[]>> {
  const xartis = await psefaios(pseudos_xartis);
  if (xartis.kodikos_mathimatos !== kodikos) {
    return sfalma({
      kodikos: 'DEN_VRETHIKE',
      minima: `Δεν βρέθηκε μάθημα με κωδικό ${kodikos}.`,
    });
  }
  return etimo([...xartis.enotites]);
}

/** Προσομοίωση σφάλματος δικτύου, για να δοκιμαστεί η κατάσταση σφάλματος. */
export async function fortose_sfalma_diktio(): Promise<Katastasi<never>> {
  await psefaios(() => undefined);
  return sfalma({
    kodikos: 'DIKTYO',
    minima: 'Δεν είναι δυνατή η σύνδεση με τον διακομιστή του eClass.',
  });
}