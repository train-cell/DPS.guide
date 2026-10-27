/**
 * Μονάδα Αυτόματης Παραγωγής Μνημονικών Κανόνων (Automated Mnemonics Engine).
 *
 * Ακολουθεί πιστά το 50/50 Boundary:
 * - Το pure TypeScript domain module αναλαμβάνει τον ντετερμινιστικό καθαρισμό,
 *   την εξαγωγή ακρωνυμίων, την κατανομή όρων και τη σύνταξη αυστηρού prompt.
 * - Το LLM χρησιμοποιείται αποκλειστικά για text synthesis/φρασεολογία,
 *   αποκλείοντας μαθηματικά hallucinations και αυθαίρετες αλλοιώσεις ορισμών.
 */

export type EidosMnemonikou = 'akronymio' | 'peg_system' | 'istoria';

export interface MnemonikoAitima {
  readonly oroi: readonly string[];
  readonly eidos: EidosMnemonikou;
  readonly glossa?: 'el' | 'en';
  readonly thema?: string;
  readonly perigrafi_orwn?: Readonly<Record<string, string>>;
}

export interface KataskeviAkronymioResult {
  readonly akronymio: string;
  readonly katanomi: Record<string, string[]>;
}

export interface MnemonikoApotelesma {
  readonly akronymio?: string;
  readonly katanomi?: Record<string, string[]>;
  readonly eidos: EidosMnemonikou;
  readonly prompt_synthesis: string;
  readonly odigies_synthesis: readonly string[];
}

/** Χάρτης κανονικοποίησης τονισμένων ελληνικών γραμμάτων σε κεφαλαία άτονα */
const ELLINIKOI_TONOI: Readonly<Record<string, string>> = Object.freeze({
  'Ά': 'Α',
  'Έ': 'Ε',
  'Ή': 'Η',
  'Ί': 'Ι',
  'Ϊ': 'Ι',
  'Ό': 'Ο',
  'Ύ': 'Υ',
  'Ϋ': 'Υ',
  'Ώ': 'Ω',
  'ά': 'Α',
  'έ': 'Ε',
  'ή': 'Η',
  'ί': 'Ι',
  'ϊ': 'Ι',
  'ΐ': 'Ι',
  'ό': 'Ο',
  'ύ': 'Υ',
  'ϋ': 'Υ',
  'ΰ': 'Υ',
  'ώ': 'Ω',
});

/**
 * Κανονικοποιεί ένα γράμμα σε κεφαλαίο άτονο χαρακτήρα (υποστηρίζει ελληνικά και λατινικά).
 */
