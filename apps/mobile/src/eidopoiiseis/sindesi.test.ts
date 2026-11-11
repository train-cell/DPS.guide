import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

/** Mock the Capacitor core so the native plugin path can be switched on/off. */
const capacitor = vi.hoisted(() => ({ isNativePlatform: () => false }));
vi.mock('@capacitor/core', () => ({ Capacitor: capacitor }));

const plugin = vi.hoisted(() => ({
  checkPermissions: vi.fn(async () => ({ display: 'granted' })),
  requestPermissions: vi.fn(async () => ({ display: 'granted' })),
  schedule: vi.fn(async () => ({ notifications: [] })),
  cancel: vi.fn(async () => ({ notifications: [] })),
  cancelAll: vi.fn(async () => ({ notifications: [] })),
  getPending: vi.fn(async () => ({ notifications: [] })),
  registerActionTypes: vi.fn(async () => ({ types: [] })),
}));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  dimiourgise_browser_pugi,
  dimiourgise_ypiresies_eidopoiseon,
  prosarmogi_plugin,
} from './sindesi.js';
import { dimiourgise_fake_eidopoiiseis_pugi } from '../../test-fixtures/fake-eidopoiiseis-pugi.js';
import type { EidopoiiseisPugi } from '@dps/adapters-capacitor';
import { CapacitorEidopoiiseis } from '@dps/adapters-capacitor';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS_SINDESI = readFileSync(join(ORISTO, 'sindesi.ts'), 'utf8');

describe('sindesi — πραγματική σύνδεση υπηρεσιών ειδοποιήσεων', () => {
  it('εκθέτει την παραγωγική browser πηγή και το service facade', () => {
    expect(typeof dimiourgise_ypiresies_eidopoiseon).toBe('function');
    expect(typeof dimiourgise_browser_pugi).toBe('function');
    expect(ARXIKOS_SINDESI).not.toContain('dimiourgise_fallback_pugi');
  });

  it('επιστρέφει αντικείμενο που ικανοποιεί το EidopoiisiYpiresies', () => {
    const ypiresies = dimiourgise_ypiresies_eidopoiseon();
    expect(typeof ypiresies.zitise_adia).toBe('function');
    expect(typeof ypiresies.zitisi_adias).toBe('function');
    expect(typeof ypiresies.programmatise_dokimi).toBe('function');
    expect(typeof ypiresies.akiro_ol).toBe('function');
    expect(typeof ypiresies.lista).toBe('function');
  });

  it('χωρίς Notification API επιστρέφει σαφή κατάσταση, χωρίς ψεύτικη άδεια', async () => {
    const original = globalThis.Notification;
    Object.defineProperty(globalThis, 'Notification', { configurable: true, value: undefined });
    try {
      const source = dimiourgise_browser_pugi();
      expect((await source.checkPermissions()).display).toBe('denied');
      await expect(source.requestPermissions()).rejects.toThrow('Browser notifications are unavailable');
    } finally {
      Object.defineProperty(globalThis, 'Notification', { configurable: true, value: original });
    }
  });
});

