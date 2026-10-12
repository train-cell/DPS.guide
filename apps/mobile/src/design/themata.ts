/**
 * Themata - Ypostirixi thematon gia to Bevel x UniStudents UI sto DPS.guide.
 * Perilamvanei Midnight OLED, UniStudents Blue, Emerald Green kai Clean Light.
 * Kanonas D9: synartiseis snake_case, typoi PascalCase, statheres UPPER_SNAKE.
 */

/** Anagnoristika ypostirizomenon thematon. */
export const THEMATA_IDS = ['midnight', 'unistudents', 'emerald', 'light'] as const;

export type ThemaId = (typeof THEMATA_IDS)[number];

/** Kleidi apothikefsis sto localStorage. */
export const APOTHEKE_KLEIDI_THEMATOS = 'dps_guide_thema';

/** Proepilegmeno thema tis efarmogis. */
export const PROEPILEGMENTO_THEMA_ID: ThemaId = 'midnight';

/** Dedomena enos thematos. */
export interface Thema {
  readonly id: ThemaId;
  readonly titlos: string;
  readonly perigrafi: string;
  readonly fontoHex: string;
  readonly kartaHex: string;
  readonly entonoHex: string;
  readonly defterevonHex?: string;
  readonly einaiSkouro: boolean;
}

/** Pinakas ton 4 ypostirizomenon thematon me ta xromata tous. */
export const THEMATA: readonly Thema[] = Object.freeze([
  {
    id: 'midnight',
    titlos: 'Midnight OLED',
    perigrafi: 'Απόλυτο μαύρο για μέγιστη εξοικονόμηση μπαταρίας και αντίθεση σε OLED οθόνες.',
    fontoHex: '#0B0B0C',
    kartaHex: '#161618',
    entonoHex: '#3B82F6',
    einaiSkouro: true,
  },
  {
    id: 'unistudents',
    titlos: 'UniStudents Blue',
    perigrafi: 'Η κλασική εμπειρία UniStudents σε βαθύ navy blue φόντο.',
    fontoHex: '#0A1128',
    kartaHex: '#132247',
    entonoHex: '#2563EB',
    defterevonHex: '#38BDF8',
    einaiSkouro: true,
  },
  {
    id: 'emerald',
    titlos: 'Emerald Green',
    perigrafi: 'Κομψό σκούρο θέμα με πινελιές σμαραγδένιου πράσινου.',
    fontoHex: '#081C15',
    kartaHex: '#112F24',
    entonoHex: '#10B981',
    einaiSkouro: true,
  },
  {
    id: 'light',
    titlos: 'Clean Light',
    perigrafi: 'Καθαρό φωτεινό θέμα για άνετη μελέτη στο φως της ημέρας.',
    fontoHex: '#F8FAFC',
    kartaHex: '#FFFFFF',
    entonoHex: '#2563EB',
    einaiSkouro: false,
  },
]);

/** Elegxei an mia timi antistoixei se egkyro ThemaId. */
export function einai_egkyro_thema(id: unknown): id is ThemaId {
  if (typeof id !== 'string') {
    return false;
  }
  return (THEMATA_IDS as readonly string[]).includes(id);
}

/** Epistrefei to trexon thema apo to localStorage i to proepilegmeno. */
export function pare_trexon_thema(): ThemaId {
  if (typeof localStorage !== 'undefined') {
    try {
      const apothikevmeno = localStorage.getItem(APOTHEKE_KLEIDI_THEMATOS);
      if (einai_egkyro_thema(apothikevmeno)) {
        return apothikevmeno;
      }
    } catch {
      // Agnoisi se private mode
    }
  }
  return PROEPILEGMENTO_THEMA_ID;
}

/** Efarmozei to thema sto DOM (data-theme attribute, Ionic dark palette) kai to apothikevei. */
export function thete_thema(id: ThemaId): void {
  if (!einai_egkyro_thema(id)) {
    throw new Error(`Mh egkyro thema: ${String(id)}`);
  }

  if (typeof document !== 'undefined' && document.documentElement) {
    const riza = document.documentElement;
    riza.setAttribute('data-theme', id);

    if (id === 'light') {
      riza.classList.remove('ion-palette-dark');
      riza.style.colorScheme = 'light';
    } else {
      riza.classList.add('ion-palette-dark');
      riza.style.colorScheme = 'dark';
    }
  }

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(APOTHEKE_KLEIDI_THEMATOS, id);
    } catch {
      // Agnoisi se private mode
    }
  }
}

/** Arxikopoiei to thema me tin ekkinisi tis efarmogis. */
export function arxikopoiisi_thematos(): ThemaId {
  const trexon = pare_trexon_thema();
  thete_thema(trexon);
  return trexon;
}
