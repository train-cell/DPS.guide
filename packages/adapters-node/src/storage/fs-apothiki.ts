import { mkdir, readFile, readdir, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import type { Apotelesma, ApothikiPyli } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { karnikopoise_diadromi } from './diadromes.js';

function kodikos_sfalmatos(sfalma: unknown): string | undefined {
  if (typeof sfalma === 'object' && sfalma !== null && 'code' in sfalma) {
    const kodikos = (sfalma as { code: unknown }).code;
    if (typeof kodikos === 'string') {
      return kodikos;
    }
  }
  return undefined;
}

export class NodeFsApothiki implements ApothikiPyli {
  constructor(private readonly riza: string) {}

  private pliri_diadromi(diadromi: string): Apotelesma<string> {
    const karnikis = karnikopoise_diadromi(diadromi);
    if (!karnikis.ok) {
      return karnikis;
    }
    return ok(path.join(this.riza, karnikis.timi));
  }

  async diavase_keimeno(diadromi: string): Promise<Apotelesma<string>> {
    const pliri = this.pliri_diadromi(diadromi);
    if (!pliri.ok) {
      return pliri;
    }
    try {
      const dedomena = await readFile(pliri.timi, 'utf8');
      return ok(dedomena);
    } catch (sfalma) {
      const kodikos = kodikos_sfalmatos(sfalma);
      if (kodikos === 'ENOENT') {
        return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν βρέθηκε: ${diadromi}`);
      }
      if (kodikos === 'EISDIR') {
        return apotyxia('MI_EGKYRO_SXIMA', `Η διαδρομή είναι φάκελος: ${diadromi}`);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η ανάγνωση: ${diadromi}`, sfalma);
    }
  }

  async diavase_dyadiko(diadromi: string): Promise<Apotelesma<Uint8Array>> {
    const pliri = this.pliri_diadromi(diadromi);
    if (!pliri.ok) {
      return pliri;
    }
    try {
      const dedomena = await readFile(pliri.timi);
      return ok(new Uint8Array(dedomena));
    } catch (sfalma) {
      const kodikos = kodikos_sfalmatos(sfalma);
      if (kodikos === 'ENOENT') {
        return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν βρέθηκε: ${diadromi}`);
      }
      if (kodikos === 'EISDIR') {
        return apotyxia('MI_EGKYRO_SXIMA', `Η διαδρομή είναι φάκελος: ${diadromi}`);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η ανάγνωση: ${diadromi}`, sfalma);
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
    const pliri = this.pliri_diadromi(diadromi);
    if (!pliri.ok) {
      return pliri;
    }
    const proorismos = pliri.timi;
    const prosorino = `${proorismos}.tmp-${randomUUID()}`;
    try {
      await mkdir(path.dirname(proorismos), { recursive: true });
      await writeFile(prosorino, dedomena);
      await rename(prosorino, proorismos);
      return ok(undefined);
    } catch (sfalma) {
      return apotyxia('AGNOSTO', `Απέτυχε η εγγραφή: ${diadromi}`, sfalma);
    } finally {
      await rm(prosorino, { force: true }).catch(() => undefined);
    }
  }

  async yparxei(diadromi: string): Promise<boolean> {
    const pliri = this.pliri_diadromi(diadromi);
    if (!pliri.ok) {
      return false;
    }
    try {
      const statistiko = await stat(pliri.timi);
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
      return apotyxia('AGNOSTO', `Απέτυχε η ανάγνωση του φακέλου: ${fakelos}`, sfalma);
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
    const pliri = this.pliri_diadromi(diadromi);
    if (!pliri.ok) {
      return pliri;
    }
    try {
      await unlink(pliri.timi);
      return ok(undefined);
    } catch (sfalma) {
      if (kodikos_sfalmatos(sfalma) === 'ENOENT') {
        return apotyxia('DEN_VRETHIKE', `Το αρχείο δεν υπάρχει: ${diadromi}`);
      }
      return apotyxia('AGNOSTO', `Απέτυχε η διαγραφή: ${diadromi}`, sfalma);
    }
  }
}
