import type { TyposTmimatos } from './contracts/montela.js';

// §7.1 Prompts
export const MAX_SELIDES_ANA_KLISI = 40;
export const MAX_XARAKTIRES_ANA_KLISI = 60000;

// §7.2 Έλεγχος κόστους και LLM όρια
export const LLM_TIMEOUT_MS = 150000;
export const MEGISTES_EPANALIPSEIS = 3;

// §7.3 Μεγέθη & Deterministic Logic
export const RYTHMOS_LEPTA_ANA_TYPO: Record<TyposTmimatos, number> = {
  eisagogi: 1.5,
  orismoi: 2.0,
  theoria: 3.0,
  apodeixi: 5.0,
  algorithmos: 4.0,
  paradeigma: 4.0,
  askiseis: 8.0,
  anakefalaiosi: 1.5,
};

export const MESES_LEKSEIS_SELIDAS = 120;
export const ELAXISTO_KLASMA = 0.3;
export const MEGISTO_KLASMA = 3.0;

export const ALFA_EWMA = 0.3;
export const ELAXISTOS_SYNTELESTIS = 0.5;
export const MEGISTOS_SYNTELESTIS = 3.0;

// §7.3 Πρόγραμμα
export const POSOSTO_XORITIKOTITAS = 0.8;

// §8 Ενσωμάτωση eClass
export const KATHYSTERISI_METAXY_AITIMATON_MS = 500;
export const MEGISTI_PARALLILIA_LIPSEON = 2;
export const MEGISTO_MEGETHOS_ARXEIOU_MB = 100;

export const EPITREPOMENES_EPEKTASEIS = [
  'pdf',
  'pptx',
  'ppt',
  'docx',
  'doc',
  'txt',
  'png',
  'jpg',
  'zip',
] as const;

// §9 L03 & L05 & P3
export const ANOXI_EPIKALYPSIS_SELIDON = 1;
export const ELAXISTES_LEKSEIS_SELIDAS = 5;
export const MEGISTOS_ARITHMOS_EIDOPOIISEON = 60;

// Timezone
export const ZONE_ORAS = 'Europe/Athens';
