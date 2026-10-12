import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Ελαφρύ mock DOM & localStorage για το Node vitest περιβάλλον
class MockClassList {
  private classes = new Set<string>();
  add(cls: string): void {
    this.classes.add(cls);
  }
  remove(cls: string): void {
    this.classes.delete(cls);
  }
  contains(cls: string): boolean {
    return this.classes.has(cls);
  }
}

class MockElement {
  private attributes = new Map<string, string>();
  public classList = new MockClassList();
  public style: { colorScheme?: string } = {};

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, String(value));
  }
  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }
}

class MockStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

if (typeof globalThis.document === 'undefined') {
  Object.defineProperty(globalThis, 'document', {
    value: { documentElement: new MockElement() },
    configurable: true,
    writable: true,
  });
}

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MockStorage(),
    configurable: true,
    writable: true,
  });
}

import {
  THEMATA,
  THEMATA_IDS,
  APOTHEKE_KLEIDI_THEMATOS,
  einai_egkyro_thema,
  pare_trexon_thema,
  thete_thema,
  arxikopoiisi_thematos,
  type ThemaId,
} from './themata.js';

const THEMATA_CSS = readFileSync(fileURLToPath(new URL('./themata.css', import.meta.url)), 'utf8');
const NAVIGASI_CSS = readFileSync(fileURLToPath(new URL('../navigasi/navigasi.css', import.meta.url)), 'utf8');

describe('Themata - ορισμοί και σταθερές 4 θεμάτων', () => {
  it('παρέχει ακριβώς τα 4 υποχρεωτικά αναγνωριστικά θεμάτων', () => {
    expect(THEMATA_IDS).toEqual(['midnight', 'unistudents', 'emerald', 'light']);
  });

  it('ο πίνακας THEMATA περιέχει 4 έγκυρα θέματα με σωστά hex χρώματα', () => {
    expect(THEMATA).toHaveLength(4);
    const ids = THEMATA.map((th) => th.id);
    expect(ids).toEqual(['midnight', 'unistudents', 'emerald', 'light']);

    const midnight = THEMATA.find((th) => th.id === 'midnight');
    expect(midnight?.fontoHex).toBe('#0B0B0C');
    expect(midnight?.kartaHex).toBe('#161618');
    expect(midnight?.entonoHex).toBe('#3B82F6');
    expect(midnight?.einaiSkouro).toBe(true);

    const unistudents = THEMATA.find((th) => th.id === 'unistudents');
    expect(unistudents?.fontoHex).toBe('#0A1128');
    expect(unistudents?.kartaHex).toBe('#132247');
    expect(unistudents?.entonoHex).toBe('#2563EB');
    expect(unistudents?.defterevonHex).toBe('#38BDF8');
    expect(unistudents?.einaiSkouro).toBe(true);

    const emerald = THEMATA.find((th) => th.id === 'emerald');
    expect(emerald?.fontoHex).toBe('#081C15');
    expect(emerald?.kartaHex).toBe('#112F24');
    expect(emerald?.entonoHex).toBe('#10B981');
    expect(emerald?.einaiSkouro).toBe(true);

    const light = THEMATA.find((th) => th.id === 'light');
    expect(light?.fontoHex).toBe('#F8FAFC');
    expect(light?.kartaHex).toBe('#FFFFFF');
    expect(light?.entonoHex).toBe('#2563EB');
    expect(light?.einaiSkouro).toBe(false);
  });

  it('το einai_egkyro_thema αποδέχεται μόνο τα 4 θέματα', () => {
    for (const id of THEMATA_IDS) {
      expect(einai_egkyro_thema(id)).toBe(true);
    }
    expect(einai_egkyro_thema('neon')).toBe(false);
    expect(einai_egkyro_thema('dark')).toBe(false);
    expect(einai_egkyro_thema('')).toBe(false);
    expect(einai_egkyro_thema(null)).toBe(false);
    expect(einai_egkyro_thema(undefined)).toBe(false);
    expect(einai_egkyro_thema(123)).toBe(false);
  });
});

