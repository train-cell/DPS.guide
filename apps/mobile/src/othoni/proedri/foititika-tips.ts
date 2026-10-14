/** Practical onboarding tips that describe only implemented DPS.guide behavior. */
/** Default tip used if the daily date calculation receives an invalid date. */
export const PROEPILOGMENO_TIP =
  '📥 Συγχρόνισε ένα μάθημα όσο έχεις σύνδεση· η λήψη και η εξαγωγή αρχείων γίνονται στη συσκευή.';

/** Locally stored as a frozen collection so the onboarding tip remains deterministic for the day. */
export const FOITITIKA_TIPS: readonly string[] = Object.freeze([
  PROEPILOGMENO_TIP,
  '📴 Τα μαθήματα και τα αρχεία που έχουν ήδη συγχρονιστεί παραμένουν διαθέσιμα στη συσκευή και χωρίς σύνδεση.',
  '🔐 Το master password προστατεύει κρυπτογραφικά τα μαθήματα, τις ρυθμίσεις και τα αρχεία του τοπικού vault.',
  '🗝️ Φύλαξε το recovery key χωριστά από τη συσκευή· μπορεί να ξεκλειδώσει το vault αν ξεχάσεις το master password.',
  '💾 Το backup είναι χειροκίνητο και κρυπτογραφημένο. Για μεταφορά σε άλλη συσκευή χρειάζεσαι το backup και τον κωδικό του.',
  '🌐 Το Gemini λαμβάνει περιεχόμενο μαθήματος μόνο με opt-in ανά μάθημα και επιβεβαίωση κάθε ακριβούς prompt.',
  '🖥️ Το Ollama λειτουργεί μόνο στον ίδιο Windows/macOS υπολογιστή· οι native εφαρμογές κινητού δεν συνδέονται σε αυτό.',
  '🔎 Το OCR για σαρωμένα PDF εκτελείται τοπικά και υποστηρίζει ελληνικά και αγγλικά.',
  '🔔 Οι native εφαρμογές μπορούν να προγραμματίζουν ειδοποιήσεις όταν είναι κλειστές· στον browser λειτουργούν όσο μένει ενεργή η σελίδα.',
  '🏫 Υποστηρίζονται τα standard Open eClass και Moodle. Τα SSO-only και custom portals εμφανίζονται ως μη υποστηριζόμενα.',
]);

/**
 * Epistrefei ena tyxaio foititiko tip apo ti syllogi.
 * @param tyxaio Proairetiki synartisi gennitrias tyxaiotitas (proepilogi Math.random).
 */
export function pare_tyxaio_tip(tyxaio: () => number = Math.random): string {
  const arithmos = tyxaio();
  const deiktis = Math.floor(arithmos * FOITITIKA_TIPS.length);
  const asfalisDeiktis = Math.max(0, Math.min(deiktis, FOITITIKA_TIPS.length - 1));
  return FOITITIKA_TIPS[asfalisDeiktis] ?? PROEPILOGMENO_TIP;
}

/**
 * Epistrefei to stathero tip tis imeras vasei tis imerominias.
 * Gia tin idia imera epistrefei panta to idio akrivos tip.
 * @param imerominia Proairetiki imerominia gia dokimes (proepilogi simera).
 */
export function pare_tip_imeras(imerominia: Date = new Date()): string {
  const etos = imerominia.getFullYear();
  const minas = imerominia.getMonth() + 1;
  const imera = imerominia.getDate();
  const kleidi = Math.abs(etos * 372 + minas * 31 + imera) % FOITITIKA_TIPS.length;
  return FOITITIKA_TIPS[kleidi] ?? PROEPILOGMENO_TIP;
}