function kanonikopoiisi_xaraktira(char: string): string {
  const tonismeno = ELLINIKOI_TONOI[char];
  if (tonismeno !== undefined) {
    return tonismeno;
  }
  return char
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/**
 * Παράγει ακρωνύμιο και κατανομή όρων ανά αρχικό γράμμα.
 *
 * @param oroi Πίνακας όρων/εννοιών προς απομνημόνευση.
 * @returns Το παραγόμενο ακρωνύμιο και λεξικό κατανομής όρων ανά αρχικό γράμμα.
 */
export function parage_akronymio_kai_leikseis(oroi: readonly string[]): KataskeviAkronymioResult {
  const katharoiOroi = oroi
    .map((oros) => oros.trim())
    .filter((oros) => oros.length > 0);

  if (katharoiOroi.length === 0) {
    return {
      akronymio: '',
      katanomi: {},
    };
  }

  const katanomi: Record<string, string[]> = {};
  const grammataAkronymio: string[] = [];

  for (const oros of katharoiOroi) {
    const protoXaraktiras = oros[0];
    if (!protoXaraktiras) continue;
    const protoGramma = kanonikopoiisi_xaraktira(protoXaraktiras);
    grammataAkronymio.push(protoGramma);

    if (!katanomi[protoGramma]) {
      katanomi[protoGramma] = [];
    }
    katanomi[protoGramma].push(oros);
  }

  return {
    akronymio: grammataAkronymio.join(''),
    katanomi,
  };
}

/**
 * Κατασκευάζει ένα αυστηρό, δομημένο prompt για LLM NLP synthesis.
 *
 * Εγγυάται μηδενικά μαθηματικά hallucinations και σεβασμό των τεχνικών ορισμών.
 */
export function kataskevase_prompt_mnemonikou(aitima: MnemonikoAitima): string {
  const { oroi, eidos, thema, perigrafi_orwn } = aitima;
  const katharoiOroi = oroi.map((o) => o.trim()).filter((o) => o.length > 0);

  const grammesPrompt: string[] = [
    '=== DPS MNEMONIC CO-PILOT SPECIFICATION ===',
    'ΡΟΛΟΣ: Είσαι ο εξειδικευμένος DPS Mnemonic Co-Pilot για φοιτητές πανεπιστημίων πληροφορικής & πολυτεχνείων.',
    'ΑΥΣΤΗΡΟΙ ΚΑΝΟΝΕΣ:',
    '1. Ακεραιότητα Εννοιών: Χρησιμοποίησε τους όρους ακριβώς όπως δίνονται, χωρίς αλλοίωση της τεχνικής τους σημασίας.',
    '2. 50/50 Boundary: Μην εκτελείς μαθηματικούς υπολογισμούς ή αλλοιώσεις αριθμητικών σταθερών.',
    '3. Περιεκτικότητα: Δημιούργησε αξιομνημόνευτο, ευχάριστο και άμεσο εκπαιδευτικό υλικό χωρίς περιττά εισαγωγικά σχόλια.',
    '',
  ];

  if (thema) {
    grammesPrompt.push(`ΘΕΜΑΤΙΚΟ ΠΛΑΙΣΙΟ: ${thema}`);
    grammesPrompt.push('');
  }

  grammesPrompt.push('ΟΡΟΙ ΠΡΟΣ ΑΠΟΜΝΗΜΟΝΕΥΣΗ:');
  katharoiOroi.forEach((oros, index) => {
    const perigrafi = perigrafi_orwn?.[oros];
    if (perigrafi) {
      grammesPrompt.push(`${index + 1}. ${oros} (${perigrafi})`);
    } else {
      grammesPrompt.push(`${index + 1}. ${oros}`);
    }
  });
  grammesPrompt.push('');

  if (eidos === 'akronymio') {
    const { akronymio, katanomi } = parage_akronymio_kai_leikseis(katharoiOroi);
    grammesPrompt.push(`ΕΙΔΟΣ ΜΝΗΜΟΝΙΚΟΥ: Ακρωνύμιο & Φράση-Κλειδί`);
    grammesPrompt.push(`ΑΚΡΩΝΥΜΙΟ ΣΤΟΧΟΣ: ${akronymio}`);
    grammesPrompt.push('ΑΝΤΙΣΤΟΙΧΙΣΗ ΟΡΩΝ:');
    for (const [gramma, lista] of Object.entries(katanomi)) {
      grammesPrompt.push(`  [${gramma}] -> ${lista.join(', ')}`);
    }
    grammesPrompt.push('');
    grammesPrompt.push(
      'ΖΗΤΟΥΜΕΝΟ: Πρότεινε 1-2 ευκολομνημόνευτες ελληνικές λέξεις ή φράσεις που σχηματίζουν το ακρωνύμιο και βοηθούν στην άμεση ανάκληση των όρων.'
    );
  } else if (eidos === 'peg_system') {
    grammesPrompt.push('ΕΙΔΟΣ ΜΝΗΜΟΝΙΚΟΥ: Peg System (Σύστημα Αγκίστρων 1-10)');
    grammesPrompt.push(
      'ΖΗΤΟΥΜΕΝΟ: Σύνδεσε κάθε όρο με τα κλασικά νοητικά άγκιστρα (1: Κερί, 2: Κύκνος, 3: Τρίαινα, κ.ο.κ.) δημιουργώντας έντονες νοητικές εικόνες.'
    );
  } else if (eidos === 'istoria') {
    grammesPrompt.push('ΕΙΔΟΣ ΜΝΗΜΟΝΙΚΟΥ: Μνημονική Ιστορία (Narrative Chaining)');
    grammesPrompt.push(
      'ΖΗΤΟΥΜΕΝΟ: Σύνθεσε μια σύντομη, συνεκτική και διασκεδαστική μικρο-ιστορία 3-5 προτάσεων που συνδέει όλους τους παραπάνω όρους με τη σειρά εμφάνισής τους.'
    );
  }

  grammesPrompt.push('');
  grammesPrompt.push('ΜΟΡΦΟΠΟΙΗΣΗ ΑΠΑΝΤΗΣΗΣ:');
  grammesPrompt.push('- Χρησιμοποίησε καθαρό Markdown με έντονους χαρακτήρες για τους όρους-κλειδιά.');
  grammesPrompt.push('- Απόφυγε generic χαιρετισμούς.');

  return grammesPrompt.join('\n');
}
