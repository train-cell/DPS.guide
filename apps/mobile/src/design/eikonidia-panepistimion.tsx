import type { ReactNode } from 'react';
import { LISTA_PANEPISTIMION } from '@dps/core';

/**
 * Onomata kai anagnoristika ellinikon panepistimion.
 * Ypostirizei ta kyriotera idrymata tis Elladas kathos kai geniko STEM/Custom.
 */
export type PanepistimioId =
  | 'unipi'
  | 'unipi_cs'
  | 'uoa'
  | 'uoa_dit'
  | 'ntua'
  | 'ntua_mycourses'
  | 'aueb'
  | 'aueb_cs'
  | 'auth'
  | 'auth_cs'
  | 'upatras'
  | 'upatras_ceid'
  | 'uoc'
  | 'uoc_csd'
  | 'tuc_ece'
  | 'duth'
  | 'duth_ee'
  | 'uoi_cs'
  | 'uth_inf'
  | 'hua_dit'
  | 'panteion'
  | 'aegean_icsd'
  | 'ionio_di'
  | 'uowm_ece'
  | 'uop_dit'
  | 'uniwa_ice'
  | 'hmu_cs'
  | 'ihu_iee'
  | 'aua'
  | 'asfa'
  | 'aspete'
  | 'eap'
  | 'uom_dai'
  | 'stem'
  | 'custom'
  | 'geniko';

/** Kathgories filtron panepistimion gia to Bevel UI onboarding. */
export type KatigoriaPanepistimiou =
  | 'ola'
  | 'athina'
  | 'thessaloniki'
  | 'perifereia'
  | 'stem'
  | 'custom';

/** Dedomena kai metadedomena enos ellinikou panepistimiou. */
export interface PanepistimioDedomena {
  readonly id: PanepistimioId;
  readonly onoma: string;
  readonly syntomiOnomasia: string;
  readonly baseEclass: string;
  readonly katigoria: KatigoriaPanepistimiou;
  readonly perigrafi: string;
  readonly lms?: 'open-eclass' | 'moodle' | 'unsupported' | 'auto';
}

/** Proepilegmeno megethos tou eikonidiou se px. */
export const PROEPILEGMENTO_MEGETHOS_EIKONIDIOU = 32;

function kanoniko_id_apo_core(id: string): PanepistimioId {
  switch (id) {
    case 'uoa_dit':
      return 'uoa';
    case 'ntua_mycourses':
      return 'ntua';
    case 'aueb_cs':
      return 'aueb';
    case 'auth_cs':
      return 'auth';
    case 'upatras_ceid':
      return 'upatras';
    case 'uoc_csd':
      return 'uoc';
    case 'duth_ee':
      return 'duth';
    default:
      return id as PanepistimioId;
  }
}

function katigoria_apo_core(id: string, perioxh: string): KatigoriaPanepistimiou {
  if (id === 'ntua_mycourses' || id === 'ntua') {
    return 'stem';
  }
  if (perioxh === 'athina') {
    return 'athina';
  }
  if (perioxh === 'thessaloniki') {
    return 'thessaloniki';
  }
  return 'perifereia';
}

function lms_apo_core(id: string, typos_lms: string): 'open-eclass' | 'moodle' | 'unsupported' | 'auto' {
  if (id === 'ntua_mycourses' || id === 'ntua') {
    return 'unsupported';
  }
  if (typos_lms === 'moodle') {
    return 'moodle';
  }
  if (typos_lms === 'openeclass') {
    return 'open-eclass';
  }
  return 'unsupported';
}

const DEDOMENA_STEM: PanepistimioDedomena = {
  id: 'stem',
  onoma: 'Γενικό STEM / Πληροφορική',
  syntomiOnomasia: 'STEM',
  baseEclass: 'https://eclass.gunet.gr',
  katigoria: 'stem',
  perigrafi: 'Open eClass / GUnet STEM',
  lms: 'open-eclass',
};

const DEDOMENA_CUSTOM: PanepistimioDedomena = {
  id: 'custom',
  onoma: 'Προσαρμοσμένο URL / Άλλο',
  syntomiOnomasia: 'Custom',
  baseEclass: '',
  katigoria: 'custom',
  perigrafi: 'Χειροκίνητη εισαγωγή διεύθυνσης eClass',
  lms: 'auto',
};

