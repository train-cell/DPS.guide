/**
 * Φωνητικό Matching & Υπολογισμός Ομοιότητας Φωνητικών Απαντήσεων.
 *
 * 100% pure deterministic module (50/50 boundary).
 * Δεν χρησιμοποιεί εξωτερικές εξαρτήσεις ή LLM.
 */

/** Κατώφλι επιτυχίας φωνητικής εξέτασης (70%). */
export const KATWFLI_EPITYXIAS_FWNITIKIS = 70;

/** Αποτέλεσμα σύγκρισης φωνητικής απάντησης με τον στόχο. */
export interface ApotelesmaFwnitikisOmoiotitas {
  /** Ποσοστό ομοιότητας [0 - 100]. */
  readonly posostoOmoiotitas: number;
  /** Ένδειξη αν ξεπέρασε το κατώφλι επιτυχίας (>= 70%). */
  readonly epityxia: boolean;
  /** Οι λέξεις-κλειδιά που εντοπίστηκαν στην απάντηση. */
  readonly vretheisanLexeis: readonly string[];
}

/**
 * Κανονικοποιεί κείμενο για φωνητική σύγκριση:
 * - Μετατροπή σε πεζά
 * - Αφαίρεση ελληνικών τόνων και διαλυτικών
 * - Μετατροπή τελικού σίγμα (ς) σε σίγμα (σ)
 * - Αφαίρεση σημείων στίξης και περιττών συμβόλων
 * - Συμπίεση κενών
 */
export function kanonikopoiise_fwnitika(keimeno: string): string {
  if (!keimeno) return '';

  let k = keimeno.toLowerCase();

  // Αφαίρεση τόνων και διαλυτικών από ελληνικά γράμματα
  k = k
    .replace(/[άα]/g, 'α')
    .replace(/[έε]/g, 'ε')
    .replace(/[ήη]/g, 'η')
    .replace(/[ίιϊΐ]/g, 'ι')
    .replace(/[όο]/g, 'ο')
    .replace(/[ύυϋΰ]/g, 'υ')
    .replace(/[ώω]/g, 'ω')
    .replace(/ς/g, 'σ');

  // NFD decomposition για οποιουσδήποτε υπόλοιπους συνδυαστικούς τόνους/accents
  k = k.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Αφαίρεση σημείων στίξης (διατήρηση γραμμάτων, αριθμών και κενών)
  k = k.replace(/[^\p{L}\p{N}\s]/gu, ' ');

  // Κανονικοποίηση τελικού σίγμα ξανά σε περίπτωση που προέκυψε
  k = k.replace(/ς/g, 'σ');

  // Συμπίεση πολλαπλών κενών
  return k.replace(/\s+/g, ' ').trim();
}

/**
 * Υπολογίζει την απόσταση Levenshtein μεταξύ δύο συμβολοσειρών.
 */
export function ypologise_levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length;
  const n = b.length;
  let prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  let curr: number[] = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const charA = a[i - 1];
    for (let j = 1; j <= n; j++) {
      const pJ = prev[j] ?? 0;
      const cJ1 = curr[j - 1] ?? 0;
      const pJ1 = prev[j - 1] ?? 0;
      const kostos = charA === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        pJ + 1,        // διαγραφή
        cJ1 + 1,       // εισαγωγή
        pJ1 + kostos   // αντικατάσταση
      );
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }

  return prev[n] ?? 0;
}

/**
 * Υπολογίζει συντελεστή ομοιότητας Levenshtein στο διάστημα [0, 1].
 */
export function ypologise_omoiotita_levenshtein(a: string, b: string): number {
  if (a === b) return 1;
  const maxMikos = Math.max(a.length, b.length);
  if (maxMikos === 0) return 1;
  const apostasi = ypologise_levenshtein(a, b);
  return Math.max(0, 1 - apostasi / maxMikos);
}

/**
 * Ελέγχει αν μια λέξη-κλειδί περιέχεται στην απάντηση, είτε ως ακριβής λέξη,
 * είτε ως μέρος του κειμένου, είτε με ανοχή φωνητικού σφάλματος (fuzzy match >= 0.75).
 */