describe('sindesi — test-only notification port', () => {
  it('διαχειρίζεται άδεια, προγραμματισμό, λίστα και ακύρωση με ρητό fixture', async () => {
    const fixture = dimiourgise_fake_eidopoiiseis_pugi();
    expect((await fixture.checkPermissions()).display).toBe('prompt');
    expect((await fixture.requestPermissions()).display).toBe('granted');

    const ypiresies = dimiourgise_ypiresies_eidopoiseon(fixture);
    const when = new Date(Date.now() + 120_000);
    const scheduled = await ypiresies.programmatise_dokimi(when, 15, {
      courseTitle: 'ΠΛΗ201 · Προγραμματισμός',
      sectionTitle: 'Μεταβλητές και τύποι',
    });
    expect(scheduled.ok).toBe(true);
    if (!scheduled.ok) return;
    expect(scheduled.timi.kleidiEnotitas).toBe('dps-dokimi');
    expect(scheduled.timi.titlos).toContain('ΠΛΗ201 · Προγραμματισμός');
    expect(scheduled.timi.soma).toContain('Μεταβλητές και τύποι');

    const listed = await ypiresies.lista();
    expect(listed.ok).toBe(true);
    if (listed.ok) expect(listed.timi).toHaveLength(1);

    expect((await ypiresies.akiro_ol()).ok).toBe(true);
    const afterCancel = await ypiresies.lista();
    expect(afterCancel.ok).toBe(true);
    if (afterCancel.ok) expect(afterCancel.timi).toHaveLength(0);
  });

  it('δεν προγραμματίζει όταν η άδεια δεν είναι granted', async () => {
    const ypiresies = dimiourgise_ypiresies_eidopoiseon(dimiourgise_fake_eidopoiiseis_pugi());
    const result = await ypiresies.programmatise_dokimi(new Date(Date.now() + 120_000), 30);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.sfalma.kodikos).toBe('AKYROTHIKE');
  });

  it('μετατρέπει σφάλματα plugin σε αποτυχία αντί να τα αφήνει να διαφύγουν', async () => {
    const broken: EidopoiiseisPugi = {
      async checkPermissions() { throw new Error('plugin crash'); },
      async requestPermissions() { throw new Error('plugin crash'); },
      async schedule() { throw new Error('plugin crash'); },
      async cancel() { throw new Error('plugin crash'); },
      async cancelAll() { throw new Error('plugin crash'); },
      async getPending() { throw new Error('plugin crash'); },
      async registerActionTypes() { throw new Error('plugin crash'); },
    };
    const ypiresies = dimiourgise_ypiresies_eidopoiseon(broken);
    expect((await ypiresies.zitise_adia()).ok).toBe(false);
    expect((await ypiresies.zitisi_adias()).ok).toBe(false);
    expect((await ypiresies.lista()).ok).toBe(false);
    expect((await ypiresies.akiro_ol()).ok).toBe(false);
  });
});

describe('sindesi — prosarmogi_plugin', () => {
  it('επεστρέφει και καλεί όλες τις μεθόδους της πύλης', async () => {
    const pugi = prosarmogi_plugin(plugin as unknown as LocalNotificationsPlugin);

    expect(await pugi.checkPermissions()).toEqual({ display: 'granted' });
    expect(await pugi.requestPermissions()).toEqual({ display: 'granted' });
    expect(await pugi.schedule({ notifications: [] })).toEqual({ notifications: [] });
    expect(await pugi.cancel({ notifications: [] })).toEqual({ notifications: [] });
    expect(await pugi.cancelAll()).toEqual({ notifications: [] });
    expect(await pugi.getPending()).toEqual({ notifications: [] });
    expect(await pugi.registerActionTypes({ types: [{ id: 'a', actions: [] }] })).toEqual({ types: [] });
  });
});

describe('sindesi — native plugin (Capacitor)', () => {
  beforeEach(() => {
    capacitor.isNativePlatform = () => false;
  });

  it('επιλέγει το plugin όταν η πλατφόρμα είναι native', () => {
    capacitor.isNativePlatform = () => true;

    const ypiresies = dimiourgise_ypiresies_eidopoiseon();

    expect(typeof ypiresies.zitise_adia).toBe('function');
    expect(typeof ypiresies.zitisi_adias).toBe('function');
    expect(typeof ypiresies.programmatise_dokimi).toBe('function');
  });
});

