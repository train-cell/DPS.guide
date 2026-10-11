import type { KomvosArxeiou } from '@dps/core';
import {
  PROTYPOS_DIASKEPSI,
  PROTYPOS_IKONIKODIKOS,
  PROTYPOS_IMEROMINIAS,
  TYPOS_KOMVOU,
} from './stathares.js';

function einai_akoma(timi: unknown): timi is string {
  return typeof timi === 'string';
}

function einai_arithmikos(timi: unknown): timi is number {
  return typeof timi === 'number' && Number.isFinite(timi);
}

function einai_to_pos(stoixeio: unknown): stoixeio is Record<string, unknown> {
  return typeof stoixeio === 'object' && stoixeio !== null && !Array.isArray(stoixeio);
}

export function einai_kodikos_mathimatos(kodikos: string): boolean {
  return PROTYPOS_IKONIKODIKOS.test(kodikos);
}

export function elegxe_komvos_arxeiou(stoixeio: unknown): string | null {
  if (!einai_to_pos(stoixeio)) {
    return 'Ο κόμβος δεν είναι αντικείμενο JSON.';
  }

  const typos = stoixeio['typos'];
  const epitreptous = TYPOS_KOMVOU.map((t: string) => `«${t}»`).join(' ή ');
  if (typeof typos !== 'string' || !(TYPOS_KOMVOU as readonly string[]).includes(typos)) {
    return `Το πεδίο «typos» πρέπει να είναι ${epitreptous}.`;
  }

  const diadromi = stoixeio['diadromi'];
  if (!einai_akoma(diadromi)) {
    return 'Το πεδίο «diadromi» πρέπει να είναι string.';
  }
  if (diadromi.includes(PROTYPOS_DIASKEPSI)) {
    return `Το πεδίο «diadromi» δεν επιτρέπεται να περιέχει «${PROTYPOS_DIASKEPSI}».`;
  }
  if (diadromi.startsWith('/') || diadromi.startsWith('\\') || /^[A-Za-z]:/.test(diadromi)) {
    return 'Το πεδίο «diadromi» πρέπει να είναι σχετική διαδρομή μέσα στο μάθημα.';
  }

  const onoma = stoixeio['onoma'];
  if (!einai_akoma(onoma)) {
    return 'Το πεδίο «onoma» πρέπει να είναι string.';
  }
  if (diadromi !== '' && onoma.trim() === '') {
    return 'Το πεδίο «onoma» δεν επιτρέπεται κενό εκτός από τη ρίζα.';
  }

  const url = stoixeio['url'];
  if (!einai_akoma(url) || !/^https?:\/\//.test(url)) {
    return 'Το πεδίο «url» πρέπει να είναι http(s) URL.';
  }

  const megethos = stoixeio['megethos'];
  if (megethos !== null) {
    if (!einai_arithmikos(megethos) || !Number.isInteger(megethos) || megethos < 0) {
      return 'Το πεδίο «megethos» πρέπει να είναι μη-αρνητικός ακέραιος ή null.';
    }
  }

  const imerominia = stoixeio['imerominia'];
  if (imerominia !== null && (!einai_akoma(imerominia) || !PROTYPOS_IMEROMINIAS.test(imerominia))) {
    return 'Το πεδίο «imerominia» πρέπει να είναι ημερομηνία ISO-8601 ή null.';
  }

  return null;
}

export function einai_komvos_arxeiou(stoixeio: unknown): stoixeio is KomvosArxeiou {
  return elegxe_komvos_arxeiou(stoixeio) === null;
}