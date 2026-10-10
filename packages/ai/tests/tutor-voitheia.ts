import { apotyxia, ok } from '@dps/core';
import type { Apotelesma, LlmAitimaJson, LlmAitimaKeimenou, LlmPyli } from '@dps/core';
import type {
  AnoixeSelidaZitima,
  ApotelesmaErgaleiou,
  ErgaleiaTutor,
  ErotisiAskisis,
  FtiaxeErotisiZitima,
  KatagrafiPyli,
  VresEnnoiaZitima,
} from '../src/tutor/index.js';
import { ftiaxe_ergaleia_tutor } from '../src/tutor/index.js';
import { ftiaxe_enotita, ftiaxe_selida } from './voitheia.js';

export class SkribinioLlm implements LlmPyli {
  readonly montelo = 'mock-gemini-2.5-flash';
  zitiseis: string[] = [];
  private oarismos: unknown[];
  private psifio = 0;

  constructor(oarismos: unknown[] = []) {
    this.oarismos = oarismos;
  }

  pare_sto(oarismos: unknown[]): void {
    this.oarismos = oarismos;
    this.psifio = 0;
  }

  async parage_json<T>(a: LlmAitimaJson<T>): Promise<Apotelesma<T>> {
    this.zitiseis.push(a.xristis);
    const dedomena = this.oarismos[this.psifio];
    this.psifio += 1;
    if (dedomena === undefined) {
      return apotyxia('DEN_VRETHIKE', 'SkribinioLlm: δεν υπάρχει σενάριο για αυτή την κλήση');
    }
    const checked = a.sxima.safeParse(dedomena);
    if (!checked.success) {
      return apotyxia('MI_EGKYRO_SXIMA', 'SkribinioLlm: το σενάριο δεν ταιριάζει με το σχήμα');
    }
    return ok(checked.data);
  }

  async parage_keimeno(_a: LlmAitimaKeimenou): Promise<Apotelesma<string>> {
    return apotyxia('MI_YPOSTIRIZOMENO', 'SkribinioLlm δεν υποστηρίζει parage_keimeno');
  }
}

export class IchososKatagrafi implements KatagrafiPyli {
  minimata: string[] = [];

  pliroforia(minima: string): void {
    this.minimata.push(minima);
  }

  proeidopoiisi(minima: string): void {
    this.minimata.push(minima);
  }

  sfalma(minima: string): void {
    this.minimata.push(minima);
  }
}

export interface KalleliErgaleiou {
  onoma: string;
  orismata: unknown;
}

export class IerosErgaleia implements ErgaleiaTutor {
  kalles: KalleliErgaleiou[] = [];
  private inner: ErgaleiaTutor;

  constructor(inner: ErgaleiaTutor) {
    this.inner = inner;
  }

  anoixe_selida(orismata: AnoixeSelidaZitima): Apotelesma<ApotelesmaErgaleiou> {
    this.kalles.push({ onoma: 'anoixe_selida', orismata });
    return this.inner.anoixe_selida(orismata);
  }

  vres_ennoia(orismata: VresEnnoiaZitima): Apotelesma<ApotelesmaErgaleiou> {
    this.kalles.push({ onoma: 'vres_ennoia', orismata });
    return this.inner.vres_ennoia(orismata);
  }

  ftiaxe_erotisi(orismata: FtiaxeErotisiZitima): Apotelesma<ApotelesmaErgaleiou> {
    this.kalles.push({ onoma: 'ftiaxe_erotisi', orismata });
    return this.inner.ftiaxe_erotisi(orismata);
  }
}

export const ODIGOS_ENOTITAS_1 = [
  '## 🎯 Στόχοι',
  'Να καταλάβεις τον δείκτη συνέλευσης [[arx-1:4]]',
  'Μέση τιμή = 3,14. [[arx-1:4]]',
].join('\n');

export function uliko_mathimatos() {
  return {
    enotites: [ftiaxe_enotita(), ftiaxe_enotita({ id: 'enotita-2', titlos: 'Δένδρα' })],
    selides: [
      ftiaxe_selida(4, 'Ο δείκτης δείχνει πόσα στοιχεία δείχνουν στον πίνακα.'),
      ftiaxe_selida(9, '', 'arx-2'),
    ],
    perigrafies: [
      {
        enotita_id: 'enotita-1',
        ennoia: 'λίστα',
        keimeno: 'Λίστα είναι ακολουθία στοιχείων.',
        parapompi: { arxeio_id: 'arx-1', selida: 2 },
      },
      {
        enotita_id: 'enotita-0',
        ennoia: 'ξένος όρος',
        keimeno: 'Δεν αντιστοιχεί σε ενότητα.',
        parapompi: { arxeio_id: 'arx-2', selida: 9 },
      },
    ],
    erotiseis: [
      {
        enotita_id: 'enotita-1',
        erotisi: 'Ποια είναι η μέση τιμή που αναφέρεται στη σελίδα;',
        apantisi_dekdomeni: '3.14',
        parapompi: { arxeio_id: 'arx-1', selida: 4 },
      },
    ],
  };
}

export function ergaleia_mathimatos(): ErgaleiaTutor {
  return ftiaxe_ergaleia_tutor(uliko_mathimatos());
}

export function erotisi_arithmiki(): ErotisiAskisis {
  return {
    enotita_id: 'enotita-1',
    erotisi: 'Ποια είναι η μέση τιμή;',
    apantisi_dekdomeni: '3.14',
    parapompi: { arxeio_id: 'arx-1', selida: 4 },
  };
}

export function apantisi_leitourgias(epateseis: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    leitourgia: 'exigisi',
    exexigmeni: true,
    apantisi: 'Η λίστα είναι ακολουθία στοιχείων.',
    parapompes: [{ arxeio_id: 'arx-1', selida: 2 }],
    ...epateseis,
  };
}