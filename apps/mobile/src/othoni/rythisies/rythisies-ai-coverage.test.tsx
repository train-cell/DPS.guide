// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Apotelesma, LlmPyli, PliroforiaParoxou } from '@dps/core';
import { ok, apotyxia } from '@dps/core';
import { Capacitor } from '@capacitor/core';
import { ftiaxe_gemini_llm, ftiaxe_ollama_llm } from '@dps/ai';
import { ParoxosPeriballontos } from '../../periballon/provolos.js';
import type { Periballon } from '../../periballon/periballon.js';
import { ParoxeApothekisis } from '../../apothiki/aperixirto.js';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';
import { proedapes_rytheseis } from '../../apothiki/apothiki-typoi.js';
import { entopise_paroxo_montelou } from '../../ypiresies/ai-providers.js';
import type { ApothikiSyntheseon } from '../../apothiki/aperixirto.js';
import type { VaultSecurityControls } from '../../vault/vault-gate.js';
import RythisiesAi from './rythisies-ai.js';
import { useVaultSecurity } from '../../vault/vault-gate.js';
import { deliverEncryptedBackup } from '../../vault/backup-file.js';
import { xrisiApothekisis } from '../../apothiki/index.js';

/** Οι παρόχοι αλλάζουν ανάλογα με το δοκιμολόγιο. */
vi.mock('./rythisies-ai.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./rythisies-ai.js')>();
  return { ...actual, PAROXOI_LLM: paroxoi.list };
});

/** Το Gate επιστρέφει null όταν λείπει· ελέγχονται και οι δύο πλευρές. */
vi.mock('../../vault/vault-gate.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../vault/vault-gate.js')>();
  return { ...actual, useVaultSecurity: vi.fn() };
});

/** Η εξαγωγή backup μένει στην μνήμη. */
vi.mock('../../vault/backup-file.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../vault/backup-file.js')>();
  return { ...actual, deliverEncryptedBackup: vi.fn() };
});

/** Ο πάροχος αποθήκευσης ελέγχεται από τα tests. */
vi.mock('../../apothiki/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../apothiki/index.js')>();
  return { ...actual, xrisiApothekisis: vi.fn() };
});

/** Ο εντοπισμός παρόχου ελέγχεται ώστε να εμφανίζεται και ο άγνωστος κλάδος. */
vi.mock('../../ypiresies/ai-providers.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ypiresies/ai-providers.js')>();
  return { ...actual, entopise_paroxo_montelou: vi.fn() };
});

/** Οι κλήσεις LLM είναι ελεγχόμενες. */
vi.mock('@dps/ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dps/ai')>();
  return { ...actual, ftiaxe_gemini_llm: vi.fn(), ftiaxe_ollama_llm: vi.fn() };
});

/** Η isNativePlatform αλλάζει ανάλογα με την πλατφόρμα. */
vi.mock('@capacitor/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@capacitor/core')>();
  return { ...actual, isNativePlatform: vi.fn() };
});

const paroxoi = vi.hoisted(() => ({ list: [] as readonly PliroforiaParoxou[] }));
const vaultSecurityMock = vi.mocked(useVaultSecurity);
const deliverMock = vi.mocked(deliverEncryptedBackup);
const apothikiMock = vi.mocked(xrisiApothekisis);
const entopiseMock = vi.mocked(entopise_paroxo_montelou);
const ftiaxeGeminiMock = vi.mocked(ftiaxe_gemini_llm);
const ftiaxeOllamaMock = vi.mocked(ftiaxe_ollama_llm);
const isNativeMock = vi.mocked(Capacitor.isNativePlatform);

const KLEIDI_BACKUP = 'protestiko-kleidi-vault-123';

function ergaleio_vault(overrides: Partial<VaultSecurityControls> = {}): VaultSecurityControls {
  return {
    biometricEnabled: false,
    biometricAvailable: false,
    enableBiometrics: vi.fn(),
    disableBiometrics: vi.fn(),
    createEncryptedBackup: vi.fn().mockResolvedValue(new Blob(['test'])),
    restoreBackupFromFile: vi.fn().mockResolvedValue(undefined),
    lockVault: vi.fn(),
    ...overrides,
  };
}

let geminiApotelesma: Apotelesma<string> = ok('ping');

