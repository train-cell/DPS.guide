/**
 * Τύποι και δομές δεδομένων για το μητρώο ελληνικών πανεπιστημίων.
 */

export type TyposLms = 'openeclass' | 'moodle' | 'custom';

export type TyposAuth = 'topiki' | 'cas';

export type PerioxhPanepistimiou =
  | 'athina'
  | 'thessaloniki'
  | 'patra'
  | 'kriti'
  | 'perifereia'
  | 'eidiko';

export type KategoriaSpoudon = 'pliroforiki_stem' | 'geniko' | 'polytexneio';

export interface XromataPanepistimiou {
  vasiko: string;
  tonismeno: string;
}

export interface Panepistimio {
  id: string;
  onoma: string;
  syntomi_onomasia: string;
  tmima: string;
  poli: string;
  perioxh: PerioxhPanepistimiou;
  kategoria: KategoriaSpoudon;
  base_url: string;
  typos_lms: TyposLms;
  typos_auth: TyposAuth;
  cas_url?: string;
  xromata: XromataPanepistimiou;
  syntomo_eikonidio: string;
}

export interface OroiFiltrarismatosPanepistimion {
  anazitisi?: string;
  perioxh?: PerioxhPanepistimiou;
  kategoria?: KategoriaSpoudon;
}
