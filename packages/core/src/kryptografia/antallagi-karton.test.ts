import { describe, expect, it } from 'vitest';
import {
  epikyrosi_paketou,
  exagwgi_kryptografimenou_paketou,
  eisagwgi_kryptografimenou_paketou,
  type PaketoKartonPayload,
} from './antallagi-karton.js';

describe('antallagi-karton (Peer-to-Peer Encrypted Study Decks)', () => {
  const deigmaPaketou: PaketoKartonPayload = {
    id: 'deck-cs-101',
    titlos: 'Δομές Δεδομένων & Αλγόριθμοι',
    perigrafi: 'Βασικές έννοιες στοίβας, ουράς και δυαδικής αναζήτησης',
    mathima_id: 'CS-101',
    dimiourgos: 'Φοιτητής DPS',
    dimiourgithike: '2026-10-27T10:00:00.000Z',
    kartes: [
      {
        id: 'k1',
        erwtisi: 'Ποια είναι η αρχή λειτουργίας της στοίβας;',
        apantisi: 'LIFO (Last In First Out)',
        lexeisKleidia: ['lifo', 'στοιβα'],
        ennoia: 'Δομές Δεδομένων',
      },
      {
        id: 'k2',
        erwtisi: 'Ποια είναι η πολυπλοκότητα της δυαδικής αναζήτησης;',
        apantisi: 'O(log n)',
        lexeisKleidia: ['λογαριθμικη', 'αναζητηση'],
        ennoia: 'Αλγόριθμοι',
      },
    ],
  };

  const kleidi = 'MystikoKleidi123!';

  it('κρυπτογραφεί και αποκρυπτογραφεί επιτυχώς πακέτο καρτών (roundtrip)', async () => {
    const encoded = await exagwgi_kryptografimenou_paketou(deigmaPaketou, kleidi);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(50);

    const apokryptografimeno = await eisagwgi_kryptografimenou_paketou(encoded, kleidi);
    expect(apokryptografimeno.id).toBe(deigmaPaketou.id);
    expect(apokryptografimeno.titlos).toBe(deigmaPaketou.titlos);
    expect(apokryptografimeno.kartes.length).toBe(2);
    expect(apokryptografimeno.kartes[0]!.erwtisi).toBe(deigmaPaketou.kartes[0]!.erwtisi);
    expect(apokryptografimeno.kartes[0]!.apantisi).toBe(deigmaPaketou.kartes[0]!.apantisi);
  });

  it('διατηρεί πλήρως ελληνικούς χαρακτήρες με τόνους, σύμβολα και emoji', async () => {
    const paketoMeEmoji: PaketoKartonPayload = {
      id: 'deck-greek-emoji',
      titlos: 'Ελληνικά & Σύμβολα 🚀✨',
      dimiourgithike: '2026-10-27T10:00:00.000Z',
      kartes: [
        {
          erwtisi: 'Τι σημαίνει το σύμβολο Σ;',
          apantisi: 'Άθροισμα (Summation) ∑',
        },
      ],
    };

    const encoded = await exagwgi_kryptografimenou_paketou(paketoMeEmoji, kleidi);
    const decrypted = await eisagwgi_kryptografimenou_paketou(encoded, kleidi);

    expect(decrypted.titlos).toBe('Ελληνικά & Σύμβολα 🚀✨');
    expect(decrypted.kartes[0]!.apantisi).toBe('Άθροισμα (Summation) ∑');
  });

  it('απορρίπτει την αποκρυπτογράφηση όταν δοθεί λανθασμένο κλειδί', async () => {
    const encoded = await exagwgi_kryptografimenou_paketou(deigmaPaketou, kleidi);

    await expect(
      eisagwgi_kryptografimenou_paketou(encoded, 'LathosKleidi999!')
    ).rejects.toThrow(/λανθασμένο κλειδί/i);
  });

  it('απορρίπτει πακέτο εάν αλλοιωθεί το κρυπτογράφημα (tampering / checksum)', async () => {
    const encoded = await exagwgi_kryptografimenou_paketou(deigmaPaketou, kleidi);

    // Αποκωδικοποίηση JSON, παραποίηση checksum
    const jsonStr = atob(encoded);
    const paketoObj = JSON.parse(jsonStr);
    paketoObj.checksum = '0000000000000000000000000000000000000000000000000000000000000000';
    const tamperedEncoded = btoa(JSON.stringify(paketoObj));

    await expect(
      eisagwgi_kryptografimenou_paketou(tamperedEncoded, kleidi)
    ).rejects.toThrow(/checksum|αλλοιω/i);
  });

  it('απορρίπτει πακέτο με άκυρους τύπους δεδομένων (validation τύπων)', async () => {
    const akyroPayload = {
      id: 12345, // όχι string
      titlos: '', // κενός
      kartes: 'όχι array',
    } as unknown as PaketoKartonPayload;

    // Η εξαγωγή απορρίπτει άμεσα άκυρο payload
    await expect(
      exagwgi_kryptografimenou_paketou(akyroPayload, kleidi)
    ).rejects.toThrow(/μη έγκυρο|αλφαριθμητικό/i);
  });

  it('επακυρώνει το πακέτο μέσω της συνάρτησης τύπων (κάθε πεδίο)', () => {
    // id: δεν είναι string
    expect(() => epikyrosi_paketou({ ...deigmaPaketou, id: 42 })).toThrow(/αλφαριθμητικό/);
    // id: κενό
    expect(() => epikyrosi_paketou({ ...deigmaPaketou, id: '' })).toThrow(/αλφαριθμητικό/);
    // titlos: δεν είναι string
    expect(() => epikyrosi_paketou({ ...deigmaPaketou, titlos: 1 })).toThrow(/τίτλος/);
    // kartes: δεν είναι πίνακας
    expect(() => epikyrosi_paketou({ ...deigmaPaketou, kartes: 'όχι πίνακας' })).toThrow(/πίνακας/);

    // κάρτα: δεν είναι αντικείμενο
    expect(
      () => epikyrosi_paketou({ ...deigmaPaketou, kartes: [null] as never })
    ).toThrow(/κάρτα στη θέση/);
    // κάρτα: λείπει η ερώτηση
    expect(
      () => epikyrosi_paketou({ ...deigmaPaketou, kartes: [{ apantisi: 'ναι' }] as never })
    ).toThrow(/λείπει έγκυρη ερώτηση/);
    // κάρτα: λείπει η απάντηση
    expect(
      () => epikyrosi_paketou({ ...deigmaPaketou, kartes: [{ erwtisi: 'ναι' }] as never })
    ).toThrow(/λείπει έγκυρη απάντηση/);
  });

  it('χρησιμοποιεί το προεπιλεγμένο πλήθος επαναλήψεων PBKDF2 όταν λείπει το πεδίο', async () => {
    const encoded = await exagwgi_kryptografimenou_paketou(deigmaPaketou, kleidi);
    const payload = JSON.parse(atob(encoded));
    delete payload.epanalipseisKdf;
    const withoutKdf = btoa(JSON.stringify(payload));

    const decoded = await eisagwgi_kryptografimenou_paketou(withoutKdf, kleidi);
    expect(decoded).toEqual(deigmaPaketou);
  });

  it('πετάει σφάλμα αν δοθεί κενό κλειδί ή κενό κωδικοποιημένο string', async () => {
    await expect(
      exagwgi_kryptografimenou_paketou(deigmaPaketou, '')
    ).rejects.toThrow(/κλειδί/i);

    await expect(
      eisagwgi_kryptografimenou_paketou('', kleidi)
    ).rejects.toThrow(/κεν/i);

    // Κενό μυστικό κλειδί (δεύτερος έλεγχος)
    const encoded = await exagwgi_kryptografimenou_paketou(deigmaPaketou, kleidi);
    await expect(eisagwgi_kryptografimenou_paketou(encoded, '')).rejects.toThrow(/μυστικό κλειδί/);
  });

  it('απορρίπτει μη base64 συμβολοσειρά', async () => {
    await expect(eisagwgi_kryptografimenou_paketou('όχι base64!!!', kleidi)).rejects.toThrow(
      /Μη έγκυρη μορφή πακέτου/
    );
  });

  it('απορρίπτει πακέτο με ελλιπή δομή κρυπτογράφησης', async () => {
    const jsonStr = btoa(JSON.stringify({ ekdosi: 1, algarithmos: 'AES-256-GCM', kdf: 'PBKDF2-SHA256' }));
    await expect(eisagwgi_kryptografimenou_paketou(jsonStr, kleidi)).rejects.toThrow(
      /Μη έγκυρη μορφή φακέλου/
    );
  });
});
