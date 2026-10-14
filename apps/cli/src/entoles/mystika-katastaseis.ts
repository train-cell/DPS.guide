import type { Apotelesma, KleidiMystikou } from '@dps/core';
import { apotyxia } from '@dps/core';
import type { EisodosPipeline } from '@dps/pipeline';

/** Στάση ενός μυστικού — ΠΟΤΕ η τιμή του, μόνο αν υπάρχει. */
export interface KatastasiMystikou {
  readonly kleidi: KleidiMystikou;
  readonly onoma_metavlitis: string;
  readonly parichon: boolean;
}

/** Συνδέει το κλειδί μυστικού με το όνομα της μεταβλητής περιβάλλοντος (fallback). */
const KLEIDIA_ECLASS_CLI = [
  'eclass_onoma_xristi',
  'eclass_kodikos',
] as const satisfies readonly KleidiMystikou[];

const ONOMATA_METAVLITON: Readonly<Record<(typeof KLEIDIA_ECLASS_CLI)[number], string>> = {
  eclass_onoma_xristi: 'ECLASS_USERNAME',
  eclass_kodikos: 'ECLASS_PASSWORD',
};

/** Μυστικά που απαιτούνται για τη σύνδεση στο eClass. */
const KLEIDIA_YNDESIS: readonly KleidiMystikou[] = KLEIDIA_ECLASS_CLI;

/**
 * Κατάσταση των μυστικών μέσω του `MystikaPyli`.
 *
 * Δεν κρατάμε ποτέ τις τιμές — ρωτάμε μόνο «υπάρχει ή όχι», ώστε να μην μπορεί
 * να διαρρεύσει μυστικό σε log ή σε μήνυμα σφάλματος (§3.11).
 */
export async function katastaseis_mystikon(eisodos: EisodosPipeline): Promise<KatastasiMystikou[]> {
  const katastaseis: KatastasiMystikou[] = [];
  for (const kleidi of KLEIDIA_ECLASS_CLI) {
    const timi = await eisodos.mystika.pare(kleidi);
    katastaseis.push({
      kleidi,
      onoma_metavlitis: ONOMATA_METAVLITON[kleidi],
      parichon: timi !== null && timi.trim().length > 0,
    });
  }
  return katastaseis;
}

/** Κείμενο μιας γραμμής κατάστασης μυστικού — χωρίς τιμές. */
export function grammi_katastasis(katastasi: KatastasiMystikou): string {
  const timeless = katastasi.parichon ? 'βρέθηκε' : 'λείπει';
  return `${katastasi.onoma_metavlitis}: ${timeless} (${katastasi.kleidi})`;
}

/** Γραμμές κατάστασης για την εντολή σύνδεσης. */
export function grammes_katastaseon(katastaseis: readonly KatastasiMystikou[]): string[] {
  return katastaseis.map(grammi_katastasis);
}

/** `null` αν όλα τα διαπιστευτήρια σύνδεσης βρέθηκαν, αλλιώς το σφάλμα. */
export function sfalma_leipton_diapisteuterion(
  katastaseis: readonly KatastasiMystikou[]
): Apotelesma<never> | null {
  const leipa = katastaseis
    .filter((katastasi) => KLEIDIA_YNDESIS.includes(katastasi.kleidi) && !katastasi.parichon)
    .map((katastasi) => katastasi.onoma_metavlitis);
  if (leipa.length === 0) {
    return null;
  }
  return apotyxia(
    'DEN_VRETHIKE',
    `Λείπουν τα διαπιστευτήρια eClass: ${leipa.join(', ')}. ` +
      'Βάλε τα στο Windows Credential Manager ή όρισε τις αντίστοιχες μεταβλητές περιβάλλοντος.'
  );
}
