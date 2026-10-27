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
  });
});
