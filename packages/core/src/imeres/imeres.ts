/**
 * Κοινές, εσωτερικές (μη-contract) βοηθητικές συναρτήσεις ημερομηνίας.
 *
 * Οι ημερομηνίες αντιμετωπίζονται ως ημερολογιακές ημέρες `YYYY-MM-DD`
 * (Europe/Athens) και οι υπολογισμοί γίνονται σε UTC ώστε να μην επηρεάζονται
 * από αλλαγές ώρας (DST). Κοινό σημείο αλήθειας για mathisi και programma.
 */

/** Ημερολογιακά μέρη μιας έγκυρης ημερομηνίας. */
export interface MeriImorominias {
  etos: number;
  minas: number;
  imera: number;
}

const PATTERN_IMEROMINIAS = /^(\d{4})-(\d{2})-(\d{2})$/;
const MILLIS_ANA_IMERA = 86_400_000;

/** Μορφοποιεί μέρη σε `YYYY-MM-DD`. */
export function iso_apo_meri(meri: MeriImorominias): string {
  const mm = String(meri.minas).padStart(2, '0');
  const dd = String(meri.imera).padStart(2, '0');
  return `${meri.etos}-${mm}-${dd}`;
}

/**
 * Αυστηρός έλεγχος `YYYY-MM-DD` με round-trip: η ημερομηνία ξαναχτίζεται και
 * πρέπει να ταυτίζεται με την είσοδο (πιάνει 32/13, 30 Φεβρουαρίου κ.λπ.).
 */
export function parse_meri(imerominia: string): MeriImorominias | null {
  const match = PATTERN_IMEROMINIAS.exec(imerominia);
  if (match === null) {
    return null;
  }
  const meri = { etos: Number(match[1]), minas: Number(match[2]), imera: Number(match[3]) };
  if (meri.minas < 1 || meri.minas > 12 || meri.imera < 1 || meri.imera > 31) {
    return null;
  }
  const millis = Date.UTC(meri.etos, meri.minas - 1, meri.imera);
  const epistrefo = {
    etos: new Date(millis).getUTCFullYear(),
    minas: new Date(millis).getUTCMonth() + 1,
    imera: new Date(millis).getUTCDate(),
  };
  return iso_apo_meri(epistrefo) === imerominia ? epistrefo : null;
}

/** Προσθέτει ημέρες ημερολογιακά (απρόσβλητο από DST). */
export function add_imeres(meri: MeriImorominias, imeres: number): string {
  const millis = Date.UTC(meri.etos, meri.minas - 1, meri.imera);
  return new Date(millis + imeres * MILLIS_ANA_IMERA).toISOString().slice(0, 10);
}
