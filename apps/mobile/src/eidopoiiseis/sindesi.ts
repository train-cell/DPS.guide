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
import { Capacitor } from '@capacitor/core';
import { CapacitorEidopoiiseis } from '@dps/adapters-capacitor';
import type {
  EidopoiisiGRAMMAT,
  EidopoiiseisPugi,
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

/** Real browser Notification API scheduler. Timers live only while this page remains active. */
export function dimiourgise_browser_pugi(): EidopoiiseisPugi {
  const ekkremeis = new Map<number, EidopoiisiGRAMMAT>();
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  const MAX_TIMER_MS = 2_147_000_000;

  function permission(): KatastasiAdieasGRAMMAT['display'] {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.permission === 'denied' ? 'denied' : 'prompt';
  }

  function showWhenDue(notification: EidopoiisiGRAMMAT): void {
    const due = notification.schedule?.at?.getTime() ?? Date.now();
    const remaining = due - Date.now();
    if (remaining > 0) {
      timers.set(notification.id, setTimeout(() => showWhenDue(notification), Math.min(remaining, MAX_TIMER_MS)));
      return;
    }
    timers.delete(notification.id);
    ekkremeis.delete(notification.id);
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(notification.title, { body: notification.body, tag: String(notification.id) }); }
      catch { /* Browser notification presentation failed; the UI can schedule again. */ }
    }
  }

  return {
    async checkPermissions(): Promise<KatastasiAdieasGRAMMAT> {
      return { display: permission() };
    },
    async requestPermissions(): Promise<KatastasiAdieasGRAMMAT> {
      if (typeof Notification === 'undefined') throw new Error('Browser notifications are unavailable.');
      return { display: await Notification.requestPermission() === 'granted' ? 'granted' : permission() };
    },
    async schedule(o) {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
        throw new Error('Browser notification permission is not granted.');
      }
      for (const n of o.notifications) {
        const previous = timers.get(n.id);
        if (previous !== undefined) clearTimeout(previous);
        ekkremeis.set(n.id, n);
        showWhenDue(n);
      }
      return { notifications: o.notifications.map((n) => ({ id: n.id })) };
    },
    async cancel(o) {
      for (const { id } of o.notifications) {
        const timer = timers.get(id);
        if (timer !== undefined) clearTimeout(timer);
        timers.delete(id);
        ekkremeis.delete(id);
      }
    },
    async cancelAll() {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      ekkremeis.clear();
    },
    async getPending() {
      return { notifications: [...ekkremeis.values()] };
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
  const nativePluginAvailable = typeof LocalNotifications !== 'undefined' &&
    LocalNotifications !== null && typeof LocalNotifications.checkPermissions === 'function';
  const pugi: EidopoiiseisPugi = pugiEisodou ?? (
    Capacitor.isNativePlatform() && nativePluginAvailable
      ? prosarmogi_plugin(LocalNotifications)
      : dimiourgise_browser_pugi()
  );

  const adapter = new CapacitorEidopoiiseis(pugi);

  return {
    zitise_adia: () => adapter.zitise_adia(),
    zitisi_adias: () => adapter.zitisi_adias(),
    programmatise_dokimi: async (otn, _lepta, context) => {
      const suffix = context
        ? `${context.courseTitle} · ${context.sectionTitle}`
        : 'DPS.guide';
      const apotelesma = await adapter.programmatise([
        {
          kleidiEnotitas: 'dps-dokimi',
          titlos: `Υπενθύμιση μελέτης · ${suffix}`,
          soma: `Ώρα για μελέτη: ${suffix}`,
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
