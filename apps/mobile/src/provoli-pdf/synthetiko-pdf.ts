/** Ελάχιστος αριθμός σελίδων ενός συνθετικού εγγράφου. */
export const ELAXISTES_SELIDES_SYNTHETIKOU = 1;

/** Μέγιστος αριθμός σελίδων ενός συνθετικού εγγράφου (λογικό όριο, όχι όριο iOS). */
export const MEGISTES_SELIDES_SYNTHETIKOU = 500;

/** Μήκος πλευράς A4 σε μονάδες PDF, για το MediaBox κάθε σελίδας. */
const PLATOS_A4 = 595;

/** Ύψος πλευράς A4 σε μονάδες PDF, για το MediaBox κάθε σελίδας. */
const YPSOS_A4 = 842;

/** Γραμμές κειμένου που δηλώνουν ρητά το συνθετικό χαρακτήρα του αρχείου (§3.9). */
const GRAMMES_SELIDAS = [
  'DPS.guide synthetic test file',
  'generated for UI tests - not course material',
] as const;

/** Δομή ακαδημαϊκού περιεχομένου ανά κεφάλαιο για το συνθετικό έγγραφο. */
interface KefalaioMathimatos {
  readonly titlosKefalaiou: string;
  readonly theoriaTitlos: string;
  readonly theoriaGrammes: readonly string[];
  readonly diagrammaTitlos: string;
  readonly diagrammaGrammes: readonly string[];
  readonly kodikasTitlos: string;
  readonly kodikasGrammes: readonly string[];
  readonly simeioseis: readonly string[];
}

