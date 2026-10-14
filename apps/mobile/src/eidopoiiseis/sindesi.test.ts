import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  dimiourgise_browser_pugi,
  dimiourgise_ypiresies_eidopoiseon,
} from './sindesi.js';
import { dimiourgise_fake_eidopoiiseis_pugi } from '../../test-fixtures/fake-eidopoiiseis-pugi.js';
import type { EidopoiiseisPugi } from '@dps/adapters-capacitor';

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
