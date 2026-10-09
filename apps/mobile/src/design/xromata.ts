/**
 * Xromata - framework-agnostic dark-only design-system foundation (kanonas D11).
 * Kanonas D9: synartiseis/metavlites snake_case, typoi PascalCase, statheres UPPER_SNAKE.
 */

/** Xroma epifaneias paraskiniou (skouro thema mono). */
export const XROMA_FONTO = '#0B0B0C';

/** Xroma epifaneias kartas - anoseis kai epiloges PANO sto background. */
export const XROMA_KARTA = '#161618';

/** Xroma entonis (interactive/accent). */
export const XROMA_ENTONO = '#3B82F6';

/** Xroma amvlymenou keimenou - antikatestathike to #7F8084 pou apetygchane WCAG AA. */
export const XROMA_APOXROMATISMENO = '#9D9DA2';

/** Onomata ton tessaron ypochreotikon xromaton. */
export type OnomaXromatos = 'fonto' | 'karta' | 'entono' | 'apoxromatismeno';

/** Katastasi tou katachorimenoy xromatikoy synoloy. */
export type Xromata = { readonly [Onoma in OnomaXromatos]: string };

/** Pagomeni eggrafi me ta tessera ypochreotika xromata tis efarmogis. */
export const XROMATA: Xromata = Object.freeze({
  fonto: XROMA_FONTO,
  karta: XROMA_KARTA,
  entono: XROMA_ENTONO,
  apoxromatismeno: XROMA_APOXROMATISMENO,
});

/** Elaxisti antithesi WCAG 2.1 gia kanoniko keimeno (Level AA). */
export const ELAXISTI_ANTITHESI_AA = 4.5;

/** Elaxisti antithesi WCAG 2.1 gia megali keimena (Level AA large text). */
export const ELAXISTI_ANTITHESI_AA_MEGALO = 3;

/** Epitrepomena pososta diafaneias gia ta oudetera xromata (aspro / mavro). */
export const VIMATA_DIAFANEIAS = Object.freeze([4, 8, 12, 16, 24, 32, 48, 64, 80, 92] as const);

/** Ena egkekrimeno vima diafaneias apo ta VIMATA_DIAFANEIAS. */
export type VimaDiafaneias = (typeof VIMATA_DIAFANEIAS)[number];

const HEX_MOTIFO = /^#?([0-9a-f]{6})$/;
const RGB_MOTIFO = /^rgb\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)\s*,?\s*\/?\s*(\d+)\s*%\)$/;
const VIMATA_OS_ARITHMOI: readonly number[] = VIMATA_DIAFANEIAS;
const KANALIA_ASPRO: Kanalia = { kokkino: 255, prasino: 255, ble: 255 };
const KANALIA_MAVRO: Kanalia = { kokkino: 0, prasino: 0, ble: 0 };
const EPITREPOMENA_HEX: ReadonlySet<string> = new Set([
  XROMA_FONTO.toLowerCase(),
  XROMA_KARTA.toLowerCase(),
  XROMA_ENTONO.toLowerCase(),
  XROMA_APOXROMATISMENO.toLowerCase(),
]);

/** Triplitsa kanalion RGB. */
interface Kanalia {
  readonly kokkino: number;
  readonly prasino: number;
  readonly ble: number;
}

/** Kanalia RGB me pososto diafaneias. */
interface RgbDiafaneias extends Kanalia {
  readonly pososto: number;
}

/** Epistrefei to kanonikopoiemeno #rrggbb i null an den einai 6-psifio hex. */
function analyse_hex(timi: string): string | null {
  const tairiasma = HEX_MOTIFO.exec(timi);
  if (tairiasma === null) return null;
  const [, psifia] = tairiasma;
  return psifia === undefined ? null : `#${psifia}`;
}

/** Epistrefei ta kanalia enos rgb(... / N%) i null an den tairiazei to schima. */
function analyse_rgb(timi: string): RgbDiafaneias | null {
  const tairiasma = RGB_MOTIFO.exec(timi);
  if (tairiasma === null) return null;
  const [, kokkino, prasino, ble, pososto] = tairiasma;
  if (kokkino === undefined || prasino === undefined || ble === undefined || pososto === undefined) {
    return null;
  }
  return {
    kokkino: Number(kokkino),
    prasino: Number(prasino),
    ble: Number(ble),
    pososto: Number(pososto),
  };
}

/** Elegxei an ena pososto anoikei sta epitrepomena vimata diafaneias. */
function einai_vima_diafaneias(pososto: number): pososto is VimaDiafaneias {
  return Number.isInteger(pososto) && VIMATA_OS_ARITHMOI.includes(pososto);
}

/** Kataskevazei to kanoniko string rgb(... / N%) me validate sto pososto. */
function dimiourgise_rgb(kanalia: Kanalia, pososto: number): string {
  if (!einai_vima_diafaneias(pososto)) {
    throw new RangeError(`Mi epitrepomeno pososto diafaneias: ${pososto}. Epitrepomena: ${VIMATA_DIAFANEIAS.join(', ')}`);
  }
  return `rgb(${kanalia.kokkino} ${kanalia.prasino} ${kanalia.ble} / ${pososto}%)`;
}

