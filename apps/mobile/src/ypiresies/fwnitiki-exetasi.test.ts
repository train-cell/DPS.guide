import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FwnitikiExetasiYpiresia,
  ypostirizetaiFwnitikiAnagnorisi,
} from './fwnitiki-exetasi.js';

describe('FwnitikiExetasiYpiresia', () => {
  const arxikoWindow = globalThis.window;

  beforeEach(() => {
    // Reset global SpeechRecognition mocks
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Cleanup
    if (typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>).SpeechRecognition;
      delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    }
  });

  describe('Fallback περιβάλλοντος χωρίς υποστήριξη SpeechRecognition', () => {
    it('εντοπίζει ότι δεν υποστηρίζεται όταν λείπουν τα APIs', () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as Record<string, unknown>).SpeechRecognition;
        delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
      }
      expect(ypostirizetaiFwnitikiAnagnorisi()).toBe(false);

      const ypiresia = new FwnitikiExetasiYpiresia();
      expect(ypiresia.ypostirizetai()).toBe(false);
    });

    it('επιστρέφει false και καλεί safe callback σφάλματος κατά την εκκίνηση χωρίς crash', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      let minimaSfalmatos = '';

      const xekinise = ypiresia.xekina(
        () => {},
        (sfalma) => {
          minimaSfalmatos = sfalma;
        }
      );

      expect(xekinise).toBe(false);
      expect(minimaSfalmatos).toContain('δεν υποστηρίζεται');
      expect(ypiresia.einaiSeAkroasi()).toBe(false);
    });

    it('επιστρέφει false χωρίς onSfalma όταν δεν υποστηρίζεται', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();

      const xekinise = ypiresia.xekina(() => {});

      expect(xekinise).toBe(false);
      expect(ypiresia.einaiSeAkroasi()).toBe(false);
    });

    it('η μέθοδος stamata και akyrwse δεν προκαλούν σφάλμα όταν δεν υπάρχει αναγνώριση', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      expect(() => ypiresia.stamata()).not.toThrow();
      expect(() => ypiresia.akyrwse()).not.toThrow();
    });
  });

  describe('Περιβάλλον με mock SpeechRecognition', () => {
    class MockSpeechRecognition {
      lang = 'el-GR';
      continuous = false;
      interimResults = true;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn().mockImplementation(() => {
        if (this.onend) this.onend();
      });
      abort = vi.fn().mockImplementation(() => {
        if (this.onend) this.onend();
      });
    }

    beforeEach(() => {
      (globalThis as unknown as Record<string, unknown>).window = {
        SpeechRecognition: MockSpeechRecognition,
      };
    });

    afterEach(() => {
      (globalThis as unknown as Record<string, unknown>).window = arxikoWindow;
    });

    it('εντοπίζει ορθά την υποστήριξη SpeechRecognition', () => {
      expect(ypostirizetaiFwnitikiAnagnorisi()).toBe(true);
      const ypiresia = new FwnitikiExetasiYpiresia();
      expect(ypiresia.ypostirizetai()).toBe(true);
    });

    it('εντοπίζει το webkit fallback όταν λείπει το SpeechRecognition', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        webkitSpeechRecognition: MockSpeechRecognition,
      };

      expect(ypostirizetaiFwnitikiAnagnorisi()).toBe(true);
    });

    it('δεν εντοπίζει API όταν η τιμή δεν είναι συνάρτηση', () => {
      (globalThis as unknown as Record<string, unknown>).window = {
        SpeechRecognition: {} as unknown as typeof MockSpeechRecognition,
      };

      expect(ypostirizetaiFwnitikiAnagnorisi()).toBe(false);
    });

    it('προωθεί ενδιάμεσα αποτελέσματα και κενό κείμενο', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      const mockResultCallback = vi.fn();

      const xekinise = ypiresia.xekina(mockResultCallback);
      expect(xekinise).toBe(true);

      const recognitionInstance = (ypiresia as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;

      if (recognitionInstance && recognitionInstance.onresult) {
        // μη τελικό (ενδιάμεσο) αποτέλεσμα
        recognitionInstance.onresult({
          resultIndex: 0,
          results: [
            Object.assign([{ transcript: 'ενδιάμεσα' }], { isFinal: false }),
          ],
        });
        // κενό αποτέλεσμα
        recognitionInstance.onresult({
          resultIndex: 0,
          results: [{ resultIndex: 0, transcript: '' }],
        });
        // null element
        recognitionInstance.onresult({
          resultIndex: 0,
          results: [null],
        });
      }

      expect(mockResultCallback).toHaveBeenCalledWith('ενδιάμεσα', false);
      expect(mockResultCallback).not.toHaveBeenCalledWith('', false);
    });

    it('στέλνει κενό μήνυμα σφάλματος όταν λείπει το error', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      const mockErrorCallback = vi.fn();

      ypiresia.xekina(() => {}, mockErrorCallback);

      const recognitionInstance = (ypiresia as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      if (recognitionInstance && recognitionInstance.onerror) {
        recognitionInstance.onerror({ error: '' });
      }

      expect(mockErrorCallback).toHaveBeenCalledWith('Σφάλμα φωνητικής αναγνώρισης.');
    });

    it('καταγράφει μη-Error σφάλμα όταν ρίπτει ο constructor', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      const mockErrorCallback = vi.fn();

      class ThrowingSpeechRecognition {
        lang = 'el-GR';
        continuous = false;
        interimResults = true;
        onresult = null;
        onerror = null;
        onend = null;
        start = vi.fn(() => {
          throw 'δεν μπορώ';
        });
        stop = vi.fn();
        abort = vi.fn();
      }

      (globalThis as unknown as Record<string, unknown>).window = {
        SpeechRecognition: ThrowingSpeechRecognition,
      };

      const xekinise = ypiresia.xekina(() => {}, mockErrorCallback);
      expect(xekinise).toBe(false);
      expect(mockErrorCallback).toHaveBeenCalledWith(
        'Αποτυχία εκκίνησης φωνητικής αναγνώρισης: δεν μπορώ'
      );
    });

    it('ξεκινά την αναγνώριση και λαμβάνει φωνητικά αποτελέσματα', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      const mockResultCallback = vi.fn();

      const xekinise = ypiresia.xekina(mockResultCallback);
      expect(xekinise).toBe(true);
      expect(ypiresia.einaiSeAkroasi()).toBe(true);

      // Προσομοίωση αποτελέσματος
      const recognitionInstance = (ypiresia as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      expect(recognitionInstance).toBeDefined();

      if (recognitionInstance && recognitionInstance.onresult) {
        recognitionInstance.onresult({
          resultIndex: 0,
          results: [
            Object.assign([{ transcript: 'δυαδική αναζήτηση' }], {
              isFinal: true,
            }),
          ],
        });
      }

      expect(mockResultCallback).toHaveBeenCalledWith('δυαδική αναζήτηση', true);
    });

    it('διαχειρίζεται σφάλματα της μηχανής ομιλίας', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      const mockErrorCallback = vi.fn();

      ypiresia.xekina(() => {}, mockErrorCallback);

      const recognitionInstance = (ypiresia as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      if (recognitionInstance && recognitionInstance.onerror) {
        recognitionInstance.onerror({ error: 'no-speech' });
      }

      expect(mockErrorCallback).toHaveBeenCalledWith('no-speech');
    });

    it('σταματά και ακυρώνει την ακρόαση ορθά', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      ypiresia.xekina(() => {});
      expect(ypiresia.einaiSeAkroasi()).toBe(true);

      ypiresia.stamata();
      expect(ypiresia.einaiSeAkroasi()).toBe(false);
    });

    it('χρησιμοποιεί τα προεπιλεγμένα όταν περνάνε undefined τιμές', () => {
      const ypiresia = new FwnitikiExetasiYpiresia({
        glwssa: undefined,
        synexisKatagrafi: undefined,
        prosorinaApotelesmata: undefined,
      });

      const mockResultCallback = vi.fn();
      const xekinise = ypiresia.xekina(mockResultCallback);
      expect(xekinise).toBe(true);

      const recognitionInstance = (ypiresia as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      if (recognitionInstance && recognitionInstance.onresult) {
        recognitionInstance.onresult({
          resultIndex: 0,
          results: [Object.assign([{ transcript: 'τέστ' }], { isFinal: true })],
        });
      }

      expect(mockResultCallback).toHaveBeenCalledWith('τέστ', true);
    });

    it('επεξεργάζεται onerror χωρίς onSfalma και χωρίς σφάλμα', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      const mockResultCallback = vi.fn();

      // χωρίς onSfalma → false branch στο if (onSfalma)
      ypiresia.xekina(mockResultCallback);

      const recognitionInstance = (ypiresia as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      if (recognitionInstance && recognitionInstance.onerror) {
        recognitionInstance.onerror({ error: '' });
      }

      expect(mockResultCallback).not.toHaveBeenCalled();
    });

    it('επεξεργάζεται onerror χωρίς onSfalma όταν υπάρχει σφάλμα', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      const mockResultCallback = vi.fn();

      ypiresia.xekina(mockResultCallback);

      const recognitionInstance = (ypiresia as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      if (recognitionInstance && recognitionInstance.onerror) {
        recognitionInstance.onerror({ error: 'no-speech', message: 'δεν μίλησες' });
      }

      expect(mockResultCallback).not.toHaveBeenCalled();
    });

    it('δεν καλεί onSfalma όταν ρίπτει ο constructor και δεν δίνεται onSfalma', () => {
      class ThrowingSpeechRecognition {
        lang = 'el-GR';
        continuous = false;
        interimResults = true;
        onresult = null;
        onerror = null;
        onend = null;
        start = vi.fn(() => {
          throw new Error('σφάλμα εκκίνησης');
        });
        stop = vi.fn();
        abort = vi.fn();
      }

      (globalThis as unknown as Record<string, unknown>).window = {
        SpeechRecognition: ThrowingSpeechRecognition,
      };

      const ypiresia = new FwnitikiExetasiYpiresia();
      const xekinise = ypiresia.xekina(() => {});
      expect(xekinise).toBe(false);
      expect(ypiresia.einaiSeAkroasi()).toBe(false);
    });

    it('καταγράφει σφάλμα όταν ρίπτει το stop/abort (Error ή όχι)', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      ypiresia.xekina(() => {});

      const recognitionInstance = (ypiresia as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      if (recognitionInstance) {
        recognitionInstance.stop = vi.fn(() => {
          throw new Error('δεν σταματά');
        });
      }
      expect(() => ypiresia.stamata()).not.toThrow();

      const ypiresia2 = new FwnitikiExetasiYpiresia();
      ypiresia2.xekina(() => {});
      const rec2 = (ypiresia2 as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      if (rec2) {
        rec2.abort = vi.fn(() => {
          throw 'δεν ακυρώνει';
        });
      }
      expect(() => ypiresia2.akyrwse()).not.toThrow();
    });

    it('καταγράφει σφάλμα όταν ρίπτει το stop/abort με αντίστροφη μορφή σφάλματος', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      ypiresia.xekina(() => {});

      const recognitionInstance = (ypiresia as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      if (recognitionInstance) {
        recognitionInstance.stop = vi.fn(() => {
          throw 'δεν σταματά';
        });
      }
      expect(() => ypiresia.stamata()).not.toThrow();

      const ypiresia2 = new FwnitikiExetasiYpiresia();
      ypiresia2.xekina(() => {});
      const rec2 = (ypiresia2 as unknown as { recognitionInstance: MockSpeechRecognition }).recognitionInstance;
      if (rec2) {
        rec2.abort = vi.fn(() => {
          throw new Error('δεν ακυρώνει');
        });
      }
      expect(() => ypiresia2.akyrwse()).not.toThrow();
    });

    it('δεν κάνει τίποτα το akyrwse χωρίς αναγνώριση', () => {
      const ypiresia = new FwnitikiExetasiYpiresia();
      expect(() => ypiresia.akyrwse()).not.toThrow();
      expect(ypiresia.einaiSeAkroasi()).toBe(false);
    });
  });
});