/** Lista me ta ypostirizomena panepistimia gia to onboarding. Perilamvanei ola ta 26 idrymata tou @dps/core syn stem kai custom. */
export const PANEPISTIMIA_LISTA: readonly PanepistimioDedomena[] = Object.freeze([
  ...LISTA_PANEPISTIMION.map((p): PanepistimioDedomena => {
    const id = kanoniko_id_apo_core(p.id);
    const baseEclass = p.id === 'unipi' ? 'https://thales.cs.unipi.gr' : p.base_url;
    const perigrafi =
      p.id === 'unipi' || p.id === 'unipi_cs'
        ? 'Τμήμα Πληροφορικής & eClass ΠΑΠΕΙ'
        : p.tmima && p.tmima.length > 0
          ? p.tmima
          : p.onoma;
    return {
      id,
      onoma: p.onoma,
      syntomiOnomasia: p.syntomi_onomasia,
      baseEclass,
      katigoria: katigoria_apo_core(p.id, p.perioxh),
      perigrafi,
      lms: lms_apo_core(p.id, p.typos_lms),
    };
  }),
  DEDOMENA_STEM,
  DEDOMENA_CUSTOM,
]);

/** Kanonikopoiei opoiodipote anagnoristiko panepistimiou sto egkyro PanepistimioId. */
export function kanonikopoiise_panepistimio_id(id: string): PanepistimioId {
  const katharo = id.trim().toLowerCase();
  switch (katharo) {
    case 'unipi':
    case 'papei':
      return 'unipi';
    case 'unipi_cs':
      return 'unipi_cs';
    case 'uoa':
    case 'uoa_dit':
    case 'ekpa':
      return 'uoa';
    case 'ntua':
    case 'ntua_mycourses':
    case 'emp':
      return 'ntua';
    case 'aueb':
    case 'aueb_cs':
    case 'opa':
    case 'asoee':
      return 'aueb';
    case 'auth':
    case 'auth_cs':
    case 'apth':
      return 'auth';
    case 'upatras':
    case 'upatras_ceid':
    case 'patra':
    case 'patras':
    case 'uop':
      return 'upatras';
    case 'uoc':
    case 'uoc_csd':
    case 'kriti':
    case 'uok':
      return 'uoc';
    case 'duth':
    case 'duth_ee':
    case 'thraki':
      return 'duth';
    case 'tuc':
    case 'tuc_ece':
      return 'tuc_ece';
    case 'uoi':
    case 'uoi_cs':
      return 'uoi_cs';
    case 'uth':
    case 'uth_inf':
      return 'uth_inf';
    case 'hua':
    case 'hua_dit':
      return 'hua_dit';
    case 'panteion':
      return 'panteion';
    case 'aegean':
    case 'aegean_icsd':
      return 'aegean_icsd';
    case 'ionio':
    case 'ionio_di':
      return 'ionio_di';
    case 'uowm':
    case 'uowm_ece':
      return 'uowm_ece';
    case 'uop_dit':
      return 'uop_dit';
    case 'uniwa':
    case 'uniwa_ice':
    case 'pada':
      return 'uniwa_ice';
    case 'hmu':
    case 'hmu_cs':
    case 'elmepa':
      return 'hmu_cs';
    case 'ihu':
    case 'ihu_iee':
    case 'dipae':
      return 'ihu_iee';
    case 'aua':
    case 'gpa':
      return 'aua';
    case 'asfa':
    case 'askt':
      return 'asfa';
    case 'aspete':
    case 'aspaite':
      return 'aspete';
    case 'eap':
      return 'eap';
    case 'uom':
    case 'uom_dai':
    case 'pamak':
      return 'uom_dai';
    case 'stem':
    case 'pliroforiki':
    case 'cs':
      return 'stem';
    case 'custom':
    case 'url':
    case 'allo':
      return 'custom';
    default:
      return 'geniko';
  }
}

