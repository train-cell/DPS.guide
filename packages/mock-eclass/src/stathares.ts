import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ONOMA_ARXEIOU_MATHIMATON = 'mathimata.json';
export const ONOMA_FAKELOU_DENTROU = 'dentro';

export const TYPOS_KOMVOU = ['fakelos', 'arxeio'] as const;

export const PROTYPOS_IKONIKODIKOS = /^[A-Za-z0-9_-]+$/;
export const PROTYPOS_IMEROMINIAS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
export const PROTYPOS_DIASKEPSI = '..';

export const RIZA_FIXTURES_PAKETA = path.resolve(
  fileURLToPath(new URL('../../../fixtures/eclass/scrubbed/', import.meta.url))
);