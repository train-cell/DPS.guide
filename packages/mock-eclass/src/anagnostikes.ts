import fs from 'node:fs/promises';
import type { Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';

const KODIKOS_LEIPEI = 'ENOENT';

function kodikos_sfalmas_afs(sfalma: unknown): string | null {
  if (typeof sfalma === 'object' && sfalma !== null && 'code' in sfalma) {
    const kodikos = (sfalma as { code?: unknown }).code;
    return typeof kodikos === 'string' ? kodikos : null;
  }
  return null;
}

export async function fortise_json_arxeio(diadromi: string): Promise<Apotelesma<unknown>> {
  let keimeno: string;
  try {
    keimeno = await fs.readFile(diadromi, 'utf8');
  } catch (sfalma) {
    if (kodikos_sfalmas_afs(sfalma) === KODIKOS_LEIPEI) {
      return apotyxia(
        'DEN_VRETHIKE',
        `Δεν βρέθηκε το fixture «${diadromi}». Χωρίς fixture η κλήση αποτυγχάνει, δεν επιστρέφει κενή επιτυχία.`,
        sfalma
      );
    }
    return apotyxia('MI_EGKYRO_SXIMA', `Αδυναμία ανάγνωσης του fixture «${diadromi}».`, sfalma);
  }

  try {
    return ok(JSON.parse(keimeno));
  } catch (sfalma) {
    return apotyxia('MI_EGKYRO_SXIMA', `Το fixture «${diadromi}» δεν είναι έγκυρο JSON.`, sfalma);
  }
}

export async function yparxei_fakelos(diadromi: string): Promise<boolean> {
  try {
    const stat = await fs.stat(diadromi);
    return stat.isDirectory();
  } catch {
    return false;
  }
}