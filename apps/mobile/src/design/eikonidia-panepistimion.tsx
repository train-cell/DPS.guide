import type { ReactNode } from 'react';

/**
 * Onomata kai anagnoristika ellinikon panepistimion.
 * Ypostirizei ta kyriotera idrymata tis Elladas kathos kai geniko STEM/Custom.
 */
export type PanepistimioId =
  | 'unipi'
  | 'uoa'
  | 'ntua'
  | 'aueb'
  | 'auth'
  | 'upatras'
  | 'uoc'
  | 'duth'
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
}

/** Proepilegmeno megethos tou eikonidiou se px. */
export const PROEPILEGMENTO_MEGETHOS_EIKONIDIOU = 32;

/** Lista me ta ypostirizomena panepistimia gia to onboarding. */
export const PANEPISTIMIA_LISTA: readonly PanepistimioDedomena[] = Object.freeze([
  {
    id: 'unipi',
    onoma: 'Πανεπιστήμιο Πειραιώς',
    syntomiOnomasia: 'ΠΑΠΕΙ',
    baseEclass: 'https://thales.cs.unipi.gr',
    katigoria: 'athina',
    perigrafi: 'Τμήμα Πληροφορικής & eClass ΠΑΠΕΙ',
  },
  {
    id: 'uoa',
    onoma: 'Εθνικό & Καποδιστριακό Πανεπιστήμιο Αθηνών',
    syntomiOnomasia: 'ΕΚΠΑ',
    baseEclass: 'https://eclass.uoa.gr',
    katigoria: 'athina',
    perigrafi: 'Πλατφόρμα Τηλεκπαίδευσης ΕΚΠΑ',
  },
  {
    id: 'ntua',
    onoma: 'Εθνικό Μετσόβιο Πολυτεχνείο',
    syntomiOnomasia: 'ΕΜΠ',
    baseEclass: 'https://mycourses.ntua.gr',
    katigoria: 'stem',
    perigrafi: 'MyCourses ΕΜΠ',
  },
  {
    id: 'aueb',
    onoma: 'Οικονομικό Πανεπιστήμιο Αθηνών',
    syntomiOnomasia: 'ΟΠΑ',
    baseEclass: 'https://eclass.aueb.gr',
    katigoria: 'athina',
    perigrafi: 'eClass ΟΠΑ (ΑΣΟΕΕ)',
  },
  {
    id: 'auth',
    onoma: 'Αριστοτέλειο Πανεπιστήμιο Θεσσαλονίκης',
    syntomiOnomasia: 'ΑΠΘ',
    baseEclass: 'https://elearning.auth.gr',
    katigoria: 'thessaloniki',
    perigrafi: 'eLearning ΑΠΘ',
  },
  {
    id: 'upatras',
    onoma: 'Πανεπιστήμιο Πατρών',
    syntomiOnomasia: 'ΠΑΤΡΑ',
    baseEclass: 'https://eclass.upatras.gr',
    katigoria: 'perifereia',
    perigrafi: 'eClass Πανεπιστημίου Πατρών',
  },
  {
    id: 'uoc',
    onoma: 'Πανεπιστήμιο Κρήτης',
    syntomiOnomasia: 'ΚΡΗΤΗ',
    baseEclass: 'https://elearn.uoc.gr',
    katigoria: 'perifereia',
    perigrafi: 'eLearn Πανεπιστημίου Κρήτης',
  },
  {
    id: 'duth',
    onoma: 'Δημοκρίτειο Πανεπιστήμιο Θράκης',
    syntomiOnomasia: 'ΔΠΘ',
    baseEclass: 'https://eclass.duth.gr',
    katigoria: 'perifereia',
    perigrafi: 'eClass ΔΠΘ',
  },
  {
    id: 'stem',
    onoma: 'Γενικό STEM / Πληροφορική',
    syntomiOnomasia: 'STEM',
    baseEclass: 'https://eclass.gunet.gr',
    katigoria: 'stem',
    perigrafi: 'Open eClass / GUnet STEM',
  },
  {
    id: 'custom',
    onoma: 'Προσαρμοσμένο URL / Άλλο',
    syntomiOnomasia: 'Custom',
    baseEclass: '',
    katigoria: 'custom',
    perigrafi: 'Χειροκίνητη εισαγωγή διεύθυνσης eClass',
  },
]);

/** Kanonikopoiei opoiodipote anagnoristiko panepistimiou sto egkyro PanepistimioId. */
export function kanonikopoiise_panepistimio_id(id: string): PanepistimioId {
  const katharo = id.trim().toLowerCase();
  switch (katharo) {
    case 'unipi':
    case 'papei':
      return 'unipi';
    case 'uoa':
    case 'ekpa':
      return 'uoa';
    case 'ntua':
    case 'emp':
      return 'ntua';
    case 'aueb':
    case 'opa':
    case 'asoee':
      return 'aueb';
    case 'auth':
    case 'apth':
      return 'auth';
    case 'upatras':
    case 'patra':
    case 'patras':
    case 'uop':
      return 'upatras';
    case 'uoc':
    case 'kriti':
    case 'uok':
      return 'uoc';
    case 'duth':
    case 'thraki':
      return 'duth';
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
  return PANEPISTIMIA_LISTA.find((panepistimio) => panepistimio.id === kanoniko);
}

/** Dilosi idiotiton gia to EikonidioPanepistimiou. */
export interface EikonidioPanepistimiouProps {
  readonly id: string;
  readonly megethos?: number;
  readonly className?: string;
  readonly titlos?: string;
}

/** Eikonidio asfaleias hardware vault gia to zero-cloud storage. */
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
      aria-label="Ασφαλές hardware vault"
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