function kanonikes_timies(rytheseis: Record<string, unknown> = {}, onomaParoxou = 'gemini'): void {
  vaultSecurityMock.mockReturnValue(null);
  isNativeMock.mockReturnValue(false);
  entopiseMock.mockReturnValue(onomaParoxou);
  paroxoi.list = [
    {
      id: 'gemini',
      titlos: 'Google Gemini',
      perigrafi: 'Μοντέλα Google Gemini.',
      apaitisiKleidiou: true,
      montela: [{ id: 'gemini-3.8-flash', titlos: 'Gemini 3.8 Flash' }, { id: 'llama3.2', titlos: 'Llama 3.2' }],
      proepilegmenoMontelo: 'gemini-3.8-flash',
    },
    {
      id: 'ollama',
      titlos: 'Τοπικό Ollama',
      perigrafi: 'Τοπικό Ollama.',
      apaitisiKleidiou: false,
      montela: [{ id: 'llama3.2', titlos: 'Llama 3.2' }, { id: 'mistral', titlos: 'Mistral' }],
      proepilegmenoMontelo: 'llama3.2',
    },
  ];
  apothikiMock.mockReturnValue({
    rytheseis: { ...proedapes_rytheseis(), ...rytheseis },
    proodhos: { aristeiesEnotiton: [] },
    kodikosMathimatos: '',
    allaxe_telia: vi.fn(),
    allaxe_rytheseis: vi.fn(),
    allaxe_kodiko_mathimatos: vi.fn(),
  } as unknown as ApothikiSyntheseon);
  ftiaxeGeminiMock.mockImplementation(() => fakeLlm());
  ftiaxeOllamaMock.mockImplementation(() => fakeLlm());
}

function fakeLlm(): LlmPyli {
  return {
    montelo: 'gemini-3.8-flash',
    async parage_json<T>(): Promise<Apotelesma<T>> {
      return ok({} as T);
    },
    async parage_keimeno(): Promise<Apotelesma<string>> {
      return geminiApotelesma;
    },
  };
}

function apostrophe_rythisies(periballon: Periballon = ftiaxe_periballon_test()): { unmount: () => void } {
  return render(
    me_periballon_test(
      <MemoryRouter>
        <ParoxeApothekisis periballon={periballon}>
          <RythisiesAi />
        </ParoxeApothekisis>
      </MemoryRouter>
    )
  );
}

async function perimene_apotelesma(result: { unmount: () => void }): Promise<void> {
  await waitFor(
    () => expect(result.getByTestId('rythisies-ai-ekran')).not.toBeNull(),
    { timeout: 1000 }
  );
}