/** Σύνολο ακαδημαϊκών κεφαλαίων του μαθήματος ΠΛΗ201. */
const KEFALAIA_MATHIMATOS: readonly KefalaioMathimatos[] = [
  {
    titlosKefalaiou: 'Kefalaio 1: Vasikes Ennoies & Domes Dedomenon',
    theoriaTitlos: '1. Vasiko Montelo Ypologisti & Mnimi',
    theoriaGrammes: [
      '* O ypologistis apoteleitai apo Kentriki Monada (CPU), Mnimi (RAM) kai Diavlo (Bus).',
      '* Kathe metavliti desmevei synexomeno tmima bytes me monadiki dieuthynsi.',
      '* Typoi: int (4 bytes, -2^31 eos 2^31-1), double (8 bytes, IEEE 754), char (1 byte).',
      '* Vasiki Arxi: Arxikopoiisi metavliton prin tin anagnosi apotrepei undefined behavior.',
    ],
    diagrammaTitlos: 'Diagramma Rois & Metaglottisis',
    diagrammaGrammes: [
      '+-------------------+      +-------------------+      +-------------------+',
      '|  Source (.c)      | ---> |  Clang Compiler   | ---> |  Object (.o)      |',
      '+-------------------+      +-------------------+      +-------------------+',
      '                                                                |        ',
      '                                                                v        ',
      '+-------------------+      +-------------------+      +-------------------+',
      '|  Execution (ELF)  | <--- |  Linker (ld)      | <--- |  libc.so System   |',
      '+-------------------+      +-------------------+      +-------------------+',
    ],
    kodikasTitlos: 'Paradeigma 1.1: Arxikopoiisi & Ektyposi Dedomenon',
    kodikasGrammes: [
      '#include <stdio.h>',
      '',
      'int main(void) {',
      '    const int etos = 2026;',
      '    const double vathmos = 9.50;',
      '    printf("DPS.guide PLH201 Academic Test [Etos: %d]\\n", etos);',
      '    printf("Synolo vathmologias: %.2f\\n", vathmos);',
      '    return 0;',
      '}',
    ],
    simeioseis: [
      '* Shmeiosi Ergastiriou: Kathe metavliti prepei na dilonetai me ton akrivei typo.',
      '* Apofygete magikous arithmous sto soma ton sinartiseon.',
    ],
  },
  {
    titlosKefalaiou: 'Kefalaio 2: Domes Elegxou, Synthikes & Epanalipseis',
    theoriaTitlos: '2. Logikes Ekfraseis & Vroxoi Ektelesis',
    theoriaGrammes: [
      '* Domes epilogis (if, else if, switch) kateuthynoun ti roi tou programmatos.',
      '* Vroxoi for, while kai do-while ekteloun block entolon oso isxyei i synthiki.',
      '* Loop Invariant: Synthiki pou paramenei alithis prin kai meta apo kathe epanalipsi.',
      '* Termatismos: Kathe epanalipsi ofeilei na sygklinei sto orio termatismou tou vroxou.',
    ],
    diagrammaTitlos: 'Diagramma Ektelesis Vroxou For',
    diagrammaGrammes: [
      '+-------------------------------------------------------------------------+',
      '|  [Arxikopoiisi: i = 0] ---> [Elegxos Synthikis: i < N ?]                |',
      '|                                    |               |                   |',
      '|                           Alithes  |               | Pseudes           |',
      '|                                    v               v                   |',
      '|                            [Soma Vroxou]     [Exodos apo ton Vroxo]    |',
      '|                                    |                                   |',
      '|                                    v                                   |',
      '|                            [Vima: i = i + 1] -> (Epanalipsi elegxou)   |',
      '+-------------------------------------------------------------------------+',
    ],
    kodikasTitlos: 'Paradeigma 2.1: Grammiki Anazitisi stoixeiou',
    kodikasGrammes: [
      'int anazitisi(const int* pinakas, int n, int stoxos) {',
      '    for (int i = 0; i < n; i++) {',
      '        if (pinakas[i] == stoxos) {',
      '            return i; /* Vrethike stin thesi i */',
      '        }',
      '    }',
      '    return -1; /* Den vrethike */',
      '}',
    ],
    simeioseis: [
      '* Poliplokotita: I grammiki anazitisi apaitei O(n) sygkriseis sto xeirotero senario.',
      '* Sto ergastirio elegxoume panta tin periptosi kenou pinaka (n <= 0).',
    ],
  },
  {
    titlosKefalaiou: 'Kefalaio 3: Deiktes (Pointers) & Dynamiki Mnimi',
    theoriaTitlos: '3. Montelo Mnimis: Stack, Heap kai Dieuthynsiodeiktes',
    theoriaGrammes: [
      '* Deiktis: Metavliti pou apothikevei ti dieuthynsi mnimis allis metavlitis.',
      '* Telesths dieuthynsis (&) kai telesths apodeiktiodotisis (*).',
      '* Dynamiki desmeusi: malloc/calloc desmevoun synexomena bytes apo to Heap.',
      '* Apeleytherosi: Kathe desmevsi me malloc apaitei antistoixi klisi free.',
    ],
    diagrammaTitlos: 'Architektoniki Mnimis Diegasias',
    diagrammaGrammes: [
      '+-------------------------------------------------------------------------+',
      '|  [STACK]:    Topikes metavlites, stack frames klisis    | Pros ta kato  |',
      '|                                                        v               |',
      '|  [HEAP]:     Dynamika desmevmeni mnimi (malloc/free)   ^ Pros ta pano  |',
      '|                                                        |               |',
      '|  [DATA/BSS]: Statistikes kai katholikes metavlites                     |',
      '|  [TEXT]:     Entoles ektelesimou mixanis (Read-Only)                    |',
      '+-------------------------------------------------------------------------+',
    ],
    kodikasTitlos: 'Paradeigma 3.1: Asfalis Desmevsi & Apeleytherosi Mnimis',
    kodikasGrammes: [
      'int* desmefse_pinaka(size_t megethos) {',
      '    int* deiktis = (int*)malloc(megethos * sizeof(int));',
      '    if (deiktis == NULL) {',
      '        fprintf(stderr, "Sfalma: Adynamia desmevsis mnimis!\\n");',
      '        return NULL;',
      '    }',
      '    return deiktis;',
      '}',
    ],
    simeioseis: [
      '* Mnemonikos Kanonas Zero-Leaks: Mnimi pou den apodesmevetai paramenei desmevmeni.',
      '* Dokimaste panta tis efarmoges sas me to ergaleio Valgrind / LeakSanitizer.',
    ],
  },
  {
    titlosKefalaiou: 'Kefalaio 4: Sinartiseis, Anadromi & Stoiva Kliseon',
    theoriaTitlos: '4. Modular Design & Anadromiki Epilysi Provlimaton',
    theoriaGrammes: [
      '* Sinartisi: Aftonomi enotita kodika me orismata kai epistrefomeni timi.',
      '* Klisi kata timi (pass-by-value) vs klisi kata dieuthynsi (pass-by-reference).',
      '* Anadromi: Sinartisi pou kalei ton eafto tis me mikrotero ypoprovlima.',
      '* Vasi Anadromis (Base Case): Kairia synthiki pou apotrepei tin atermoni anadromi.',
    ],
    diagrammaTitlos: 'Stoiva Kliseon Anadromis: Paragontiko 3!',
    diagrammaGrammes: [
      '+-------------------------------------------------------------------------+',
      '|  [Klisi 1]: fact(3) -> anamoni gia 3 * fact(2)                         |',
      '|    [Klisi 2]: fact(2) -> anamoni gia 2 * fact(1)                       |',
      '|      [Klisi 3]: fact(1) -> anamoni gia 1 * fact(0)                     |',
      '|        [Klisi 4 - VASI]: fact(0) = 1 (Epistrofi timis)                 |',
      '|      [Resolving]: 1 * 1 = 1  ==>  2 * 1 = 2  ==>  3 * 2 = 6            |',
      '+-------------------------------------------------------------------------+',
    ],
    kodikasTitlos: 'Paradeigma 4.1: Anadromiko Paragontiko me Elegxo Vasikou Oriou',
    kodikasGrammes: [
      'unsigned long long paragontiko(unsigned int n) {',
      '    if (n == 0 || n == 1) {',
      '        return 1ULL; /* Vasi anadromis */',
      '    }',
      '    return (unsigned long long)n * paragontiko(n - 1);',
      '}',
    ],
    simeioseis: [
      '* Prosoxi sto Stack Overflow: Kathe anadromiki klisi katanalonei xoro sti stoiva.',
      '* Gia megala n protimeitai i anadromi ouras (tail recursion) i epanaliptiki morfi.',
    ],
  },
];

