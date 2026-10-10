/** Ελάχιστος αριθμός σελίδων ενός συνθετικού εγγράφου. */
export const ELAXISTES_SELIDES_SYNTHETIKOU = 1;

/** Μέγιστος αριθμός σελίδων ενός συνθετικού εγγράφου (λογικό όριο, όχι όριο iOS). */
export const MEGISTES_SELIDES_SYNTHETIKOU = 500;

/** Μήκος πλευράς A4 σε μονάδες PDF, για το MediaBox κάθε σελίδας. */
const PLATOS_A4 = 595;

/** Ύψος πλευράς A4 σε μονάδες PDF, για το MediaBox κάθε σελίδας. */
const YPSOS_A4 = 842;

/** Γραμμές κειμένου που χαράσσει κάθε σελίδα του συνθετικού εγγράφου. */
const GRAMMES_SELIDAS = [
  'DPS.guide synthetic test file',
  'generated for UI tests - not course material',
] as const;

/** Ο αριθμός αντικειμένων πριν τις σελίδες: κατάλογος, δέντρο σελίδων, γραμματοσειρά. */
const ANTIKEIMENA_PRO_SELIDON = 3;

/** Ο αριθμός αντικειμένων ανά σελίδα: η σελίδα και το περιεχόμενό της. */
const ANTIKEIMENA_ANA_SELIDA = 2;

/** Φτιάχνει το σώμα περιεχομένου μιας σελίδας: κείμενο με τον αριθμό της, χωρίς συμπίεση. */
function soma_periexomenou(arithmosSelidas: number, synoloSelidon: number): string {
  const grammes = [
    'BT',
    '/F1 20 Tf',
    `72 ${YPSOS_A4 - 62} Td`,
    `(${GRAMMES_SELIDAS[0]}) Tj`,
    '0 -36 Td',
    `(page ${arithmosSelidas} of ${synoloSelidon}) Tj`,
    '0 -24 Td',
    `(${GRAMMES_SELIDAS[1]}) Tj`,
    'ET',
  ];
  return grammes.join('\n');
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
