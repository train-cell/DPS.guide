/**
 * Σύνδεση τοπικών ειδοποιήσεων με την πλατφόρμα Capacitor (κάρτα P3).
 *
 * Εξάγει τη συνάρτηση `dimiourgise_ypiresies_eidopoiseon()`, συνδέοντας το
 * `CapacitorEidopoiiseis` του `@dps/adapters-capacitor` με τη δομική πύλα
 * `EidopoiisiYpiresies` της οθόνης.
 *
 * D7: ΜΟΝΟ τοπικές ειδοποιήσεις — κανένας διακομιστής, μηδέν μυστικά, μηδέν PII.
 * Αν το plugin `LocalNotifications` δεν είναι διαθέσιμο (π.χ. σε περιβάλλον web/mock
 * ή SSR/node), παρέχεται διαφανές fallback ώστε η εφαρμογή να μην καταρρέει ποτέ.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import type { LocalNotificationsPlugin } from '@capacitor/local-notifications';
import { CapacitorEidopoiiseis } from '@dps/adapters-capacitor';
import type {
  EidopoiisiGRAMMAT,
  EidopoiiseisPugi,
  KatastasiAdieas,
  KatastasiAdieasGRAMMAT,
} from '@dps/adapters-capacitor';
import { apotyxia, ok } from '@dps/core';
import type { EidopoiisiYpiresies } from './eidopoiiseis-typoi.js';

/** Προσαρμογή του Capacitor plugin στη δομική πύλα EidopoiiseisPugi. */
export function prosarmogi_plugin(plugin: LocalNotificationsPlugin): EidopoiiseisPugi {
  return {
    checkPermissions: () => plugin.checkPermissions(),
    requestPermissions: () => plugin.requestPermissions(),
    schedule: (o) => plugin.schedule({ notifications: [...o.notifications] }),
    cancel: (o) => plugin.cancel({ notifications: [...o.notifications] }),
    cancelAll: () => plugin.cancelAll(),
    getPending: () => plugin.getPending(),
    registerActionTypes: (o) =>
      plugin.registerActionTypes({
        types: o.types.map((t) => ({
          id: t.id,
          actions: [...t.actions],
        })),
      }),
  };
}

/** Δημιουργία δομικού fallback plugin όταν το Capacitor LocalNotifications λείπει. */
export function dimiourgise_fallback_pugi(): EidopoiiseisPugi {
  let adia: KatastasiAdieas = 'prompt';
  let ekkremeis: EidopoiisiGRAMMAT[] = [];

  return {
    async checkPermissions(): Promise<KatastasiAdieasGRAMMAT> {
      return { display: adia };
    },
    async requestPermissions(): Promise<KatastasiAdieasGRAMMAT> {
      adia = 'granted';
      return { display: adia };
    },
    async schedule(o) {
      for (const n of o.notifications) {
        ekkremeis = ekkremeis.filter((p) => p.id !== n.id);
        ekkremeis.push(n);
      }
      return { notifications: o.notifications.map((n) => ({ id: n.id })) };
    },
    async cancel(o) {
      const diagrafiIds = new Set(o.notifications.map((n) => n.id));
      ekkremeis = ekkremeis.filter((p) => !diagrafiIds.has(p.id));
    },
    async cancelAll() {
      ekkremeis = [];
    },
    async getPending() {
      return { notifications: [...ekkremeis] };
    },
    async registerActionTypes() {
      // Καμία ενέργεια στο fallback
    },
  };
}

/**
 * Κατασκευάζει και επιστρέφει την υλοποίηση του `EidopoiisiYpiresies`.
 * Δέχεται προαιρετικά πηγή plugin για ευκολία σε δοκιμές/mocks.
 */
export function dimiourgise_ypiresies_eidopoiseon(
  pugiEisodou?: EidopoiiseisPugi
): EidopoiisiYpiresies {
  const pugi: EidopoiiseisPugi =
    pugiEisodou ??
    (typeof LocalNotifications !== 'undefined' &&
    LocalNotifications !== null &&
    typeof LocalNotifications.checkPermissions === 'function'
      ? prosarmogi_plugin(LocalNotifications)
      : dimiourgise_fallback_pugi());

  const adapter = new CapacitorEidopoiiseis(pugi);

  return {
    zitise_adia: () => adapter.zitise_adia(),
    zitisi_adias: () => adapter.zitisi_adias(),
    programmatise_dokimi: async (otn, _lepta) => {
      const apotelesma = await adapter.programmatise([
        {
          kleidiEnotitas: 'dps-dokimi',
          titlos: 'Δοκιμή ειδοποίησης',
          soma: 'Λειτουργούν οι τοπικές ειδοποιήσεις.',
          otan: otn,
        },
      ]);
      if (!apotelesma.ok) {
        return apotelesma;
      }
      const proti = apotelesma.timi[0];
      if (!proti) {
        return apotyxia('MI_EGKYRO_SXIMA', 'Δεν επιστράφηκε προγραμματισμένη ειδοποίηση');
      }
      return ok(proti);
    },
    akiro_ol: () => adapter.akiro_ol(),
    lista: () => adapter.lista_programmatismenon(),
  };
}
