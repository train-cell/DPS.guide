import { mkdir, open, readFile, readdir, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Apotelesma, ApothikiPyli } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { karnikopoise_diadromi } from './diadromes.js';

/** Λειτουργία ανοίγματος για fsync πριν το rename.
 *  Χρησιμοποιείται `r+` (όχι `r`) γιατί στα Windows το fsync σε read-only handle επιστρέφει EPERM. */
const LEXI_ANAGNOSIS_SYNC = 'r+';

/** Σταθερός κωδικός aitia όταν ένα σφάλμα Node δεν έχει `code` — ποτέ το raw μήνυμα/path. */
const KODIKOS_FS_AGNOSTO = 'FS';

function kodikos_sfalmatos(sfalma: unknown): string | undefined {
  if (typeof sfalma === 'object' && sfalma !== null && 'code' in sfalma) {
    const kodikos = (sfalma as { code: unknown }).code;
    if (typeof kodikos === 'string') {
      return kodikos;
    }
  }
  return undefined;
}

/** Επιστρέφει ΜΟΝΟ σταθερό errno από σφάλμα Node — ποτέ το raw μήνυμα (leak απόλυτης διαδρομής). */
function aitia_asfalis(sfalma: unknown): string {
  return kodikos_sfalmatos(sfalma) ?? KODIKOS_FS_AGNOSTO;
}

/** Τόποι που αντιστοιχούν σε μια διαδρομή: η πλήρης (riza+σχετική) και η κανονικοποιημένη σχετική
 *  (η τελευταία χρησιμοποιείται στα μηνύματα ώστε να μη διαρρέει απόλυτη διαδρομή). */
interface TopikesDiadromes {
  pliri: string;
  sxetiki: string;
}

/** Flush του νέου αρχείου στο δίσκο πριν το atomic rename (crash safety). */
async function sfragise_arxeio(diadromi: string): Promise<void> {
  const laveri = await open(diadromi, LEXI_ANAGNOSIS_SYNC);
  try {
    await laveri.sync();
  } finally {
    await laveri.close();
  }
}

export class NodeFsApothiki implements ApothikiPyli {
  constructor(private readonly riza: string) {}

  private pliri_diadromi(diadromi: string): Apotelesma<TopikesDiadromes> {
    const karnikis = karnikopoise_diadromi(diadromi);
    if (!karnikis.ok) {
      return karnikis;
    }
    return ok({ pliri: path.join(this.riza, karnikis.timi), sxetiki: karnikis.timi });
  }

  async diavase_keimeno(diadromi: string): Promise<Apotelesma<string>> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return topikes;
    }
    const { pliri, sxetiki } = topikes.timi;
    try {
      const dedomena = await readFile(pliri, 'utf8');
      return ok(dedomena);
    } catch (sfalma) {
      const kodikos = kodikos_sfalmatos(sfalma);
      if (kodikos === 'ENOENT') {
        return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν βρέθηκε: ${sxetiki}`);
      }
      if (kodikos === 'EISDIR') {
        return apotyxia('MI_EGKYRO_SXIMA', `Η διαδρομή είναι φάκελος: ${sxetiki}`);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η ανάγνωση: ${sxetiki}`, aitia_asfalis(sfalma));
    }
  }

  async diavase_dyadiko(diadromi: string): Promise<Apotelesma<Uint8Array>> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return topikes;
    }
    const { pliri, sxetiki } = topikes.timi;
    try {
      const dedomena = await readFile(pliri);
      return ok(new Uint8Array(dedomena));
    } catch (sfalma) {
      const kodikos = kodikos_sfalmatos(sfalma);
      if (kodikos === 'ENOENT') {
        return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν βρέθηκε: ${sxetiki}`);
      }
      if (kodikos === 'EISDIR') {
        return apotyxia('MI_EGKYRO_SXIMA', `Η διαδρομή είναι φάκελος: ${sxetiki}`);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η ανάγνωση: ${sxetiki}`, aitia_asfalis(sfalma));
    }
  }

  async grapse_keimeno(diadromi: string, periexomeno: string): Promise<Apotelesma<void>> {
    // atomic
    const dedomena = new TextEncoder().encode(periexomeno);
    return this.grapse_atomika(diadromi, dedomena);
  }

  async grapse_dyadiko(diadromi: string, dedomena: Uint8Array): Promise<Apotelesma<void>> {
    // atomic
    return this.grapse_atomika(diadromi, dedomena);
  }

  private async grapse_atomika(diadromi: string, dedomena: Uint8Array): Promise<Apotelesma<void>> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return topikes;
    }
    const { pliri: proorismos, sxetiki } = topikes.timi;
    const prosorino = `${proorismos}.tmp-${randomUUID()}`;
    try {
      await mkdir(path.dirname(proorismos), { recursive: true });
      await writeFile(prosorino, dedomena);
      await sfragise_arxeio(prosorino);
      await rename(prosorino, proorismos);
      return ok(undefined);
    } catch (sfalma) {
      return apotyxia('AGNOSTO', `Απέτυχε η εγγραφή: ${sxetiki}`, aitia_asfalis(sfalma));
    } finally {
      await rm(prosorino, { force: true }).catch(() => undefined);
    }
  }

  async yparxei(diadromi: string): Promise<boolean> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return false;
    }
    try {
      const statistiko = await stat(topikes.timi.pliri);
      return statistiko.isFile();
    } catch {
      return false;
    }
  }

  async lista(fakelos: string): Promise<Apotelesma<string[]>> {
    const karnikis = karnikopoise_diadromi(fakelos);
    if (!karnikis.ok) {
      return karnikis;
    }
    const arxeia = await this.pernigai_fakelo(karnikis.timi);
    if (!arxeia.ok) {
      return arxeia;
    }
    return ok(arxeia.timi.sort());
  }

  private async pernigai_fakelo(fakelos: string): Promise<Apotelesma<string[]>> {
    let eggrafes;
    try {
      eggrafes = await readdir(path.join(this.riza, fakelos), { withFileTypes: true });
    } catch (sfalma) {
      if (kodikos_sfalmatos(sfalma) === 'ENOENT') {
        return ok([]);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η ανάγνωση του φακέλου: ${fakelos}`, aitia_asfalis(sfalma));
    }
    const apotelesmata: string[] = [];
    for (const eggrafi of eggrafes) {
      if (eggrafi.isDirectory()) {
        const ypokatalogos = await this.pernigai_fakelo(`${fakelos}/${eggrafi.name}`);
        if (!ypokatalogos.ok) {
          return ypokatalogos;
        }
        apotelesmata.push(...ypokatalogos.timi);
        continue;
      }
      if (eggrafi.isFile()) {
        apotelesmata.push(`${fakelos}/${eggrafi.name}`);
      }
    }
    return ok(apotelesmata);
  }

  async diagrafi(diadromi: string): Promise<Apotelesma<void>> {
    const topikes = this.pliri_diadromi(diadromi);
    if (!topikes.ok) {
      return topikes;
    }
    const { pliri, sxetiki } = topikes.timi;
    try {
      await unlink(pliri);
      return ok(undefined);
    } catch (sfalma) {
      if (kodikos_sfalmatos(sfalma) === 'ENOENT') {
        return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν υπάρχει: ${sxetiki}`);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η διαγραφή: ${sxetiki}`, aitia_asfalis(sfalma));
    }
  }
}
