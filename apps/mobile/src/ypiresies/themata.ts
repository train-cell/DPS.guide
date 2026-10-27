import type { AntistoixisiThematos, ApothikiPyli, Apotelesma } from '@dps/core';
import { ok, ypologise_apodosi } from '@dps/core';
import { katagrapse_tilemetria, me_tilemetria } from '../tilemetria/tilemetria.js';

/**
 * Διαδρομή φακέλου παλιών θεμάτων ενός μαθήματος στο vault.
 */
export function diadromi_thematon(kodikos: string): string {
  return `${kodikos}/themata`;
}

/**
 * Διαδρομή αρχείου απόδοσης ενοτήτων ενός μαθήματος στο vault.
 */
export function diadromi_apodosis(kodikos: string): string {
  return `${kodikos}/apodosi.json`;
}

/**
 * Βρίσκει τα διαθέσιμα αρχεία θεμάτων στο φάκελο `${kodikos}/themata`.
 */
export async function fortose_themata_arxeia(
  apothiki: ApothikiPyli,
  kodikos: string
): Promise<string[]> {
  const apotelesma = await apothiki.lista(diadromi_thematon(kodikos));
  if (!apotelesma.ok) {
    return [];
  }
  return apotelesma.timi;
}

/**
 * Διαβάζει το `${kodikos}/apodosi.json` (τύπου `Record<string, number>`).
 * Αν το αρχείο λείπει ή δεν είναι έγκυρο JSON, επιστρέφει κενό αντικείμενο `{}`.
 */
export async function fortose_apodosi(
  apothiki: ApothikiPyli,
  kodikos: string
): Promise<Record<string, number>> {
  const apotelesma = await apothiki.diavase_keimeno(diadromi_apodosis(kodikos));
  if (!apotelesma.ok) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(apotelesma.timi);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const katharismeno: Record<string, number> = {};
    for (const [kleidi, timi] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof timi === 'number' && Number.isFinite(timi)) {
        katharismeno[kleidi] = timi;
      }
    }
    return katharismeno;
  } catch (sfalma) {
    katagrapse_tilemetria('warn', 'Apotyxia parsing arxeiou apodosis JSON', {
      kodikos,
      sfalma: sfalma instanceof Error ? sfalma.message : String(sfalma),
    });
    return {};
  }
}

/**
 * Αποθηκεύει την απόδοση στο vault (`${kodikos}/apodosi.json`).
 */
export async function apothikefse_apodosi(
  apothiki: ApothikiPyli,
  kodikos: string,
  apodosi: Record<string, number>
): Promise<Apotelesma<void>> {
  return apothiki.grapse_keimeno(
    diadromi_apodosis(kodikos),
    JSON.stringify(apodosi, null, 2)
  );
}

/**
 * Καλεί την καθαρή `ypologise_apodosi(antistoixiseis)` από το `@dps/core` (50/50 boundary)
 * και αποθηκεύει το αποτέλεσμα στο vault.
 */
export async function ypologise_kai_apothikefse_apodosi(
  apothiki: ApothikiPyli,
  kodikos: string,
  antistoixiseis: AntistoixisiThematos[]
): Promise<Apotelesma<Record<string, number>>> {
  return me_tilemetria(
    'ypologise_kai_apothikefse_apodosi',
    async () => {
      const ypologismos = ypologise_apodosi(antistoixiseis);
      if (!ypologismos.ok) {
        return ypologismos;
      }
      const apothikefsi = await apothikefse_apodosi(apothiki, kodikos, ypologismos.timi);
      if (!apothikefsi.ok) {
        return apothikefsi;
      }
      return ok(ypologismos.timi);
    },
    { kodikos, arithmosThematon: antistoixiseis.length }
  );
}
