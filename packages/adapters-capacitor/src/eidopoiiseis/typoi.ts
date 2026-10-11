/**
 * Τύποι και σταθερές των τοπικών ειδοποιήσεων (κάρτα P3, D7: ΜΟΝΟ local).
 *
 * Η δομική πύλα `EidopoiiseisPugi` είναι η ΑΚΡΙΒΗΣ υπογραφή του μερών του plugin
 * `@capacitor/local-notifications` που χρησιμοποιεί ο προσαρμογέας. Δεν είναι επινόηση:
 * αντιγράφεται από τα επαληθευμένα `.d.ts` της έκδοσης 8.3.1
 * (`apps/mobile/node_modules/@capacitor/local-notifications/dist/esm/definitions.d.ts`):
 *
 *  - `schedule(options: ScheduleOptions): Promise<ScheduleResult>`
 *      → `ScheduleOptions.notifications: LocalNotificationSchema[]`,
 *        `LocalNotificationSchema` = `{ title, body, id, schedule?, extra?, ... }`,
 *        `Schedule = { at?: Date, repeats?: boolean, allowWhileIdle?: boolean, ... }`.
 *  - `cancel(options: CancelOptions): Promise<void>`
 *      → `CancelOptions.notifications: LocalNotificationDescriptor[]` = `{ id: number }`.
 *  - `cancelAll(): Promise<void>` (διαθέσιμο από 8.3.0 — verified στο ίδιο `.d.ts`).
 *  - `getPending(): Promise<PendingResult>`
 *      → `PendingResult.notifications: PendingLocalNotificationSchema[]`
 *        (`{ title, body, id, schedule?, extra? }`).
 *  - `checkPermissions(): Promise<PermissionStatus>` και
 *    `requestPermissions(): Promise<PermissionStatus>`
 *      → `PermissionStatus = { display: PermissionState }`.
 *  - `registerActionTypes(options: RegisterActionTypesOptions): Promise<void>`
 *      → `types: ActionType[]`, `ActionType = { id, actions?: Action[] }`,
 *        `Action = { id, title, ... }`.
 *
 *  - `PermissionState` (`@capacitor/core@8.5.3`, `types/definitions.d.ts`):
 *    `'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'`.
 *
 * ΓΙΑΤΙ ΔΟΜΙΚΗ ΠΥΛΑ ΚΑΙ ΟΧΙ ΑΠΕΥΘΕΙΑΣ `import` ΤΟΥ PLUGIN:
 *  Το `@capacitor/local-notifications` είναι dependency του `apps/mobile`, ΟΧΙ του
 *  `packages/adapters-capacitor` (επαληθευμένο στο `package.json` και στο `node_modules`).
 *  Το πακέτο δεν μπορεί να αλλάξει `package.json` (κανόνας lane), οπότε ο προσαρμογέας
 *  δέχεται το αντικείμενο του plugin ως εξάρτηση. Η σύνδεση με το πραγματικό
 *  `LocalNotifications` γίνεται στο `apps/mobile` (βλ. `docs/requests/G-01.md`).
 *
 *  `extra` στο plugin είναι `any`· εδώ δηλώνεται `unknown` και στενεύεται με
 *  `kleidiEnotitas_apo_extra` (μηδέν `any`, κανένα `@ts-ignore`).
 */

/** Κατάσταση άδειας, όπως τη δίνει το plugin (`PermissionState` του `@capacitor/core`). */
export type KatastasiAdieas = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';

/** Πρόγραμμα μιας ειδοποίησης — το `Schedule` του plugin, στη μορφή που χρησιμοποιείται. */
export interface PrografmaGRAMMAT {
  readonly at?: Date;
  readonly repeats?: boolean;
  readonly allowWhileIdle?: boolean;
}

/** Μία ειδοποίηση όπως τη θέλει το plugin (`LocalNotificationSchema`, περιορισμένο υποσύνολο). */
export interface EidopoiisiGRAMMAT {
  readonly title: string;
  readonly body: string;
  readonly id: number;
  readonly schedule?: PrografmaGRAMMAT;
  /** Αυξητικός αριθμός· στο plugin είναι `any`, εδώ `unknown` για μηδενικό `any`. */
  readonly extra?: unknown;
}

/** Αναγνωριστικό μιας προγραμματισμένης ειδοποίησης (`LocalNotificationDescriptor`). */
export interface descriptorsGRAMMAT {
  readonly id: number;
}

/**
 * Εκκρεμής ειδοποίηση όπως τη δίνει το `getPending` (`PendingLocalNotificationSchema`).
 * Δομικά ίδιο με τη `EidopoiisiGRAMMAT`· υπάρχει ως ξεχωριστό όνομα για να φαίνεται
 * στη σύμβαση από πού έρχεται η εγγραφή.
 */
export type AntilogoiGRAMMAT = EidopoiisiGRAMMAT;

/** Κατάσταση άδειας όπως τη δίνει το plugin (`PermissionStatus`). */
export interface KatastasiAdieasGRAMMAT {
  readonly display: KatastasiAdieas;
}

/** Μία ενέργεια στην ειδοποίηση (`Action` του plugin, περιορισμένο υποσύνολο). */
export interface EndyseiGRAMMAT {
  readonly id: string;
  readonly title: string;
}