describe('sindesi — browser πηγή ειδοποιήσεων', () => {
  let NotificationClass: typeof Notification;
  beforeEach(() => {
    capacitor.isNativePlatform = () => false;
    NotificationClass = class implements globalThis.Notification {
      static permission = 'granted';
      static async requestPermission() { return 'prompt'; }
      constructor(public title: string, public options?: { body?: string; tag?: string }) {}
    };
    const original = globalThis.Notification;
    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      get: () => NotificationClass,
    });
    return () => {
      Object.defineProperty(globalThis, 'Notification', {
        configurable: true,
        value: original,
      });
    };
  });

  it('δεν περιμένει όταν λείπει το schedule· η ειδοποίηση στέλνεται αμέσως', async () => {
    const source = dimiourgise_browser_pugi();

    // Χωρίς `schedule.at`· η `due` γίνεται `Date.now()` και η ειδοποίηση
    // αποστέλλεται άμεσα (αν η άδεια είναι granted).
    const apotelesma = await source.schedule({
      notifications: [{ id: 7, title: 'Τ', body: 'Σ' }],
    });
    expect(apotelesma).toEqual({ notifications: [{ id: 7 }] });
    expect((await source.getPending()).notifications).toHaveLength(0);
  });

  it('προγραμματίζει με μέλλον και με παρελθόν και ακυρώνει', async () => {
    const source = dimiourgise_browser_pugi();
    expect((await source.checkPermissions()).display).toBe('granted');

    // Μέλλον: η ειδοποίηση καθυστερεί
    const future = new Date(Date.now() + 60_000);
    expect(await source.schedule({
      notifications: [{ id: 1, title: 'Τ', body: 'Σ', schedule: { at: future } }],
    })).toEqual({ notifications: [{ id: 1 }] });
    expect(await source.getPending()).toEqual({ notifications: [{ id: 1, title: 'Τ', body: 'Σ', schedule: { at: future } }] });

    // Παρελθόν: η ειδοποίηση στέλνεται αμέσως
    const past = new Date(Date.now() - 1000);
    expect(await source.schedule({
      notifications: [{ id: 1, title: 'Τ', body: 'Σ', schedule: { at: past } }],
    })).toEqual({ notifications: [{ id: 1 }] });

    // Με το παρελθόν η ειδοποίηση στέλνεται και διαγράφεται από τα εκκρεμή
    expect((await source.getPending()).notifications).toHaveLength(0);

    await source.cancel({ notifications: [{ id: 1 }] });
    expect((await source.getPending()).notifications).toHaveLength(0);

    await source.cancelAll();
    expect((await source.getPending()).notifications).toHaveLength(0);
  });

  it('απορρίπτει τον προγραμματισμό αν δεν υπάρχει άδεια και επιστρέφει denied/prompt', async () => {
    NotificationClass.permission = 'denied';
    const source = dimiourgise_browser_pugi();
    expect((await source.checkPermissions()).display).toBe('denied');
    await expect(source.schedule({ notifications: [{ id: 1, title: 'Τ', body: 'Σ' }] })).rejects.toThrow(
      'Browser notification permission is not granted.'
    );

    NotificationClass.permission = 'prompt';
    const source2 = dimiourgise_browser_pugi();
    expect((await source2.checkPermissions()).display).toBe('prompt');
    await expect(source2.schedule({ notifications: [{ id: 1, title: 'Τ', body: 'Σ' }] })).rejects.toThrow(
      'Browser notification permission is not granted.'
    );
  });

  it('καταγράφει και ακυρώνει το κενό registerActionTypes', async () => {
    const source = dimiourgise_browser_pugi();
    expect(await source.registerActionTypes({ types: [] })).toBe(undefined);
  });

  it('απαιτεί άδεια και επιστρέφει granted', async () => {
    NotificationClass.permission = 'prompt';
    NotificationClass.requestPermission = async () => 'granted';
    const source = dimiourgise_browser_pugi();
    expect((await source.requestPermissions()).display).toBe('granted');
  });

  it('απαιτεί άδεια και επιστρέφει denied όταν δεν γίνεται αποδοχή', async () => {
    NotificationClass.permission = 'denied';
    NotificationClass.requestPermission = async () => 'denied';
    const source = dimiourgise_browser_pugi();
    expect((await source.requestPermissions()).display).toBe('denied');
  });

  it('ακυρώνει μια εκκρεμή ειδοποίηση πριν την εκτέλεση', async () => {
    const source = dimiourgise_browser_pugi();
    const future = new Date(Date.now() + 60_000);
    expect(await source.schedule({
      notifications: [{ id: 1, title: 'Τ', body: 'Σ', schedule: { at: future } }],
    })).toEqual({ notifications: [{ id: 1 }] });
    expect((await source.getPending()).notifications).toHaveLength(1);
    expect(await source.cancel({ notifications: [{ id: 1 }] })).toBe(undefined);
    expect((await source.getPending()).notifications).toHaveLength(0);
  });

  it('ακυρώνει όλες τις εκκρεμείς ειδοποιήσεις', async () => {
    const source = dimiourgise_browser_pugi();
    const future = new Date(Date.now() + 60_000);
    await source.schedule({
      notifications: [{ id: 1, title: 'Τ', body: 'Σ', schedule: { at: future } }],
    });
    await source.schedule({
      notifications: [{ id: 2, title: 'Τ', body: 'Σ', schedule: { at: future } }],
    });
    expect((await source.getPending()).notifications).toHaveLength(2);
    expect(await source.cancelAll()).toBe(undefined);
    expect((await source.getPending()).notifications).toHaveLength(0);
  });

  it('εκτελεί το setTimeout όταν φτάσει η ώρα', async () => {
    vi.useFakeTimers();
    try {
      const source = dimiourgise_browser_pugi();
      const future = new Date(Date.now() + 60_000);
      expect(await source.schedule({
        notifications: [{ id: 1, title: 'Τ', body: 'Σ', schedule: { at: future } }],
      })).toEqual({ notifications: [{ id: 1 }] });
      expect((await source.getPending()).notifications).toHaveLength(1);

      // Η ώρα έφτασε: η ειδοποίηση στέλνεται και διαγράφεται από τα εκκρεμή.
      vi.advanceTimersByTime(60_000);
      expect((await source.getPending()).notifications).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('δεν στέλνει ειδοποίηση όταν έχει ανακληθεί η άδεια', async () => {
    vi.useFakeTimers();
    try {
      const source = dimiourgise_browser_pugi();
      const future = new Date(Date.now() + 60_000);
      expect(await source.schedule({
        notifications: [{ id: 2, title: 'Τ', body: 'Σ', schedule: { at: future } }],
      })).toEqual({ notifications: [{ id: 2 }] });
      expect((await source.getPending()).notifications).toHaveLength(1);

      // Η άδεια άλλαξε πριν ξεπεράσει η προθεσμία· το `if` πηγαίνει στο ψευδές.
      NotificationClass.permission = 'denied';
      vi.advanceTimersByTime(60_000);
      expect((await source.getPending()).notifications).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('sindesi — ποιοτικοί κανόνες κώδικα', () => {
  it('δεν περιέχει any, ts-ignore ή ts-expect-error', () => {
    expect(ARXIKOS_SINDESI).not.toMatch(/:\s*any\b/);
    expect(ARXIKOS_SINDESI).not.toContain('@ts-ignore');
    expect(ARXIKOS_SINDESI).not.toContain('@ts-expect-error');
  });

  it('οι σχετικές εισαγωγές έχουν κατάληξη .js', () => {
    expect(ARXIKOS_SINDESI).toMatch(/from '\.\/[^']*?\.js'/);
    expect(ARXIKOS_SINDESI).not.toMatch(/from '\.\.?\/[^']*[^s]'/);
  });
});

describe('sindesi — programmatise_dokimi', () => {
  it('επιστρέφει αποτυχία όταν η λίστα των αποτελεσμάτων είναι κενή', async () => {
    const spy = vi.spyOn(CapacitorEidopoiiseis.prototype, 'programmatise');
    spy.mockResolvedValue({ ok: true, timi: [] } as never);
    try {
      const ypiresies = dimiourgise_ypiresies_eidopoiseon(dimiourgise_fake_eidopoiiseis_pugi());
      const result = await ypiresies.programmatise_dokimi(new Date(Date.now() + 120_000), 30);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    } finally {
      spy.mockRestore();
    }
  });
});
