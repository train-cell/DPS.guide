/**
 * Foititika Tips & Memes gia tin othoni proedri (onboarding).
 * Afthentika tips foititikis zois me Bevel x UniStudents aisthetiki.
 * Ypostirizei stathero tip imeras kai tyxaia enallagi.
 */

/** Proepilegmeno tip gia periptosi kenis syllogis i anapantexou apotelesmatos. */
export const PROEPILOGMENO_TIP =
  '☕ Ο διπλός freddo espresso δεν αντικαθιστά τον ύπνο, αλλά στο 23:58 πριν την παράδοση στο eClass κάνει θαύματα.';

/** Pinakas me 10 afthentika foititika tips kai memes gia to DPS.guide. */
export const FOITITIKA_TIPS: readonly string[] = Object.freeze([
  PROEPILOGMENO_TIP,
  '⏱️ 23:59:00: Η πιο πολυσύχναστη ώρα στους ελληνικούς ακαδημαϊκούς servers. Ανέβασε στις 23:45 να έχεις το κεφάλι σου ήσυχο!',
  '🔒 Zero-Cloud Local Vault: Τα διαπιστευτήρια και οι βαθμοί σου κρυπτογραφούνται μόνο στη συσκευή σου. Κανένας διακομιστής δεν έχει πρόσβαση.',
  '📊 EWMA & Προβλέψεις: Αν το εκθετικό κινητό μέσο της επίδοσής σου πέσει κάτω από 5.0, το DPS.guide θα σημάνει κόκκινο συναγερμό για διάβασμα.',
  '📚 Παλιά θέματα + διαφάνειες καθηγητή = 80% της επιτυχίας στην εξεταστική. Ο κανόνας Pareto σε πλήρη εφαρμογή.',
  '💡 Το Wi-Fi της σχολής είναι σαν τον γάτο του Schrödinger: υπάρχει και δεν υπάρχει ταυτόχρονα, μέχρι να ανοίξεις το eClass.',
  '🛡️ Hardware-backed keystore: Κανένα cloud, κανένα telemetry. Τα sessions σου μένουν κλειδωμένα στο secure enclave του κινητού.',
  '🍕 2 φέτες χθεσινή πίτσα και debugging στις 3 το πρωί: Η διαχρονική ιεροτελεστία κάθε φοιτητή πληροφορικής.',
  '🎯 Pro-tip: Μην αφήνεις τις δηλώσεις συγγραμμάτων στον Εύδοξο για την τελευταία μέρα της τρίτης παράτασης.',
  '🧠 Spaced Repetition: 15 λεπτά την ημέρα στο DPS.guide νικάνε 14 ώρες πανικού την παραμονή της εξέτασης.',
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