describe('RythisiesAi — κάλυψη κλάδων', () => {
  afterEach(() => {
    cleanup();
    kanonikes_timies();
    deliverMock.mockClear();
    geminiApotelesma = ok('ping');
  });

  it('αποδίδει την οθόνη με προεπιλογές χωρίς vault', async () => {
    kanonikes_timies();
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    expect(result.getByTestId('paroxos-gemini').getAttribute('aria-pressed')).toBe('true');
    expect(result.getByTestId('paroxos-ollama').getAttribute('aria-pressed')).toBe('false');
    expect(result.getByTestId('ai-dokimi-syndesis').textContent).toContain('Έλεγχος Σύνδεσης');
    result.unmount();
  });

  it('εντοπίζει το Ollama από τις ρυθμίσεις', async () => {
    kanonikes_timies({ onomaMontelou: 'llama3.2', paroxosLlm: 'ollama' });
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    expect(result.getByTestId('paroxos-ollama').getAttribute('aria-pressed')).toBe('true');
    expect(result.getByTestId('paroxos-gemini').getAttribute('aria-pressed')).toBe('false');
    expect(result.getByTestId('ai-ollama-model-id')).not.toBeNull();
    result.unmount();
  });

  it('απορρίπτει το Ollama όταν δεν είναι διαθέσιμο', async () => {
    isNativeMock.mockReturnValue(true);
    kanonikes_timies({ onomaMontelou: 'llama3.2', paroxosLlm: 'ollama' });
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    expect(result.getByTestId('paroxos-gemini').getAttribute('aria-pressed')).toBe('true');
    expect(result.getByTestId('ai-montelo-select')).not.toBeNull();
    result.unmount();
  });

  it('εντοπίζει άγνωστο πάροχο από τις ρυθμίσεις', async () => {
    entopiseMock.mockReturnValue('agnosto');
    kanonikes_timies();
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    expect(result.getByTestId('paroxos-gemini').getAttribute('aria-pressed')).toBe('false');
    expect(result.getByTestId('paroxos-ollama').getAttribute('aria-pressed')).toBe('false');
    result.unmount();
  });

  it('επεξεργάζεται ρυθμίσεις χωρίς ονομα μοντέλου και χωρίς url Ollama', async () => {
    kanonikes_timies({ onomaMontelou: null as unknown as string, urlOllama: null as unknown as string });
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    expect(result.getByTestId('ai-dokimi-syndesis')).not.toBeNull();
    result.unmount();
  });

  it('αλλάζει πάροχο με μοντέλο που ανήκει και με αυτό που δεν ανήκει', async () => {
    kanonikes_timies({ onomaMontelou: 'llama3.2', paroxosLlm: 'ollama' });
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    expect(result.getByTestId('montelo-llama3.2').getAttribute('aria-pressed')).toBe('true');
    // ήδη επιλεγμένος πάροχος· επιστροφή χωρίς αλλαγή
    fireEvent.click(result.getByTestId('paroxos-ollama'));
    expect(result.getByTestId('montelo-llama3.2').getAttribute('aria-pressed')).toBe('true');
    // εναλλαγή σε πάροχο χωρίς το επιλεγμένο μοντέλο
    fireEvent.click(result.getByTestId('paroxos-gemini'));
    expect(result.getByTestId('montelo-gemini-3.8-flash').getAttribute('aria-pressed')).toBe('true');
    // εναλλαγή σε πάροχο με το επιλεγμένο μοντέλο
    fireEvent.click(result.getByTestId('paroxos-ollama'));
    expect(result.getByTestId('montelo-llama3.2').getAttribute('aria-pressed')).toBe('true');
    result.unmount();
  });

  it('επιτυγχάνει σύνδεση με Gemini', async () => {
    const mystika = new (await import('@dps/core/testing')).FakeMystika();
    await mystika.vale('llm_api_key', 'test-kleidi');
    kanonikes_timies({ exeiKleidiLlm: true });
    const result = apostrophe_rythisies({ mystika });
    await perimene_apotelesma(result);
    expect(result.getByTestId('ai-diagrafi-kleidiou')).not.toBeNull();
    geminiApotelesma = ok('ping ok');
    fireEvent.click(result.getByTestId('ai-dokimi-syndesis'));
    await waitFor(
      () => expect(result.getByText('Επιτυχής σύνδεση με Google Gemini (gemini-3.8-flash)!')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('αποτυγχάνει η σύνδεση με Gemini', async () => {
    const mystika = new (await import('@dps/core/testing')).FakeMystika();
    await mystika.vale('llm_api_key', 'test-kleidi');
    kanonikes_timies({ exeiKleidiLlm: true });
    const result = apostrophe_rythisies({ mystika });
    await perimene_apotelesma(result);
    geminiApotelesma = apotyxia('AUTH_APOTYXIA', 'Δεν βρέθηκε κλειδί');
    fireEvent.click(result.getByTestId('ai-dokimi-syndesis'));
    await waitFor(
      () => expect(result.getByText('Αποτυχία σύνδεσης: Δεν βρέθηκε κλειδί')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('πετάει σφάλμα επικοινωνίας η κλήση', async () => {
    const mystika = new (await import('@dps/core/testing')).FakeMystika();
    await mystika.vale('llm_api_key', 'test-kleidi');
    kanonikes_timies({ exeiKleidiLlm: true });
    const result = apostrophe_rythisies({ mystika });
    await perimene_apotelesma(result);
    ftiaxeGeminiMock.mockImplementation(() => ({
      montelo: 'gemini-3.8-flash',
      async parage_keimeno(): Promise<Apotelesma<string>> {
        throw new Error('Δίκτυο');
      },
    }));
    geminiApotelesma = ok('ping');
    fireEvent.click(result.getByTestId('ai-dokimi-syndesis'));
    await waitFor(
      () => expect(result.getByText('Σφάλμα επικοινωνίας κατά τον έλεγχο σύνδεσης.')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('επιτυγχάνει σύνδεση με Ollama', async () => {
    kanonikes_timies({ onomaMontelou: 'llama3.2', paroxosLlm: 'ollama' });
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    ftiaxeOllamaMock.mockImplementation(() => ({
      montelo: 'llama3.2',
      async parage_keimeno(): Promise<Apotelesma<string>> {
        return ok('ping ok');
      },
    }));
    geminiApotelesma = ok('ping');
    fireEvent.click(result.getByTestId('ai-dokimi-syndesis'));
    await waitFor(
      () => expect(result.getByText('Επιτυχής σύνδεση με Τοπικό Ollama (llama3.2)!')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('καλύπτει τα σφάλματα πλήρωσης πριν την οριστική σύνδεση', async () => {
    kanonikes_timies({ onomaMontelou: 'llama3.2', paroxosLlm: 'ollama' });
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    geminiApotelesma = ok('ping');
    fireEvent.click(result.getByTestId('ai-dokimi-syndesis'));
    await waitFor(
      () => expect(result.getByText('Απαιτείται model ID από την εντολή ollama list.')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('καλύπτει την απουσία διεύθυνσης Ollama', async () => {
    kanonikes_timies({ onomaMontelou: 'llama3.2', paroxosLlm: 'ollama', urlOllama: '' });
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    const url = result.getByTestId('ai-ollama-url');
    fireEvent.change(url, { target: { value: '' } });
    fireEvent.click(result.getByTestId('ai-dokimi-syndesis'));
    await waitFor(
      () => expect(result.getByText('Απαιτείται διεύθυνση διακομιστή για το Ollama.')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('καλύπτει την απουσία API key για Gemini', async () => {
    kanonikes_timies();
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    fireEvent.click(result.getByTestId('ai-dokimi-syndesis'));
    await waitFor(
      () => expect(result.getByText('Απαιτείται API Key για τον επιλεγμένο πάροχο.')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('εμφανίζει τον διάλογο επιβεβαίωσης Gemini', async () => {
    kanonikes_timies();
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    const model = result.getByTestId('ai-montelo-select');
    fireEvent.change(model, { target: { value: 'gemini-3.8-flash' } });
    fireEvent.click(result.getByTestId('ai-dokimi-syndesis'));
    await waitFor(
      () => expect(result.getByText('Επιβεβαίωση δοκιμής Gemini')).not.toBeNull(),
      { timeout: 1000 }
    );
    expect(result.getByText('Μοντέλο: gemini-3.8-flash')).not.toBeNull();
    // ακύρωση
    fireEvent.click(result.getByText('Ακύρωση'));
    expect(result.queryByTestId('rythisies-ai-ekran')).not.toBeNull();
    result.unmount();
  });

  it('η επιβεβαίωση στέλνει το ping μέσω Gemini', async () => {
    kanonikes_timies();
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    geminiApotelesma = ok('ping ok');
    const model = result.getByTestId('ai-montelo-select');
    fireEvent.change(model, { target: { value: 'gemini-3.8-flash' } });
    fireEvent.click(result.getByTestId('ai-dokimi-syndesis'));
    await waitFor(
      () => expect(result.getByText('Επιβεβαίωση δοκιμής Gemini')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByText('Επιβεβαίωση και αποστολή ping'));
    await waitFor(
      () => expect(result.getByText('Επιτυχής σύνδεση με Google Gemini (gemini-3.8-flash)!')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('υποβάλλει τη φόρμα αποθήκευσης', async () => {
    kanonikes_timies();
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    fireEvent.submit(result.getByTestId('rythisies-ai-ekran'));
    await waitFor(() => expect(result.getByText('Αποθηκεύτηκε')).not.toBeNull(), { timeout: 1000 });
    result.unmount();
  });

  it('γράφει το νέο API key στο vault', async () => {
    const mystika = new (await import('@dps/core/testing')).FakeMystika();
    const periballon = ftiaxe_periballon_test({ mystika });
    const result = apostrophe_rythisies(periballon);
    await perimene_apotelesma(result);
    const key = result.getByTestId('ai-api-key');
    fireEvent.change(key, { target: { value: 'neo-kleidi-123' } });
    fireEvent.submit(result.getByTestId('rythisies-ai-ekran'));
    await waitFor(() => expect(result.getByText('Αποθηκεύτηκε')).not.toBeNull(), { timeout: 1000 });
    expect(await mystika.pare('llm_api_key')).toBe('neo-kleidi-123');
    result.unmount();
  });

  it('διαγράφει το κλειδί από το vault', async () => {
    const mystika = new (await import('@dps/core/testing')).FakeMystika();
    await mystika.vale('llm_api_key', 'test-kleidi');
    kanonikes_timies({ exeiKleidiLlm: true });
    const result = apostrophe_rythisies({ mystika });
    await perimene_apotelesma(result);
    expect(result.getByTestId('ai-diagrafi-kleidiou')).not.toBeNull();
    fireEvent.click(result.getByTestId('ai-diagrafi-kleidiou'));
    await waitFor(() => expect(result.getByText('Αποθηκεύτηκε')).not.toBeNull(), { timeout: 1000 });
    expect(await mystika.pare('llm_api_key')).toBe(null);
    result.unmount();
  });

  it('η εξαγωγή backup δεν είναι διαθέσιμη χωρίς vault', async () => {
    kanonikes_timies();
    vaultSecurityMock.mockReturnValue(null);
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    expect(result.getByTestId('vault-backup-export-password')).not.toBeNull();
    const input = result.getByTestId('vault-backup-export-password');
    fireEvent.change(input, { target: { value: KLEIDI_BACKUP } });
    fireEvent.click(result.getByText('Εξαγωγή encrypted backup'));
    await waitFor(
      () => expect(result.getByText('Δεν είναι διαθέσιμο το vault runtime.')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('καλύπτει την επιτυχία και τα σφάλματα του encrypted backup', async () => {
    kanonikes_timies();
    vaultSecurityMock.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    const input = result.getByTestId('vault-backup-export-password');
    fireEvent.change(input, { target: { value: KLEIDI_BACKUP } });
    fireEvent.click(result.getByText('Εξαγωγή encrypted backup'));
    await waitFor(() => expect(result.getByText('Το encrypted backup δημιουργήθηκε.')).not.toBeNull(), { timeout: 1000 });
    expect(deliverMock).toHaveBeenCalled();
    // σφάλμα Error και μη Error
    const fake = ergaleio_vault();
    fake.createEncryptedBackup.mockRejectedValue(new Error('Δεν γίνεται κρυπτογράφηση'));
    vaultSecurityMock.mockReturnValue(fake);
    fireEvent.click(result.getByText('Εξαγωγή encrypted backup'));
    await waitFor(() => expect(result.getByText('Δεν γίνεται κρυπτογράφηση')).not.toBeNull(), { timeout: 1000 });
    fake.createEncryptedBackup.mockRejectedValue('Όχι Error');
    fireEvent.click(result.getByText('Εξαγωγή encrypted backup'));
    await waitFor(
      () => expect(result.getByText('Δεν δημιουργήθηκε encrypted backup.')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('ενεργοποιεί και απενεργοποιεί τα βιομετρικά', async () => {
    kanonikes_timies();
    const fake = ergaleio_vault({ biometricAvailable: true });
    vaultSecurityMock.mockReturnValue(fake);
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    expect(result.getByText('Ενεργοποίηση βιομετρικών')).not.toBeNull();
    fireEvent.click(result.getByText('Ενεργοποίηση βιομετρικών'));
    await waitFor(() => expect(result.getByText('Τα βιομετρικά ενεργοποιήθηκαν.')).not.toBeNull(), { timeout: 1000 });
    const fake2 = ergaleio_vault({ biometricEnabled: true, biometricAvailable: false });
    vaultSecurityMock.mockReturnValue(fake2);
    fireEvent.click(result.getByText('Απενεργοποίηση βιομετρικών'));
    await waitFor(
      () => expect(result.getByText('Το βιομετρικό ξεκλείδωμα απενεργοποιήθηκε.')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('αποδίδει την οθόνη χωρίς vault και με ενεργοποιημένα βιομετρικά', async () => {
    kanonikes_timies();
    vaultSecurityMock.mockReturnValue(null);
    const result = apostrophe_rythisies();
    await perimene_apotelesma(result);
    expect(result.getByText('Διαθέσιμο στις native εφαρμογές')).not.toBeNull();
    result.unmount();
  });
});
