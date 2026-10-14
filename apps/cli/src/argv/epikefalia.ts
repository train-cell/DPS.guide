import { ENTOLES } from '../entoles/entoles.js';
import {
  PLATOS_ONDOMATOS_ENTOLIS,
  RIZA_PROEDROPIA,
  SEMA_JSON,
  SEMA_MONTELO,
  SEMA_RIZA,
  SEMA_VOITHEIA,
  SEMA_VOITHEIA_MIKRI,
} from './statheroi-argv.js';

/** Στοίχιση του ονόματος εντολής σε σταθερό πλάτος, ώστε η βοήθεια να είναι ευανάγνωστη. */
function stoixisi(keimeno: string): string {
  return keimeno.padEnd(PLATOS_ONDOMATOS_ENTOLIS, ' ');
}

/** Μία γραμμή «όνομα εντολής + υποχρεωτικά ορίσματα». */
function grammi_entolhs(entoli: (typeof ENTOLES)[number]): string {
  const onoma = stoixisi(entoli.onoma);
  const argia = entoli.argia
    .map((argo) => (argo.upoxreitai ? `<${argo.onoma}>` : `[${argo.onoma}]`))
    .join(' ');
  return `  ${onoma} ${argia}`;
}

/** Το κείμενο βοήθειας (`--help` / `-h`) — η μοναδική πηγή αλήθειας για τη χρήση. */
export function keimako_xeysisimaton(): string[] {
  const grammmes: string[] = [
    'dps-guide — CLI του DPS.guide για Windows (Node, χωρίς backend).',
    '',
    'Χρήση:',
    '  dps-guide <εντολή> [ορίσματα] [σημαίες]',
    '',
    'Εντολές:',
  ];
  for (const entoli of ENTOLES) {
    grammmes.push(grammi_entolhs(entoli));
  }
  grammmes.push('');
  grammmes.push('Σημαίες:');
  grammmes.push(`  ${SEMA_VOITHEIA}, ${SEMA_VOITHEIA_MIKRI}   Αυτή η βοήθεια (έξοδος 0).`);
  grammmes.push(
    `  ${SEMA_RIZA} <διαδρομή>  Ρίζα αποθήκευσης (προεπιλογή: ${RIZA_PROEDROPIA}).`
  );
  grammmes.push(
    `  ${SEMA_MONTELO} <όνομα>  Συμβατότητα παλιών scripts· δεν ενεργοποιεί παραγωγή AI από το CLI.`
  );
  grammmes.push(
    `  ${SEMA_JSON}            Μία εγγραφή JSON στο stdout ({"ok":true,…} ή {"ok":false,"sfalma":{…}}).`
  );
  grammmes.push('');
  grammmes.push('Μεταβλητές περιβάλλοντος (fallback μυστικών):');
  grammmes.push('  ECLASS_USERNAME, ECLASS_PASSWORD');
  grammmes.push('');
  grammmes.push('Κωδικοί εξόδου: 0 επιτυχία · 1 σφάλμα ή λανθασμένη χρήση.');
  return grammmes;
}
