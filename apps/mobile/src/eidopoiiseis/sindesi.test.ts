import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  dimiourgise_fallback_pugi,
  dimiourgise_ypiresies_eidopoiseon,
} from './sindesi.js';
import type { EidopoiiseisPugi } from '@dps/adapters-capacitor';

const ORISTO = dirname(fileURLToPath(import.meta.url));
const ARXIKOS_SINDESI = readFileSync(join(ORISTO, 'sindesi.ts'), 'utf8');

describe('sindesi — συμβόλαιο σύνδεσης υπηρεσιών ειδοποιήσεων', () => {
  it('εξάγει τις απαιτούμενες συναρτήσεις', () => {
    expect(typeof dimiourgise_ypiresies_eidopoiseon).toBe('function');
    expect(typeof dimiourgise_fallback_pugi).toBe('function');
  });

  it('επιστρέφει αντικείμενο που ικανοποιεί το EidopoiisiYpiresies', () => {
    const ypiresies = dimiourgise_ypiresies_eidopoiseon();
    expect(typeof ypiresies.zitise_adia).toBe('function');
    expect(typeof ypiresies.zitisi_adias).toBe('function');
    expect(typeof ypiresies.programmatise_dokimi).toBe('function');
    expect(typeof ypiresies.akiro_ol).toBe('function');
    expect(typeof ypiresies.lista).toBe('function');
  });
});

describe('sindesi — fallback plugin συμπεριφορά', () => {
  it('το fallback plugin υποστηρίζει κύκλο ελέγχου και αίτησης άδειας', async () => {
    const fallback = dimiourgise_fallback_pugi();
    const elegxos = await fallback.checkPermissions();
    expect(elegxos.display).toBe('prompt');

    const aitima = await fallback.requestPermissions();
    expect(aitima.display).toBe('granted');

    const meta = await fallback.checkPermissions();
    expect(meta.display).toBe('granted');
  });

  it('το fallback plugin υποστηρίζει κύκλο προγραμματισμού, λίστας και ακύρωσης', async () => {
    const fallback = dimiourgise_fallback_pugi();
    const aitima = await fallback.schedule({
      notifications: [
        {
          id: 101,
          title: 'Δοκιμή',
          body: 'Κείμενο',
          schedule: { at: new Date(Date.now() + 60000) },
        },
      ],
    });
    expect(aitima.notifications).toEqual([{ id: 101 }]);

    const lista = await fallback.getPending();
    expect(lista.notifications).toHaveLength(1);
    expect(lista.notifications[0]?.id).toBe(101);

    await fallback.cancel({ notifications: [{ id: 101 }] });
    const metaAkirosi = await fallback.getPending();
    expect(metaAkirosi.notifications).toHaveLength(0);
  });

  it('το fallback plugin cancelAll αδειάζει τις εκκρεμείς', async () => {
    const fallback = dimiourgise_fallback_pugi();
    await fallback.schedule({
      notifications: [
        { id: 1, title: 'A', body: 'B' },
        { id: 2, title: 'C', body: 'D' },
      ],
    });
    const prin = await fallback.getPending();
    expect(prin.notifications).toHaveLength(2);

    await fallback.cancelAll();
    const meta = await fallback.getPending();
    expect(meta.notifications).toHaveLength(0);
  });
});

describe('sindesi — ροή υπηρεσιών με προσαρμοσμένη πηγή', () => {
  it('λειτουργεί επιτυχώς όταν η άδεια είναι granted', async () => {
    const fallback = dimiourgise_fallback_pugi();
    await fallback.requestPermissions(); // granted

    const ypiresies = dimiourgise_ypiresies_eidopoiseon(fallback);

    const stathmosAdias = await ypiresies.zitise_adia();
    expect(stathmosAdias.ok).toBe(true);
    if (stathmosAdias.ok) {
      expect(stathmosAdias.timi).toBe('granted');
    }

    const otan = new Date(Date.now() + 120000);
    const dokimi = await ypiresies.programmatise_dokimi(otan, 15);
    expect(dokimi.ok).toBe(true);
    if (dokimi.ok) {
      expect(dokimi.timi.kleidiEnotitas).toBe('dps-dokimi');
      expect(dokimi.timi.titlos).toBe('Δοκιμή ειδοποίησης');
      expect(dokimi.timi.soma).toBe('Λειτουργούν οι τοπικές ειδοποιήσεις.');
    }

    const lista = await ypiresies.lista();
    expect(lista.ok).toBe(true);
    if (lista.ok) {
      expect(lista.timi).toHaveLength(1);
    }

    const akiro = await ypiresies.akiro_ol();
    expect(akiro.ok).toBe(true);

    const metaAkirosi = await ypiresies.lista();
    expect(metaAkirosi.ok).toBe(true);
    if (metaAkirosi.ok) {
      expect(metaAkirosi.timi).toHaveLength(0);
    }
  });

  it('απορρίπτει τον προγραμματισμό όταν η άδεια δεν είναι granted', async () => {
    const fallback = dimiourgise_fallback_pugi(); // prompt
    const ypiresies = dimiourgise_ypiresies_eidopoiseon(fallback);

    const otan = new Date(Date.now() + 120000);
    const apotelesma = await ypiresies.programmatise_dokimi(otan, 30);
    expect(apotelesma.ok).toBe(false);
    if (!apotelesma.ok) {
      expect(apotelesma.sfalma.kodikos).toBe('AKYROTHIKE');
    }
  });

  it('διαχειρίζεται σφάλματα plugin επιστρέφοντας apotyxia, ποτέ throw', async () => {
    const sfalmatikiPugi: EidopoiiseisPugi = {
      async checkPermissions() {
        throw new Error('Plugin crash');
      },
      async requestPermissions() {
        throw new Error('Plugin crash');
      },
      async schedule() {
        throw new Error('Plugin crash');
      },
      async cancel() {
        throw new Error('Plugin crash');
      },
      async cancelAll() {
        throw new Error('Plugin crash');
      },
      async getPending() {
        throw new Error('Plugin crash');
      },
      async registerActionTypes() {
        throw new Error('Plugin crash');
      },
    };

    const ypiresies = dimiourgise_ypiresies_eidopoiseon(sfalmatikiPugi);
    const adia = await ypiresies.zitise_adia();
    expect(adia.ok).toBe(false);

    const aitima = await ypiresies.zitisi_adias();
    expect(aitima.ok).toBe(false);

    const lista = await ypiresies.lista();
    expect(lista.ok).toBe(false);

    const akiro = await ypiresies.akiro_ol();
    expect(akiro.ok).toBe(false);
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
