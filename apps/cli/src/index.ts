#!/usr/bin/env node
import { KODIKOS_EXODOU_SFALMA } from './argv/statheroi-argv.js';
import { trexe_entoles } from './eksodiki.js';
import { dimiourgise_eksodosi } from './eksodos/eksodosi.js';
import { dimiourgise_eisodos } from './stathimes/eisodos-pipeline.js';

/**
 * Σημείο εισόδου του `dps-guide` (βλ. `bin` στο package.json).
 *
 * Μοιράζεται τις ροές της διεργασίας: τα αποτελέσματα στο stdout, τα σφάλματα και
 * τα logs του pipeline στο stderr, ώστε `--json` να παραμένει μία καθαρή εγγραφή.
 */
export async function main(argv: readonly string[]): Promise<number> {
  return trexe_entoles(argv, {
    dimiourgise_eisodos: dimiourgise_eisodos,
    eksodosi: dimiourgise_eksodosi(
      (grammi) => {
        process.stdout.write(`${grammi}\n`);
      },
      (grammi) => {
        process.stderr.write(`${grammi}\n`);
      }
    ),
  });
}

/** Η διεργασία που εκτελεί αυτό το αρχείο (για να μην τρέχει στα tests). */
function einai_to_arxeio_trexomeno(): boolean {
  const dromi = process.argv[1];
  if (dromi === undefined) {
    return false;
  }
  try {
    return import.meta.url === new URL(`file://${dromi.replace(/\\/g, '/')}`).href;
  } catch {
    return false;
  }
}

if (einai_to_arxeio_trexomeno()) {
  // Ζώνη ασφαλείας: καμία rejected promise δεν πρέπει να μείνει χωρίς χειριστή.
  main(process.argv.slice(2)).then(
    (kodikos) => {
      process.exitCode = kodikos;
    },
    (sfalma: unknown) => {
      process.stderr.write(`Σφάλμα [AGNOSTO]: ${String(sfalma)}\n`);
      process.exitCode = KODIKOS_EXODOU_SFALMA;
    }
  );
}