describe('Themata - λειτουργίες ενεργοποίησης και αποθήκευσης', () => {
  let arxikoThemaDom: string | null = null;
  let arxikoStorage: string | null = null;

  beforeEach(() => {
    arxikoThemaDom = document.documentElement.getAttribute('data-theme');
    arxikoStorage = localStorage.getItem(APOTHEKE_KLEIDI_THEMATOS);
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem(APOTHEKE_KLEIDI_THEMATOS);
  });

  afterEach(() => {
    if (arxikoThemaDom) {
      document.documentElement.setAttribute('data-theme', arxikoThemaDom);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    if (arxikoStorage) {
      localStorage.setItem(APOTHEKE_KLEIDI_THEMATOS, arxikoStorage);
    } else {
      localStorage.removeItem(APOTHEKE_KLEIDI_THEMATOS);
    }
  });

  it('η pare_trexon_thema επιστρέφει "midnight" ως προεπιλογή όταν δεν έχει οριστεί τίποτα', () => {
    expect(pare_trexon_thema()).toBe('midnight');
  });

  it('η thete_thema θέτει το data-theme στο <html> και αποθηκεύει στο localStorage', () => {
    thete_thema('unistudents');
    expect(document.documentElement.getAttribute('data-theme')).toBe('unistudents');
    expect(localStorage.getItem(APOTHEKE_KLEIDI_THEMATOS)).toBe('unistudents');
    expect(pare_trexon_thema()).toBe('unistudents');
  });

  it('η thete_thema για emerald ενημερώνει DOM και storage', () => {
    thete_thema('emerald');
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald');
    expect(localStorage.getItem(APOTHEKE_KLEIDI_THEMATOS)).toBe('emerald');
    expect(pare_trexon_thema()).toBe('emerald');
  });

  it('η thete_thema για light προσαρμόζει το ion-palette-dark και colorScheme', () => {
    thete_thema('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe('light');

    // Επιστροφή σε σκοτεινό θέμα
    thete_thema('midnight');
    expect(document.documentElement.getAttribute('data-theme')).toBe('midnight');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('η thete_thema πετάει εξαίρεση σε μη έγκυρο αναγνωριστικό θέματος', () => {
    expect(() => thete_thema('agnoosto' as unknown as ThemaId)).toThrow();
  });

  it('η arxikopoiisi_thematos διαβάζει από το localStorage και το εφαρμόζει στο DOM', () => {
    localStorage.setItem(APOTHEKE_KLEIDI_THEMATOS, 'emerald');
    const apotelesma = arxikopoiisi_thematos();
    expect(apotelesma).toBe('emerald');
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald');
  });
});

describe('themata.css - κανόνες και μεταβλητές CSS', () => {
  it('περιέχει κανόνες για όλα τα 4 θέματα μέσω [data-theme]', () => {
    for (const id of THEMATA_IDS) {
      expect(THEMATA_CSS).toContain(`[data-theme='${id}']`);
    }
  });

  it('ορίζει τις βασικές επιφάνειες και χρώματα για κάθε θέμα', () => {
    // midnight
    expect(THEMATA_CSS).toContain('#0B0B0C');
    expect(THEMATA_CSS).toContain('#161618');
    expect(THEMATA_CSS).toContain('#3B82F6');

    // unistudents
    expect(THEMATA_CSS).toContain('#0A1128');
    expect(THEMATA_CSS).toContain('#132247');
    expect(THEMATA_CSS).toContain('#2563EB');
    expect(THEMATA_CSS).toContain('#38BDF8');

    // emerald
    expect(THEMATA_CSS).toContain('#081C15');
    expect(THEMATA_CSS).toContain('#112F24');
    expect(THEMATA_CSS).toContain('#10B981');

    // light
    expect(THEMATA_CSS).toContain('#F8FAFC');
    expect(THEMATA_CSS).toContain('#FFFFFF');
    expect(THEMATA_CSS).toContain('#0F172A');
  });

  it('ορίζει τις μεταβλητές Ionic για συμβατότητα με το UI', () => {
    expect(THEMATA_CSS).toContain('--ion-background-color');
    expect(THEMATA_CSS).toContain('--ion-text-color');
    expect(THEMATA_CSS).toContain('--ion-color-primary');
    expect(THEMATA_CSS).toContain('--ion-toolbar-background');
  });
});

describe('navigasi.css - Responsive Mobile Frame για desktop', () => {
  it('περιέχει media query για desktop (>768px)', () => {
    expect(NAVIGASI_CSS).toMatch(/@media\s*\(\s*min-width:\s*769px\s*\)/);
  });

  it('εφαρμόζει πλαίσιο smartphone με max-width: 480px και ~94vh ύψος', () => {
    expect(NAVIGASI_CSS).toContain('max-width: 480px');
    expect(NAVIGASI_CSS).toContain('94vh');
    expect(NAVIGASI_CSS).toContain('border-radius: 36px');
  });

  it('εφαρμόζει διακριτικό σκούρο bezel και drop shadow 0 25px 60px rgba(0, 0, 0, 0.8)', () => {
    expect(NAVIGASI_CSS).toMatch(/border:\s*10px\s+solid\s+#16181d/);
    expect(NAVIGASI_CSS).toMatch(/box-shadow:\s*0\s+25px\s+60px\s+rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.8\s*\)/);
  });

  it('διαθέτει notch στο πάνω μέρος μέσω pseudo-element', () => {
    expect(NAVIGASI_CSS).toContain('ion-app::before');
    expect(NAVIGASI_CSS).toContain('border-radius: 20px');
  });
});