/** Ομάδα ενεργειών (`ActionType` του plugin, περιορισμένο υποσύνολο). */
export interface TypoiEndyseonGRAMMAT {
  readonly id: string;
  readonly actions: readonly EndyseiGRAMMAT[];
}

/**
 * Η δομική πύλη: το κομμάτι του `@capacitor/local-notifications` που καλούμε.
 * Ο πραγματικός `LocalNotificationsPlugin` ικανοποιεί αυτή τη δομική υπογραφή.
 */
export interface EidopoiiseisPugi {
  checkPermissions(): Promise<KatastasiAdieasGRAMMAT>;
  requestPermissions(): Promise<KatastasiAdieasGRAMMAT>;
  schedule(o: {
    readonly notifications: readonly EidopoiisiGRAMMAT[];
  }): Promise<{ readonly notifications: readonly descriptorsGRAMMAT[] }>;
  cancel(o: { readonly notifications: readonly descriptorsGRAMMAT[] }): Promise<void>;
  cancelAll(): Promise<void>;
  getPending(): Promise<{ readonly notifications: readonly AntilogoiGRAMMAT[] }>;
  registerActionTypes(o: {
    readonly types: readonly TypoiEndyseonGRAMMAT[];
  }): Promise<void>;
}

/** Αίτημα προγραμματισμού μιας ενότητας, όπως το δίνει ο χρήστης ή ο scheduler. */
export interface AitimEidopoiseis {
  /** Σταθερό κλειδί της ενότητας — καθορίζει και το id της ειδοποίησης. */
  readonly kleidiEnotitas: string;
  readonly titlos: string;
  /** Σώμα χωρίς μυστικά (D7)· το προσαρμογέας το ελέγχει. */
  readonly soma: string;
  /** Πότε συμβαίνει η υπενθύμιση. Πρέπει να είναι στο μέλλον. */
  readonly otan: Date;
}

/** Μία προγραμματισμένη ειδοποίηση, όπως την επιστρέφει ο προσαρμογέας. */
export interface EidopoiisiProgrammatismeni {
  readonly kleidiEnotitas: string;
  readonly titlos: string;
  readonly soma: string;
  readonly otan: Date | null;
  /** Το id που δίνεται στο plugin — προκύπτει σταθερά από το κλειδί της ενότητας. */
  readonly id: number;
}

/** Κλειδί που μπαίνει στο `extra` ώστε να ξαναβρούμε την ενότητα από το `getPending`. */
export const EXTRA_KLEIDI_ENOTITAS = 'kleidiEnotitas';

/**
 * Τα action types της εφαρμογής (κάρτα P3: μελέτη / επανάληψη / σήμερα).
 * Τα `id` είναι σταθερά και με πρόθεμα `dps-`, ώστε να μη συγκρούουν με άλλες εφαρμογές.
 */
export const TYPOI_ENDYSEON: readonly TypoiEndyseonGRAMMAT[] = Object.freeze([
  Object.freeze({
    id: 'dps-melete',
    actions: Object.freeze([
      Object.freeze({ id: 'dps-melete-energeia', title: 'Ξεκίνα μελέτη' }),
      Object.freeze({ id: 'dps-melete-prosthesi', title: 'Πρόσθεσε στο πρόγραμμα' }),
    ]),
  }),
  Object.freeze({
    id: 'dps-epanalipsi',
    actions: Object.freeze([
      Object.freeze({ id: 'dps-epanalipsi-now', title: 'Υπενθύμιση τώρα' }),
      Object.freeze({ id: 'dps-epanalipsi-akiro', title: 'Ακύρωσε την υπενθύμιση' }),
    ]),
  }),
  Object.freeze({
    id: 'dps-simera',
    actions: Object.freeze([
      Object.freeze({ id: 'dps-simera-imerologia', title: 'Άνοιξε το σημερινό πρόγραμμα' }),
      Object.freeze({ id: 'dps-simera-akiro', title: 'Ακύρωσε τη σημερινή μελέτη' }),
    ]),
  }),
] as const);

/**
 * Σταθερό int32 από το κλειδί ενότητας (FNV-1a 32-bit, μάσκα σε 31 bit).
 * Είναι DETERMINISTIC: ίδιο κλειδί → ίδιο id, σε κάθε εκτέλεση και σε κάθε συσκευή,
 * ώστε να μπορεί ο χρήστης να ακυρώσει μια ειδοποίηση γνωρίζοντας μόνο την ενότητα.
 * Μηδενικό id δεν επιτρέπεται (το 0 είναι «άδειο» σε αρκετές εγγενείς εφαρμογές).
 */
export function arithmos_apok_stable(kleidiEnotitas: string): number {
  let k: number = 0x811c9dc5;
  for (let i = 0; i < kleidiEnotitas.length; i += 1) {
    k ^= kleidiEnotitas.charCodeAt(i);
    k = Math.imul(k, 0x01000193);
  }
  const proshrwmenos = (k >>> 1) & 0x7fffffff;
  return proshrwmenos === 0 ? 1 : proshrwmenos;
}

/** Διαβάζει το `kleidiEnotitas` από το `extra` του plugin, χωρίς `any` και χωρίς throw. */
export function kleidiEnotitas_apo_extra(extra: unknown): string | null {
  if (typeof extra !== 'object' || extra === null) {
    return null;
  }
  const timi = (extra as Record<string, unknown>)[EXTRA_KLEIDI_ENOTITAS];
  return typeof timi === 'string' && timi !== '' ? timi : null;
}