function elegxos_lexis_kleidi(lexiKanoniki: string, apantisiKanoniki: string, apantisiTokens: readonly string[]): boolean {
  if (!lexiKanoniki) return false;

  // 1. Ακριβής ύπαρξη ως token ή ως substring
  if (apantisiTokens.includes(lexiKanoniki) || apantisiKanoniki.includes(lexiKanoniki)) {
    return true;
  }

  // 2. Fuzzy match με κάποιο token της απάντησης για ανοχή φωνητικής αναγνώρισης
  for (const token of apantisiTokens) {
    if (ypologise_omoiotita_levenshtein(token, lexiKanoniki) >= 0.75) {
      return true;
    }
  }

  return false;
}

/**
 * Υπολογίζει τη φωνητική ομοιότητα μεταξύ της απάντησης του χρήστη και της αναμενόμενης απάντησης-στόχου.
 *
 * @param apantisiXristi Η προφορική απάντηση που καταγράφηκε από το Speech API
 * @param stoxos Η επίσημη σωστή απάντηση της κάρτας
 * @param lexeisKleidia Λέξεις-κλειδιά που πρέπει να εντοπιστούν στην απάντηση
 * @returns Αντικείμενο με ποσοστό ομοιότητας [0-100], ένδειξη επιτυχίας (>= 70%) και λέξεις που βρέθηκαν
 */
export function ypologise_fwnitiki_omoiotita(
  apantisiXristi: string,
  stoxos: string,
  lexeisKleidia: readonly string[]
): ApotelesmaFwnitikisOmoiotitas {
  const apantisiKanoniki = kanonikopoiise_fwnitika(apantisiXristi);
  const stoxosKanoniki = kanonikopoiise_fwnitika(stoxos);

  // Αν η απάντηση του χρήστη είναι κενή
  if (!apantisiKanoniki) {
    return {
      posostoOmoiotitas: 0,
      epityxia: false,
      vretheisanLexeis: [],
    };
  }

  // Αν ο στόχος είναι κενός αλλά δόθηκε απάντηση
  if (!stoxosKanoniki && lexeisKleidia.length === 0) {
    return {
      posostoOmoiotitas: 0,
      epityxia: false,
      vretheisanLexeis: [],
    };
  }

  const apantisiTokens = apantisiKanoniki.split(' ').filter(Boolean);

  // Εντοπισμός λέξεων-κλειδιών
  const vretheisanLexeis: string[] = [];
  const egkyresLexeis = lexeisKleidia.filter((lk) => kanonikopoiise_fwnitika(lk).length > 0);

  for (const lk of egkyresLexeis) {
    const lkKanoniki = kanonikopoiise_fwnitika(lk);
    if (elegxos_lexis_kleidi(lkKanoniki, apantisiKanoniki, apantisiTokens)) {
      vretheisanLexeis.push(lk);
    }
  }

  // Levenshtein ομοιότητα μεταξύ πλήρους απάντησης και στόχου
  const omoiotitaLevenshtein = ypologise_omoiotita_levenshtein(apantisiKanoniki, stoxosKanoniki);

  let pososto: number;

  if (apantisiKanoniki === stoxosKanoniki) {
    pososto = 100;
  } else if (egkyresLexeis.length > 0) {
    const posostoKeywords = vretheisanLexeis.length / egkyresLexeis.length;
    // Στάθμιση: 40% Levenshtein γενικής απάντησης + 60% κάλυψη λέξεων-κλειδιών
    const synoliko = 0.4 * omoiotitaLevenshtein + 0.6 * posostoKeywords;
    pososto = Math.min(100, Math.max(0, Math.round(synoliko * 100)));
  } else {
    // Χωρίς λέξεις-κλειδιά, βασίζεται αποκλειστικά στην ομοιότητα Levenshtein
    pososto = Math.min(100, Math.max(0, Math.round(omoiotitaLevenshtein * 100)));
  }

  return {
    posostoOmoiotitas: pososto,
    epityxia: pososto >= KATWFLI_EPITYXIAS_FWNITIKIS,
    vretheisanLexeis,
  };
}
