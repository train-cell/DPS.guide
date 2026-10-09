import type { Enotita, Perigramma, Selida, Tmima } from '@dps/core';

export function ftiaxe_selida(arithmos: number, keimeno: string, arxeio_id = 'arx-1'): Selida {
  return { arxeio_id, arithmos, keimeno, lekseis: 0, xoris_keimeno: keimeno.length === 0 };
}

export function ftiaxe_selides(arithmoi: number[], keimeno: (i: number) => string): Selida[] {
  return arithmoi.map((arithmos, i) => ftiaxe_selida(arithmos, keimeno(i)));
}

export function ftiaxe_tmima(titlos: string, apo: number, eos: number): Tmima {
  return {
    titlos,
    selides: { apo, eos },
    typos: 'theoria',
    ennoies: [`έννοια ${titlos}`],
    proapaitoumena: [],
  };
}

export function ftiaxe_perigramma(arxeio_id: string, titlos: string, tmimata: Tmima[]): Perigramma {
  return { arxeio_id, titlos, tmimata };
}

export function ftiaxe_enotita(epateseis: Partial<Enotita> = {}): Enotita {
  return {
    id: 'enotita-1',
    titlos: 'Δομές δεδομένων',
    piges: [
      { arxeio_id: 'arx-1', apo: 1, eos: 10 },
      { arxeio_id: 'arx-2', apo: 3, eos: 5 },
    ],
    ennoies: ['λίστες', 'δένδρα'],
    proapaitoumenes: [{ enotita_id: 'enotita-0', isxys: 'isxyri' }],
    seira: 1,
    lepta_ektimisi: null,
    apodosi_exetasis: null,
    ...epateseis,
  };
}