/** Epistrefei ta dedomena panepistimiou vasei tou anagnoristikou. */
export function pare_panepistimio_dedomena(id: string): PanepistimioDedomena | undefined {
  const kanoniko = kanonikopoiise_panepistimio_id(id);
  const katharo = id.trim().toLowerCase();
  return (
    PANEPISTIMIA_LISTA.find((panepistimio) => panepistimio.id === kanoniko) ??
    PANEPISTIMIA_LISTA.find((panepistimio) => panepistimio.id === katharo)
  );
}

/** Dilosi idiotiton gia to EikonidioPanepistimiou. */
export interface EikonidioPanepistimiouProps {
  readonly id: string;
  readonly megethos?: number;
  readonly className?: string;
  readonly titlos?: string;
}

/** Εικονίδιο για το κρυπτογραφημένο τοπικό vault, ανεξάρτητα από την πλατφόρμα. */
export function EikonidioAsfaleias({
  megethos = 16,
  className,
}: {
  readonly megethos?: number;
  readonly className?: string;
}) {
  return (
    <svg
      width={megethos}
      height={megethos}
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label="Ασφάλεια κρυπτογραφημένου vault"
      className={className}
      data-testid="eikonidio-asfaleias"
    >
      <path
        d="M8 1.5l5 2v4.5c0 3.5-2.5 6-5 7-2.5-1-5-3.5-5-7V3.5l5-2z"
        stroke="var(--xroma-entono)"
        strokeWidth="1.2"
        fill="var(--xroma-epifaneia-ypsomeni)"
      />
      <circle cx="8" cy="7.5" r="1.5" fill="var(--xroma-entono)" />
      <path d="M8 9v2.5" stroke="var(--xroma-entono)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** Esoteriki synartisi pou apodidei ta monopatia SVG tou emvlimatos kathe panepistimiou. */
function apodose_emvlima(kanonikoId: PanepistimioId): ReactNode {
  switch (kanonikoId) {
    case 'unipi':
      /* ΠΑΠΕΙ: Agkyra & Nautiko emvlima Peiraia */
      return (
        <g data-testid="emvlima-unipi">
          <path
            d="M16 8v13M12 11h8M10 17c0 3.3 2.7 6 6 6s6-2.7 6-6"
            stroke="var(--xroma-entono)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="8" r="1.8" stroke="var(--xroma-entono)" strokeWidth="1.4" fill="none" />
        </g>
      );

    case 'uoa':
      /* ΕΚΠΑ: Athena portico & klassiki kiwnokrania */
      return (
        <g data-testid="emvlima-uoa">
          <path
            d="M8 12l8-4 8 4M10 13v9M14 13v9M18 13v9M22 13v9M7 23h18"
            stroke="var(--xroma-entono)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="11" r="1.2" fill="var(--xroma-keimeno-prwtarxiko)" />
        </g>
      );

    case 'ntua':
      /* ΕΜΠ: Floga tou Promithea & Polytexneio */
      return (
        <g data-testid="emvlima-ntua">
          <path d="M16 6c-2.5 3 1.5 5 0 8 3-1.5 3.5-5 0-8z" fill="var(--xroma-entono)" />
          <path
            d="M14 15h4l-1 9h-2l-1-9z"
            stroke="var(--xroma-keimeno-prwtarxiko)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 24h14"
            stroke="var(--xroma-synorio)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      );

    case 'aueb':
      /* ΟΠΑ: Ermis & anoiki oikonomiki poreia */
      return (
        <g data-testid="emvlima-aueb">
          <path
            d="M8 22l5-5 3 3 7-8"
            stroke="var(--xroma-entono)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 12h5v5"
            stroke="var(--xroma-entono)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="13" cy="17" r="1.5" fill="var(--xroma-keimeno-prwtarxiko)" />
          <circle cx="16" cy="20" r="1.5" fill="var(--xroma-keimeno-prwtarxiko)" />
          <circle cx="23" cy="12" r="1.5" fill="var(--xroma-entono)" />
        </g>
      );

    case 'auth':
      /* ΑΠΘ: Lefkos Pyrgos Thessalonikis */
      return (
        <g data-testid="emvlima-auth">
          <path
            d="M10 24V14l2-2v-2h2v2h4v-2h2v2l2 2v10H10z"
            stroke="var(--xroma-entono)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M14 24v-4a2 2 0 0 1 4 0v4M12 17h8"
            stroke="var(--xroma-keimeno-prwtarxiko)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      );

    case 'upatras':
      /* ΠΑΤΡΑ: Gefyra Riou-Antirriou */
      return (
        <g data-testid="emvlima-upatras">
          <path
            d="M16 8v16M7 20h18"
            stroke="var(--xroma-entono)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M16 11l-7 9M16 11l7 9M16 15l-4 5M16 15l4 5"
            stroke="var(--xroma-keimeno-prwtarxiko)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </g>
      );

    case 'uoc':
      /* ΚΡΗΤΗ: Minwiko Labrys / Diplo Peleki */
      return (
        <g data-testid="emvlima-uoc">
          <path
            d="M16 7v18M11 9c3 1 3 6 0 7M21 9c-3 1-3 6 0 7"
            stroke="var(--xroma-entono)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M11 9c1 3 1 4 0 7M21 9c-1 3-1 4 0 7"
            stroke="var(--xroma-keimeno-prwtarxiko)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      );

    case 'duth':
      /* ΔΠΘ: Atomiki trochia Dimokritou */
      return (
        <g data-testid="emvlima-duth">
          <circle cx="16" cy="16" r="2.5" fill="var(--xroma-entono)" />
          <ellipse
            cx="16"
            cy="16"
            rx="9"
            ry="3.5"
            stroke="var(--xroma-keimeno-prwtarxiko)"
            strokeWidth="1.3"
            fill="none"
            transform="rotate(35 16 16)"
          />
          <ellipse
            cx="16"
            cy="16"
            rx="9"
            ry="3.5"
            stroke="var(--xroma-keimeno-prwtarxiko)"
            strokeWidth="1.3"
            fill="none"
            transform="rotate(-35 16 16)"
          />
        </g>
      );

    case 'stem':
      /* STEM: Kodikas </> kai mikroepexergastis */
      return (
        <g data-testid="emvlima-stem">
          <path
            d="M11 11L7 16l4 5M21 11l4 5-4 5M18 9l-4 14"
            stroke="var(--xroma-entono)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );

    case 'custom':
      /* Custom URL: Ydrogeios kai syndesmos diadityou */
      return (
        <g data-testid="emvlima-custom">
          <circle cx="16" cy="16" r="8" stroke="var(--xroma-entono)" strokeWidth="1.6" fill="none" />
          <ellipse
            cx="16"
            cy="16"
            rx="4"
            ry="8"
            stroke="var(--xroma-keimeno-prwtarxiko)"
            strokeWidth="1.3"
            fill="none"
          />
          <path d="M8 16h16" stroke="var(--xroma-keimeno-prwtarxiko)" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      );

    case 'geniko':
    default:
      /* Geniko / Foititiko kapelo ptyxiou */
      return (
        <g data-testid="emvlima-geniko">
          <path
            d="M16 9L6 14l10 5 10-5-10-5z"
            stroke="var(--xroma-entono)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M10 16.5v4.5c0 2 2.7 3.5 6 3.5s6-1.5 6-3.5v-4.5M23 15.5v5"
            stroke="var(--xroma-keimeno-prwtarxiko)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      );
  }
}

/**
 * EikonidioPanepistimiou - Katharo SVG badge gia ellinika panepistimia sto DPS.guide.
 * Pisti symmorfwsi me ta design tokens kai dark-only thematiki (kanonas D11).
 */
export function EikonidioPanepistimiou({
  id,
  megethos = PROEPILEGMENTO_MEGETHOS_EIKONIDIOU,
  className,
  titlos,
}: EikonidioPanepistimiouProps) {
  const kanonikoId = kanonikopoiise_panepistimio_id(id);
  const etiketa = titlos ?? `Έμβλημα πανεπιστημίου: ${kanonikoId}`;

  return (
    <svg
      width={megethos}
      height={megethos}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={etiketa}
      className={className}
      data-testid={`eikonidio-panepistimiou-${kanonikoId}`}
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8"
        fill="var(--xroma-epifaneia-ypsomeni)"
        stroke="var(--xroma-synorio)"
        strokeWidth="1.2"
      />
      {apodose_emvlima(kanonikoId)}
    </svg>
  );
}
export default EikonidioPanepistimiou;
