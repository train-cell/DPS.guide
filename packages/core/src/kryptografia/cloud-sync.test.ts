import { describe, expect, it } from 'vitest';
import {
  dimiourgia_sync_paketou,
  apokryptografisi_sync_paketou,
  epalithefsi_kai_epilysi_sygkrouseon,
  type DpsSyncManifest,
} from './cloud-sync.js';

describe('Zero-Knowledge Cloud Backup Sync (cloud-sync.ts)', () => {
  const dokimastikaDedomena = JSON.stringify({
    foititis: 'DPS Student',
    vathmoi: [10, 9, 10],
    mystikaTokens: 'vault-secret-12345',
  });
  const kleidi = 'poly-isxyros-prosopikos-kodikos-2026!';

  describe('dimiourgia_sync_paketou & apokryptografisi_sync_paketou', () => {
    it('δημιουργεί έγκυρο κρυπτογραφημένο πακέτο Zero-Knowledge AES-GCM', async () => {
      const paketo = await dimiourgia_sync_paketou(dokimastikaDedomena, kleidi, 1);

      expect(paketo.algorithmos).toBe('AES-GCM-256');
      expect(paketo.manifest.ekdosiPaketou).toBe(1);
      expect(paketo.manifest.hashDedomenon).toBeDefined();
      expect(paketo.manifest.hashDedomenon.length).toBe(64); // SHA-256 hex
      expect(paketo.encryptedPayload).toBeDefined();
      expect(paketo.encryptedPayload).not.toBe(dokimastikaDedomena);
      expect(paketo.iv).toBeDefined();
      expect(paketo.salt).toBeDefined();
    });

    it('αποκρυπτογραφεί επιτυχώς τα δεδομένα με το σωστό κλειδί (roundtrip)', async () => {
      const paketo = await dimiourgia_sync_paketou(dokimastikaDedomena, kleidi, 2);
      const apokryptografimeno = await apokryptografisi_sync_paketou(paketo, kleidi);

      expect(apokryptografimeno).toBe(dokimastikaDedomena);
    });

    it('απορρίπτει την αποκρυπτογράφηση με λάθος κλειδί (tamper resistance)', async () => {
      const paketo = await dimiourgia_sync_paketou(dokimastikaDedomena, kleidi, 1);

      await expect(
        apokryptografisi_sync_paketou(paketo, 'lathos-kodikos-xyz')
      ).rejects.toThrow();
    });
  });

  describe('epalithefsi_kai_epilysi_sygkrouseon', () => {
    const vasikoManifest: DpsSyncManifest = {
      schemaEkdosi: 1,
      ekdosiPaketou: 5,
      xronosSimioIso: '2026-10-27T10:00:00.000Z',
      hashDedomenon: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      systimaDeviceId: 'device-a',
    };

    it('επιστρέφει idies_ekdoseis όταν έκδοση και hash είναι πανομοιότυπα', () => {
      const topiko = { ...vasikoManifest };
      const apomakrysmeno = { ...vasikoManifest };

      const apotelesma = epalithefsi_kai_epilysi_sygkrouseon(topiko, apomakrysmeno);
      expect(apotelesma).toBe('idies_ekdoseis');
    });

    it('επιστρέφει topiko_neotero όταν η τοπική έκδοση και χρόνος είναι μεταγενέστερα', () => {
      const topiko: DpsSyncManifest = {
        ...vasikoManifest,
        ekdosiPaketou: 6,
        xronosSimioIso: '2026-10-27T11:00:00.000Z',
        hashDedomenon: 'hash-neo',
      };
      const apomakrysmeno = { ...vasikoManifest };

      const apotelesma = epalithefsi_kai_epilysi_sygkrouseon(topiko, apomakrysmeno);
      expect(apotelesma).toBe('topiko_neotero');
    });

    it('επιστρέφει apomakrysmeno_neotero όταν η απομακρυσμένη έκδοση και χρόνος είναι μεταγενέστερα', () => {
      const topiko = { ...vasikoManifest };
      const apomakrysmeno: DpsSyncManifest = {
        ...vasikoManifest,
        ekdosiPaketou: 6,
        xronosSimioIso: '2026-10-27T11:00:00.000Z',
        hashDedomenon: 'hash-apomakrysmeno',
      };

      const apotelesma = epalithefsi_kai_epilysi_sygkrouseon(topiko, apomakrysmeno);
      expect(apotelesma).toBe('apomakrysmeno_neotero');
    });

    it('εντοπίζει sygkrousi όταν δύο συστήματα έχουν ίδια έκδοση αλλά διαφορετικά hashes', () => {
      const topiko = { ...vasikoManifest };
      const apomakrysmeno: DpsSyncManifest = {
        ...vasikoManifest,
        hashDedomenon: 'diaforetiko-hash-synkrousis',
      };

      const apotelesma = epalithefsi_kai_epilysi_sygkrouseon(topiko, apomakrysmeno);
      expect(apotelesma).toBe('sygkrousi');
    });

    it('εντοπίζει sygkrousi όταν υπάρχει χρονική ανακολουθία (μεγαλύτερη έκδοση αλλά παλαιότερος χρόνος)', () => {
      const topiko: DpsSyncManifest = {
        ...vasikoManifest,
        ekdosiPaketou: 7,
        xronosSimioIso: '2026-10-26T09:00:00.000Z', // παλαιότερο timestamp παρά τη μεγαλύτερη έκδοση
      };
      const apomakrysmeno: DpsSyncManifest = {
        ...vasikoManifest,
        ekdosiPaketou: 5,
        xronosSimioIso: '2026-10-27T10:00:00.000Z',
      };

      const apotelesma = epalithefsi_kai_epilysi_sygkrouseon(topiko, apomakrysmeno);
      expect(apotelesma).toBe('sygkrousi');
    });
  });
});