/** Μετατρέπει συμβολοσειρά σε ασφαλές κείμενο PDF (διαφυγή παρενθέσεων). */
function asfalis_pdf_keimeno(keimeno: string): string {
  return keimeno.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Ο αριθμός αντικειμένων πριν τις σελίδες: κατάλογος, δέντρο σελίδων, γραμματοσειρά. */
const ANTIKEIMENA_PRO_SELIDON = 3;

/** Ο αριθμός αντικειμένων ανά σελίδα: η σελίδα και το περιεχόμενό της. */
const ANTIKEIMENA_ANA_SELIDA = 2;

/** Φτιάχνει το σώμα περιεχομένου μιας σελίδας: κείμενο με τον αριθμό της, χωρίς συμπίεση. */
function soma_periexomenou(arithmosSelidas: number, synoloSelidon: number): string {
  const deiktisKefalaiou = (arithmosSelidas - 1) % KEFALAIA_MATHIMATOS.length;
  const kefalaio: KefalaioMathimatos =
    KEFALAIA_MATHIMATOS[deiktisKefalaiou] ?? (KEFALAIA_MATHIMATOS[0] as KefalaioMathimatos);

  const sxedia: string[] = [
    // Header box
    '0.94 0.96 0.99 rg',
    '45 745 505 58 re f',
    '0.23 0.51 0.96 RG',
    '1.2 w',
    '45 745 505 58 re S',

    // Theory box
    '0.98 0.98 0.99 rg',
    '45 590 505 142 re f',
    '0.82 0.85 0.90 RG',
    '0.8 w',
    '45 590 505 142 re S',

    // Diagram box
    '0.95 0.96 0.97 rg',
    '45 425 505 152 re f',
    '0.80 0.83 0.88 RG',
    '0.8 w',
    '45 425 505 152 re S',

    // Code container box
    '0.11 0.13 0.16 rg',
    '45 195 505 218 re f',
    '0.25 0.30 0.38 RG',
    '0.8 w',
    '45 195 505 218 re S',

    // Laboratory note box
    '0.99 0.98 0.94 rg',
    '45 95 505 88 re f',
    '0.88 0.72 0.35 RG',
    '0.8 w',
    '45 95 505 88 re S',

    // Footer divider line
    '0.75 0.78 0.82 RG',
    '0.5 w',
    '45 72 m 550 72 l S',
  ];

  const grammesBT: string[] = ['BT'];

  // 1. Header Text
  grammesBT.push('0.15 0.25 0.65 rg');
  grammesBT.push('/F1 13 Tf');
  grammesBT.push('56 784 Td');
  grammesBT.push(`(${asfalis_pdf_keimeno('PLH201: Eisagogi ston Programmatismo (Introduction to Programming)')}) Tj`);

  grammesBT.push('0.35 0.40 0.50 rg');
  grammesBT.push('/F1 9 Tf');
  grammesBT.push('0 -15 Td');
  grammesBT.push(`(${asfalis_pdf_keimeno('Panepistimio Peiraios - Tmima Pliroforikis | Akadimaiko Etos 2026-2027')}) Tj`);

  grammesBT.push('0.20 0.20 0.25 rg');
  grammesBT.push('/F1 10 Tf');
  grammesBT.push('0 -15 Td');
  grammesBT.push(`(${asfalis_pdf_keimeno(kefalaio.titlosKefalaiou)}) Tj`);

  // 2. Theory Text
  grammesBT.push('0.15 0.25 0.60 rg');
  grammesBT.push('/F1 11 Tf');
  grammesBT.push('0 -38 Td');
  grammesBT.push(`(${asfalis_pdf_keimeno(kefalaio.theoriaTitlos)}) Tj`);

  grammesBT.push('0.20 0.20 0.25 rg');
  grammesBT.push('/F1 8.5 Tf');
  grammesBT.push('14 TL');
  for (const grammi of kefalaio.theoriaGrammes) {
    grammesBT.push('T*');
    grammesBT.push(`(${asfalis_pdf_keimeno(grammi)}) Tj`);
  }

  // 3. Diagram Text
  grammesBT.push('0.15 0.25 0.60 rg');
  grammesBT.push('/F1 11 Tf');
  grammesBT.push('0 -32 Td');
  grammesBT.push(`(${asfalis_pdf_keimeno(kefalaio.diagrammaTitlos)}) Tj`);

  grammesBT.push('0.15 0.18 0.22 rg');
  grammesBT.push('/F1 8 Tf');
  grammesBT.push('13 TL');
  for (const grammi of kefalaio.diagrammaGrammes) {
    grammesBT.push('T*');
    grammesBT.push(`(${asfalis_pdf_keimeno(grammi)}) Tj`);
  }

  // 4. Code Block Text
  grammesBT.push('0.40 0.75 1.00 rg');
  grammesBT.push('/F1 10 Tf');
  grammesBT.push('0 -30 Td');
  grammesBT.push(`(${asfalis_pdf_keimeno(kefalaio.kodikasTitlos)}) Tj`);

  grammesBT.push('0.85 0.90 0.95 rg');
  grammesBT.push('/F1 8 Tf');
  grammesBT.push('12 TL');
  for (const grammi of kefalaio.kodikasGrammes) {
    grammesBT.push('T*');
    grammesBT.push(`(${asfalis_pdf_keimeno(grammi)}) Tj`);
  }

  // 5. Laboratory Notes Text
  grammesBT.push('0.65 0.40 0.10 rg');
  grammesBT.push('/F1 10 Tf');
  grammesBT.push('0 -32 Td');
  grammesBT.push(`(${asfalis_pdf_keimeno('Shmeiosi Ergastiriou & Elegxos Akraion Synthikon')}) Tj`);

  grammesBT.push('0.30 0.25 0.15 rg');
  grammesBT.push('/F1 8.5 Tf');
  grammesBT.push('14 TL');
  for (const grammi of kefalaio.simeioseis) {
    grammesBT.push('T*');
    grammesBT.push(`(${asfalis_pdf_keimeno(grammi)}) Tj`);
  }

  // 6. Footer (Page indicator & synthetic statement required by tests)
  grammesBT.push('0.45 0.48 0.52 rg');
  grammesBT.push('/F1 8 Tf');
  grammesBT.push('0 -42 Td');
  grammesBT.push(`(${GRAMMES_SELIDAS[0]}) Tj`);
  grammesBT.push('0 -12 Td');
  grammesBT.push(`(page ${arithmosSelidas} of ${synoloSelidon}) Tj`);
  grammesBT.push('0 -12 Td');
  grammesBT.push(`(${GRAMMES_SELIDAS[1]}) Tj`);

  grammesBT.push('ET');

  return [...sxedia, ...grammesBT].join('\n');
}

/** Φτιάχνει το αντικείμενο ροής μιας σελίδας με σωστό /Length, χωρίς συμπίεση. */
function antikeimeno_periexomenou(arithmosSelidas: number, synoloSelidon: number): string {
  const keimeno = soma_periexomenou(arithmosSelidas, synoloSelidon);
  return `<< /Length ${keimeno.length} >>\nstream\n${keimeno}\nendstream`;
}

/**
 * Φτιάχνει ένα έγκυρο, ασυμπίεστο PDF με τον ζητούμενο αριθμό σελίδων, χωρίς εξωτερική
 * βιβλιοθήκη. Το κείμενο κάθε σελίδας δηλώνει ρητά ότι είναι συνθετικό, ώστε να μην
 * μπορεί ποτέ να περαστεί για πραγματικό υλικό μαθήματος (κανόνας §3.9).
 */
export function ftiaxe_synthetiko_pdf(zitoumenesSelides: number): Uint8Array {
  const selides = Math.min(
    Math.max(Math.trunc(zitoumenesSelides), ELAXISTES_SELIDES_SYNTHETIKOU),
    MEGISTES_SELIDES_SYNTHETIKOU
  );
  const synoloAntikeimenon = ANTIKEIMENA_PRO_SELIDON + ANTIKEIMENA_ANA_SELIDA * selides;

  const tmimata: string[] = [];
  tmimata[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  const kids = Array.from({ length: selides }, (_, i) => `${ANTIKEIMENA_PRO_SELIDON + 1 + ANTIKEIMENA_ANA_SELIDA * i} 0 R`);
  tmimata[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${selides} >>`;
  tmimata[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  for (let i = 0; i < selides; i++) {
    const arithmosSelidas = i + 1;
    const arithmosAntikeimenouSelidas = ANTIKEIMENA_PRO_SELIDON + 1 + ANTIKEIMENA_ANA_SELIDA * i;
    tmimata[arithmosAntikeimenouSelidas] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PLATOS_A4} ${YPSOS_A4}] ` +
      `/Resources << /Font << /F1 3 0 R >> >> ` +
      `/Contents ${arithmosAntikeimenouSelidas + 1} 0 R >>`;
    tmimata[arithmosAntikeimenouSelidas + 1] = antikeimeno_periexomenou(arithmosSelidas, selides);
  }

  let ekdosi = '%PDF-1.4\n';
  const theseis: number[] = [];
  for (let n = 1; n <= synoloAntikeimenon; n++) {
    theseis[n] = ekdosi.length;
    ekdosi += `${n} 0 obj\n${tmimata[n]}\nendobj\n`;
  }

  const theseiXref = ekdosi.length;
  let xref = `xref\n0 ${synoloAntikeimenon + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= synoloAntikeimenon; n++) {
    xref += `${String(theseis[n]).padStart(10, '0')} 00000 n \n`;
  }

  const teliko =
    `${ekdosi}${xref}trailer\n<< /Size ${synoloAntikeimenon + 1} /Root 1 0 R >>\n` +
    `startxref\n${theseiXref}\n%%EOF\n`;

  const dyadiko = new Uint8Array(teliko.length);
  for (let i = 0; i < teliko.length; i++) {
    dyadiko[i] = teliko.charCodeAt(i) & 0xff;
  }
  return dyadiko;
}