/** Metatrepei ena #rrggbb se kanalia RGB - petanei se mi egkyro input. */
function apokodikopoiise_hex_kanalia(timi: string): Kanalia {
  const hex = analyse_hex(timi.trim().toLowerCase());
  if (hex === null) {
    throw new RangeError(`Mi egkyro 6-psifio hex xroma: ${timi}`);
  }
  return {
    kokkino: Number.parseInt(hex.slice(1, 3), 16),
    prasino: Number.parseInt(hex.slice(3, 5), 16),
    ble: Number.parseInt(hex.slice(5, 7), 16),
  };
}

/** Ypologizei ti sxetiki fotovoliki isotimia enos kanaliou sRGB (0-255). */
function sxetiki_fotobola(kanali: number): number {
  const epitachyimeni = kanali / 255;
  // WCAG 2.1: to katofli 0.03928 diaxwrizei ti grammiki apo ti mi grammiki aktinovolia tou sRGB
  return epitachyimeni <= 0.03928
    ? epitachyimeni / 12.92
    : Math.pow((epitachyimeni + 0.055) / 1.055, 2.4);
}

/** Ypologizei ti sxetiki fotobola (WCAG luminance) enos synolou kanalion. */
function fotovoliki_isotimia(kanalia: Kanalia): number {
  return (
    0.2126 * sxetiki_fotobola(kanalia.kokkino) +
    0.7152 * sxetiki_fotobola(kanalia.prasino) +
    0.0722 * sxetiki_fotobola(kanalia.ble)
  );
}

/** Ypologizei ti logi antithesis WCAG 2.1 metaxy dyo 6-psifion hex xromaton (me i xoris #). */
export function ypologise_antithesi(prwto: string, deutero: string): number {
  const isotimiaPrwtou = fotovoliki_isotimia(apokodikopoiise_hex_kanalia(prwto));
  const isotimiaDeuterou = fotovoliki_isotimia(apokodikopoiise_hex_kanalia(deutero));
  const pioFoteino = Math.max(isotimiaPrwtou, isotimiaDeuterou);
  const pioSkoteino = Math.min(isotimiaPrwtou, isotimiaDeuterou);
  return (pioFoteino + 0.05) / (pioSkoteino + 0.05);
}

/** Kataskevazei to kanoniko string rgb(255 255 255 / N%) - petanei se mi epitrepomeno N. */
export function aspro_diafanes(pososto: number): string {
  return dimiourgise_rgb(KANALIA_ASPRO, pososto);
}

/** Kataskevazei to kanoniko string rgb(0 0 0 / N%) - petanei se mi epitrepomeno N. */
export function mavro_diafanes(pososto: number): string {
  return dimiourgise_rgb(KANALIA_MAVRO, pososto);
}

/** Epitrepei mono ta tessera ypochreotika hex i oudetero rgb se egkekrimeno vima diafaneias. */
export function einai_epitrepomeno_xroma(timi: string): boolean {
  const katharismeni = timi.trim().toLowerCase().replace(/\s+/g, ' ');
  const hex = analyse_hex(katharismeni);
  if (hex !== null) return EPITREPOMENA_HEX.has(hex);
  const rgb = analyse_rgb(katharismeni);
  if (rgb !== null) {
    const aspro = rgb.kokkino === 255 && rgb.prasino === 255 && rgb.ble === 255;
    const mavro = rgb.kokkino === 0 && rgb.prasino === 0 && rgb.ble === 0;
    return (aspro || mavro) && einai_vima_diafaneias(rgb.pososto);
  }
  return false;
}

/** Klimaka diastimaton se px - antikatoptrizetai 1:1 sto tokens.css. */
export const DIASTIMA_1 = 4;
export const DIASTIMA_2 = 8;
export const DIASTIMA_3 = 12;
export const DIASTIMA_4 = 16;
export const DIASTIMA_5 = 24;
export const DIASTIMA_6 = 32;

/** Klimaka megeathous grammatoseiras se px - antikatoptrizetai 1:1 sto tokens.css. */
export const GRAMMATOSEIRA_MIKRO = 12;
export const GRAMMATOSEIRA_MESO = 14;
export const GRAMMATOSEIRA_MEGALO = 16;
export const GRAMMATOSEIRA_TITLOS = 20;

/** Stoiva grammatoseiron systimatos (xoris CDN kai xoris @import). */
export const GRAMMATOSEIRA_OIKOGENEIA = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Ypsos grammis gia mikra keimena. */
export const GRAMMATOSEIRA_GRAMMI_MIKRI = 1.25;

/** Ypsos grammis gia keimeno somatos. */
export const GRAMMATOSEIRA_GRAMMI_KANONIKI = 1.5;

/** Baros grammatoseiras gia kanoniko keimeno. */
export const GRAMMATOSEIRA_BAROS_KANONIKO = 400;

/** Baros grammatoseiras gia titlos/emfasi. */
export const GRAMMATOSEIRA_BAROS_ENTONO = 600;

/** Klimaka aktinon se px - antikatoptrizetai 1:1 sto tokens.css. */
export const AKTINA_MIKRO = 4;
export const AKTINA_MESO = 8;
export const AKTINA_KAPSOULA = 999;

/** Klimaka diarkeion kinisis se ms - antikatoptrizetai 1:1 sto tokens.css. */
export const DIARKEIA_GRIGORI = 120;
export const DIARKEIA_MESI = 200;
export const DIARKEIA_ARGI = 320;
