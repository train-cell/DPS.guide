import path from 'node:path';
import type { Apotelesma, EclassPyli, KomvosArxeiou, Mathima } from '@dps/core';
import { MathimaSchema, apotyxia, ok } from '@dps/core';
import { fortise_json_arxeio, yparxei_fakelos } from './anagnostikes.js';
import { einai_kodikos_mathimatos, elegxe_komvos_arxeiou } from './elegxoi.js';
import { ONOMA_ARXEIOU_MATHIMATON, ONOMA_FAKELOU_DENTROU, RIZA_FIXTURES_PAKETA } from './stathares.js';

export interface ParametroiMockEclass {
  riza_fixture?: string;
}

interface ProvlitesZod {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}

function minima_zod(sfalma: ProvlitesZod): string {
  return sfalma.issues
    .map((themata: { path: readonly PropertyKey[]; message: string }) => {
      const diadromi = themata.path.join('.');
      return diadromi === '' ? themata.message : `${diadromi}: ${themata.message}`;
    })
    .join(' · ');
}

export class MockEclassPyli implements EclassPyli {
  private readonly riza_fixture: string;

  constructor(parametroi: ParametroiMockEclass = {}) {
    this.riza_fixture = parametroi.riza_fixture ?? RIZA_FIXTURES_PAKETA;
  }

  private arxeio_mathimaton(): string {
    return path.join(this.riza_fixture, ONOMA_ARXEIOU_MATHIMATON);
  }

  private arxeio_dentrou(kodikos: string): string {
    return path.join(this.riza_fixture, ONOMA_FAKELOU_DENTROU, `${kodikos}.json`);
  }

  async syndesi(): Promise<Apotelesma<void>> {
    if (!(await yparxei_fakelos(this.riza_fixture))) {
      return apotyxia(
        'DEN_VRETHIKE',
        `Δεν βρέθηκε ο φάκελος των scrubbed fixtures «${this.riza_fixture}».`
      );
    }
    const fortisis = await fortise_json_arxeio(this.arxeio_mathimaton());
    if (!fortisis.ok) {
      return apotyxia(
        fortisis.sfalma.kodikos,
        `Το mock δεν μπορεί να συνδεθεί: ${fortisis.sfalma.minima}`,
        fortisis.sfalma.aitia
      );
    }
    return ok(undefined);
  }

  async fere_mathimata(): Promise<Apotelesma<Mathima[]>> {
    const fortisis = await fortise_json_arxeio(this.arxeio_mathimaton());
    if (!fortisis.ok) {
      return apotyxia(fortisis.sfalma.kodikos, fortisis.sfalma.minima, fortisis.sfalma.aitia);
    }

    const dedomena: unknown = fortisis.timi;
    if (!Array.isArray(dedomena)) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Το «${this.arxeio_mathimaton()}» πρέπει να είναι πίνακας Mathima[].`
      );
    }

    const mathimata: Mathima[] = [];
    for (const [thesi, stoixeio] of (dedomena as unknown[]).entries()) {
      const parsmeno = MathimaSchema.safeParse(stoixeio);
      if (!parsmeno.success) {
        return apotyxia(
          'MI_EGKYRO_SXIMA',
          `Μη έγκυρο μάθημα στη θέση ${thesi} του «${this.arxeio_mathimaton()}»: ${minima_zod(parsmeno.error)}`
        );
      }
      mathimata.push(parsmeno.data);
    }

    if (mathimata.length === 0) {
      return apotyxia(
        'DEN_VRETHIKE',
        `Το «${this.arxeio_mathimaton()}» είναι κενό. Ποτέ κενή επιτυχία.`
      );
    }

    return ok(mathimata);
  }

  async fere_dentro_arxeion(kodikos: string): Promise<Apotelesma<KomvosArxeiou[]>> {
    if (!einai_kodikos_mathimatos(kodikos)) {
      return apotyxia(
        'DEN_VRETHIKE',
        `Μη έγκυρος κωδικός μαθήματος «${kodikos}». Επιτρέπονται μόνο γράμματα, ψηφία, «-» και «_».`
      );
    }

    const fortisis = await fortise_json_arxeio(this.arxeio_dentrou(kodikos));
    if (!fortisis.ok) {
      return apotyxia(fortisis.sfalma.kodikos, fortisis.sfalma.minima, fortisis.sfalma.aitia);
    }

    const dedomena: unknown = fortisis.timi;
    if (!Array.isArray(dedomena)) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Το «${this.arxeio_dentrou(kodikos)}» πρέπει να είναι πίνακας KomvosArxeiou[].`
      );
    }

    const dendro: KomvosArxeiou[] = [];
    for (const [thesi, stoixeio] of (dedomena as unknown[]).entries()) {
      const aitia = elegxe_komvos_arxeiou(stoixeio);
      if (aitia !== null) {
        return apotyxia(
          'MI_EGKYRO_SXIMA',
          `Μη έγκυρος κόμβος στη θέση ${thesi} του «${this.arxeio_dentrou(kodikos)}»: ${aitia}`
        );
      }
      dendro.push(stoixeio as KomvosArxeiou);
    }

    if (dendro.length === 0) {
      return apotyxia(
        'DEN_VRETHIKE',
        `Το «${this.arxeio_dentrou(kodikos)}» είναι κενό. Ποτέ κενή επιτυχία.`
      );
    }

    const riza = dendro[0];
    if (riza === undefined || riza.diadromi !== '') {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Ο πρώτος κόμβος του «${this.arxeio_dentrou(kodikos)}» πρέπει να είναι η ρίζα (diadromi «»).`
      );
    }
    if (dendro.slice(1).some((komvos: KomvosArxeiou) => komvos.diadromi === '')) {
      return apotyxia(
        'MI_EGKYRO_SXIMA',
        `Το «${this.arxeio_dentrou(kodikos)}» έχει περισσότερες από μία ρίζες.`
      );
    }

    return ok(dendro);
  }
}