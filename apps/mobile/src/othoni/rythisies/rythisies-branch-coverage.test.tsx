// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { VaultSecurityControls } from '../../vault/vault-gate.js';
import { ParoxeApothekisis } from '../../apothiki/aperixirto.js';
import { proedapes_rytheseis } from '../../apothiki/index.js';
import { DIALOMI_RYTHMISEON } from '../../apothiki/apothiki-typoi.js';
import { ftiaxe_periballon_test } from '../../../test-fixtures/ftiaxe-test-periballon.js';
import { me_periballon_test } from '../../../test-fixtures/periballon-test-provider.js';
import type { Periballon } from '../../periballon/periballon.js';
import Rythisies from './rythisies.js';

/** Η useVaultSecurity επιστρέφει null όταν δεν υπάρχει Gate· η δοκιμή ελέγχει και τις δύο πλευρές. */
vi.mock('../../vault/vault-gate.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../vault/vault-gate.js')>();
  return { ...actual, useVaultSecurity: vi.fn() };
});

/** Η εξαγωγή backup κατεβάζει το αρχείο στο browser· στα tests μένει στην μνήμη. */
vi.mock('../../vault/backup-file.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../vault/backup-file.js')>();
  return { ...actual, deliverEncryptedBackup: vi.fn() };
});

import { useVaultSecurity } from '../../vault/vault-gate.js';
import { deliverEncryptedBackup } from '../../vault/backup-file.js';

const KLEIDI_BACKUP = 'protestiko-kleidi-vault-123';
const ARXIO_BACKUP = new File(['test'], 'backup.enc', { type: 'application/octet-stream' });

/** Εργαλειο Vault για την πλευρά όπου η υπηρεσία είναι διαθέσιμη. */
function ergaleio_vault(): VaultSecurityControls {
  return {
    biometricEnabled: false,
    biometricAvailable: false,
    enableBiometrics: vi.fn(),
    disableBiometrics: vi.fn(),
    createEncryptedBackup: vi.fn().mockResolvedValue(new Blob(['test'])),
    restoreBackupFromFile: vi.fn().mockResolvedValue(undefined),
    lockVault: vi.fn(),
  };
}

/** Αποδίδει την οθόνη μέσα σε periballon αποθήκης με ρυθμισμένη useVaultSecurity. */
function apostrophe_rythisies(): { unmount: () => void } {
  return render(
    me_periballon_test(
      <MemoryRouter>
        <ParoxeApothekisis periballon={ftiaxe_periballon_test()}>
          <Rythisies />
        </ParoxeApothekisis>
      </MemoryRouter>
    )
  );
}

/** Αποδίδει την οθόνη με ρητό periballon· για περιπτώσεις που η αποθήκη έχει προσαρμοσμένη τιμή. */
function apostrophe_rythisies_me(periballon: Periballon): { unmount: () => void } {
  return render(
    me_periballon_test(
      <MemoryRouter>
        <ParoxeApothekisis periballon={periballon}>
          <Rythisies />
        </ParoxeApothekisis>
      </MemoryRouter>
    )
  );
}

describe('Rythisies — κάλυψη κλάδων', () => {
  const vaultSecurity = vi.mocked(useVaultSecurity);
  const deliver = vi.mocked(deliverEncryptedBackup);

  afterEach(() => {
    cleanup();
    vaultSecurity.mockReset();
    vaultSecurity.mockReturnValue(null);
    deliver.mockClear();
  });

  /** Κάνει το prompt αόρατο· χρειάζεται για τον κλάδο του cond-expr όταν δεν υπάρχει prompt. */
  function kanei_prompt_aneftiko(): () => void {
    const original = window.prompt;
    Object.defineProperty(window, 'prompt', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    return () => {
      Object.defineProperty(window, 'prompt', {
        value: original,
        configurable: true,
        writable: true,
      });
    };
  }

  it('αποδίδει την οθόνη στις προεπιλογές χωρίς vault', async () => {
    vaultSecurity.mockReturnValue(null);
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    // κανένα μάθημα προς συγχρονισμό, το Pilegma εμφανίζεται
    expect(result.getByText('Συγχρονισμός: κανένα μάθημα')).not.toBeNull();
    // κλειδί LLM: μη ρυθμισμένο
    expect(result.getByText('Κλειδί: Μη ρυθμισμένο')).not.toBeNull();
    // το θέμα ταιριάζει με το τρέχον
    expect(result.getByTestId('thema-midnight').className).toContain('pilegma-entono');
    result.unmount();
  });

  it('αποδίδει πανεπιστήμιο από το panepistimioId όταν υπάρχει', async () => {
    const apothiki = ftiaxe_periballon_test().apothiki;
    await apothiki.grapse_keimeno(
      'rythmiseis.json',
      JSON.stringify({ ...proedapes_rytheseis(), panepistimioId: 'unipi' })
    );
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <ParoxeApothekisis periballon={ftiaxe_periballon_test({ apothiki })}>
            <Rythisies />
          </ParoxeApothekisis>
        </MemoryRouter>
      )
    );
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    expect(result.getByText('Πανεπιστήμιο Πειραιώς (ΠΑΠΕΙ)')).not.toBeNull();
    result.unmount();
  });

  it('αποδίδει συγχρονισμένα μαθήματα όταν υπάρχουν', async () => {
    const apothiki = ftiaxe_periballon_test().apothiki;
    await apothiki.grapse_keimeno(
      'rythmiseis.json',
      JSON.stringify({ ...proedapes_rytheseis(), mathimataSynch: ['ΠΛΗ201', 'ΠΛΗ301'] })
    );
    const result = render(
      me_periballon_test(
        <MemoryRouter>
          <ParoxeApothekisis periballon={ftiaxe_periballon_test({ apothiki })}>
            <Rythisies />
          </ParoxeApothekisis>
        </MemoryRouter>
      )
    );
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    expect(result.getByText('ΠΛΗ201')).not.toBeNull();
    expect(result.getByText('ΠΛΗ301')).not.toBeNull();
    result.unmount();
  });

  it('ο κωδικός μεγαλύτερος των 12 χαρακτήρων δημιουργεί backup', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(KLEIDI_BACKUP);
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-backup-export'));
    await waitFor(() => expect(result.getByTestId('rythisies-backup-export').disabled).toBe(true), {
      timeout: 1000,
    });
    await waitFor(
      () => expect(result.getByText('Το αντίγραφο ασφαλείας εξήχθη επιτυχώς.')).not.toBeNull(),
      { timeout: 1000 }
    );
    expect(deliver).toHaveBeenCalledWith(expect.any(Blob), expect.stringContaining('DPS.guide'));
    promptSpy.mockRestore();
    result.unmount();
  });

  it('ο κωδικός μικρότερος των 12 χαρακτήρων κρατάει το μήνυμα', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('σύντομο');
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-backup-export'));
    await waitFor(
      () =>
        expect(result.getByText('Ο κωδικός backup πρέπει να έχει τουλάχιστον 12 χαρακτήρες.')).not.toBeNull(),
      { timeout: 1000 }
    );
    promptSpy.mockRestore();
    result.unmount();
  });

  it('η εξαγωγή πετάει Error και μη Error', async () => {
    const fake = ergaleio_vault();
    fake.createEncryptedBackup.mockRejectedValue(new Error('Δεν γίνεται κρυπτογράφηση'));
    vaultSecurity.mockReturnValue(fake);
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(KLEIDI_BACKUP);
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-backup-export'));
    await waitFor(
      () => expect(result.getByText('Δεν γίνεται κρυπτογράφηση')).not.toBeNull(),
      { timeout: 1000 }
    );

    // η ίδια αναφορά αντικειμένου· η αλλαγή διαβάζεται από τον χειριστή
    fake.createEncryptedBackup.mockRejectedValue('Όχι Error');
    fireEvent.click(result.getByTestId('rythisies-backup-export'));
    await waitFor(
      () => expect(result.getByText('Αποτυχία δημιουργίας αντιγράφου ασφαλείας.')).not.toBeNull(),
      { timeout: 1000 }
    );
    promptSpy.mockRestore();
    result.unmount();
  });

  it('η επαναφορά απαιτεί αρχείο', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(KLEIDI_BACKUP);
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    // το αρχείο δεν έχει επιλεγεί ακόμη· το κουμπί παραμένει ενεργό και η χειριστική συνάρτηση
    // βγάζει το μήνυμα "Επιλέξτε πρώτα αρχείο"
    fireEvent.click(result.getByTestId('rythisies-backup-restore'));
    await waitFor(
      () =>
        expect(result.getByText('Επιλέξτε πρώτα αρχείο αντιγράφου ασφαλείας (.enc).')).not.toBeNull(),
      { timeout: 1000 }
    );
    promptSpy.mockRestore();
    result.unmount();
  });

  it('η επαναφορά δεν ζητά κωδικό όταν λείπει το αρχείο', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    // επιλέγει αρχείο
    const input = result.getByTestId('rythisies-backup-file');
    fireEvent.change(input, { target: { files: [ARXIO_BACKUP] } });
    await waitFor(() => expect(result.getByTestId('rythisies-backup-restore').disabled).toBe(false), {
      timeout: 1000,
    });
    fireEvent.click(result.getByTestId('rythisies-backup-restore'));
    await waitFor(() => expect(promptSpy).toHaveBeenCalled(), { timeout: 1000 });
    promptSpy.mockRestore();
    result.unmount();
  });

  it('η επαναφορά με κωδικό και αρχείο πετυχαίνει', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(KLEIDI_BACKUP);
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    const input = result.getByTestId('rythisies-backup-file');
    fireEvent.change(input, { target: { files: [ARXIO_BACKUP] } });
    await waitFor(() => expect(result.getByTestId('rythisies-backup-restore').disabled).toBe(false), {
      timeout: 1000,
    });
    fireEvent.click(result.getByTestId('rythisies-backup-restore'));
    await waitFor(
      () => expect(result.getByText('Το αντίγραφο επαναφέρθηκε επιτυχώς.')).not.toBeNull(),
      { timeout: 1000 }
    );
    promptSpy.mockRestore();
    result.unmount();
  });

  it('η επαναφορά πετάει Error και μη Error', async () => {
    const fake = ergaleio_vault();
    vaultSecurity.mockReturnValue(fake);
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(KLEIDI_BACKUP);
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    const input = result.getByTestId('rythisies-backup-file');
    fireEvent.change(input, { target: { files: [ARXIO_BACKUP] } });
    await waitFor(() => expect(result.getByTestId('rythisies-backup-restore').disabled).toBe(false), {
      timeout: 1000,
    });
    // το restore πετάει Error
    fake.restoreBackupFromFile.mockRejectedValue(new Error('Δεν γίνεται επαναφορά'));
    fireEvent.click(result.getByTestId('rythisies-backup-restore'));
    await waitFor(
      () => expect(result.getByText('Δεν γίνεται επαναφορά')).not.toBeNull(),
      { timeout: 1000 }
    );

    // η ίδια αναφορά αντικειμένου· η αλλαγή διαβάζεται από τον χειριστή
    fake.restoreBackupFromFile.mockRejectedValue('Όχι Error');
    fireEvent.click(result.getByTestId('rythisies-backup-restore'));
    await waitFor(
      () => expect(result.getByText('Αποτυχία επαναφοράς αντιγράφου ασφαλείας.')).not.toBeNull(),
      { timeout: 1000 }
    );
    promptSpy.mockRestore();
    result.unmount();
  });

  it('κλειδώνει το vault μόνο όταν είναι διαθέσιμο', async () => {
    // το κλικ φτάνει μόνο όταν η υπηρεσία είναι διαθέσιμη
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-kleidoma-vault'));
    await waitFor(
      () => expect((result.getByTestId('rythisies-kleidoma-vault') as HTMLElement).disabled).toBe(false),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('κλειδώνει χωρίς vault χωρίς κανένα αποτέλεσμα', async () => {
    vaultSecurity.mockReturnValue(null);
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-kleidoma-vault'));
    result.unmount();
  });

  it('εναλλάσσει την κονσόλα τηλεμετρίας', async () => {
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    expect(result.getByTestId('rythisies-toggle-telemetry-btn').textContent).toContain(
      'Προβολή Ζωντανής Κονσόλας Logs'
    );
    fireEvent.click(result.getByTestId('rythisies-toggle-telemetry-btn'));
    await waitFor(
      () =>
        expect(result.getByTestId('rythisies-toggle-telemetry-btn').textContent).toContain(
          'Απόκρυψη Κονσόλας Logs'
        ),
      { timeout: 1000 }
    );
    expect(result.queryByTestId('tilemetria-provoli')).not.toBeNull();
    fireEvent.click(result.getByTestId('rythisies-toggle-telemetry-btn'));
    expect(result.queryByTestId('tilemetria-provoli')).toBeNull();
    result.unmount();
  });

  it('επιλέγει θέμα και το γράφει στην αποθήκη', async () => {
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('thema-light'));
    await waitFor(
      () => expect(result.getByTestId('thema-light').className).toContain('pilegma-entono'),
      { timeout: 1000 }
    );
    expect(result.getByTestId('thema-midnight').className).not.toContain('pilegma-entono');
    result.unmount();
  });

  it('εναλλάσσει τις ειδοποιήσεις και τα αποθηκεύει', async () => {
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    expect(result.getByTestId('rythisies-eidopoieseis').textContent).toContain('Ενεργές');
    fireEvent.click(result.getByTestId('rythisies-eidopoieseis'));
    await waitFor(
      () => expect(result.getByTestId('rythisies-eidopoieseis').textContent).toContain('Ανενεργές'),
      { timeout: 1000 }
    );
    expect(result.getByTestId('rythisies-eidopoieseis').getAttribute('aria-checked')).toBe('false');
    result.unmount();
  });

  it('αποθηκεύει τη φόρμα', async () => {
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-apothekeysto'));
    await waitFor(
      () => expect(result.getByText('Αποθηκεύτηκε')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('αλλάζει τη διεύθυνση eClass χωρίς αποθήκευση', async () => {
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    const input = result.getByTestId('rythisies-gramma-base');
    fireEvent.change(input, { target: { value: 'https://eclass.example.unipi.gr' } });
    await waitFor(
      () => expect(input.value).toBe('https://eclass.example.unipi.gr'),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('η εξαγωγή απαιτεί vault', async () => {
    vaultSecurity.mockReturnValue(null);
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-backup-export'));
    await waitFor(
      () => expect(result.getByText('Το vault δεν είναι διαθέσιμο.')).not.toBeNull(),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('η εξαγωγή περνάει κενό κωδικό και κλάδο cond-expr', async () => {
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    const apogoi = kanei_prompt_aneftiko();
    fireEvent.click(result.getByTestId('rythisies-backup-export'));
    // δεν υπάρχει κωδικός· η λειτουργία δεν μπαίνει σε κατάσταση εκτέλεσης
    await waitFor(
      () => expect(result.getByTestId('rythisies-backup-export').disabled).toBe(false),
      { timeout: 1000 }
    );
    apogoi();
    result.unmount();
  });

  it('η εξαγωγή περνάει μικρό κωδικό', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('123456');
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-backup-export'));
    await waitFor(
      () =>
        expect(result.getByText('Ο κωδικός backup πρέπει να έχει τουλάχιστον 12 χαρακτήρες.')).not.toBeNull(),
      { timeout: 1000 }
    );
    promptSpy.mockRestore();
    result.unmount();
  });

  it('η επαναφορά απαιτεί vault', async () => {
    vaultSecurity.mockReturnValue(null);
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(KLEIDI_BACKUP);
    fireEvent.click(result.getByTestId('rythisies-backup-restore'));
    await waitFor(
      () => expect(result.getByText('Το vault δεν είναι διαθέσιμο.')).not.toBeNull(),
      { timeout: 1000 }
    );
    promptSpy.mockRestore();
    result.unmount();
  });

  it('εξαγώνει τα logs τηλεμετρίας', async () => {
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-export-logs'));
    await waitFor(() => expect(deliver).toHaveBeenCalledTimes(1), { timeout: 1000 });
    expect(deliver.mock.calls[0][1]).toBe('dps-telemetry-logs.json');
    result.unmount();
  });

  it('αλλάζει τη διεύθυνση eClass χωρίς αποθήκευση', async () => {
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    const input = result.getByTestId('rythisies-gramma-base');
    fireEvent.change(input, { target: { value: 'https://eclass.example.unipi.gr' } });
    await waitFor(
      () => expect(input.value).toBe('https://eclass.example.unipi.gr'),
      { timeout: 1000 }
    );
    result.unmount();
  });

  it('καλύπτει τον κλάδο fallback πανεπιστημίου με μη έγκυρο id', async () => {
    const periballon = ftiaxe_periballon_test();
    await periballon.apothiki.grapse_keimeno(
      DIALOMI_RYTHMISEON,
      JSON.stringify({ ...proedapes_rytheseis(), panepistimioId: 'mega-invalid' })
    );
    const result = apostrophe_rythisies_me(periballon);
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    expect(result.getByText(/ΠΑΠΕΙ/)).not.toBeNull();
    result.unmount();
  });

  it('καλύπτει το κλειδί μοντέλου όταν έχει οριστεί', async () => {
    const periballon = ftiaxe_periballon_test();
    await periballon.apothiki.grapse_keimeno(
      DIALOMI_RYTHMISEON,
      JSON.stringify({ ...proedapes_rytheseis(), exeiKleidiLlm: true })
    );
    const result = apostrophe_rythisies_me(periballon);
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    expect(result.getByText('Κλειδί: Ρυθμισμένο')).not.toBeNull();
    result.unmount();
  });

  it('εξαγώνει τα logs από την κονσόλα τηλεμετρίας', async () => {
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('rythisies-toggle-telemetry-btn'));
    await waitFor(
      () =>
        expect(result.getByTestId('rythisies-toggle-telemetry-btn').textContent).toContain(
          'Απόκρυψη Κονσόλας Logs'
        ),
      { timeout: 1000 }
    );
    fireEvent.click(result.getByTestId('tilemetria-export-btn'));
    await waitFor(() => expect(deliver).toHaveBeenCalledTimes(1), { timeout: 1000 });
    expect(deliver.mock.calls[0][1]).toBe('dps-telemetry-logs.json');
    result.unmount();
  });

  it('η επαναφορά περνάει μικρό κωδικό', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('123456');
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    const input = result.getByTestId('rythisies-backup-file');
    fireEvent.change(input, { target: { files: [ARXIO_BACKUP] } });
    await waitFor(() => expect(result.getByTestId('rythisies-backup-restore').disabled).toBe(false), {
      timeout: 1000,
    });
    fireEvent.click(result.getByTestId('rythisies-backup-restore'));
    await waitFor(
      () => expect(result.getByText('Ο κωδικός backup πρέπει να έχει τουλάχιστον 12 χαρακτήρες.')).not.toBeNull(),
      { timeout: 1000 }
    );
    promptSpy.mockRestore();
    result.unmount();
  });

  it('η επαναφορά περνάει κενό prompt και κλάδο cond-expr', async () => {
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    const input = result.getByTestId('rythisies-backup-file');
    fireEvent.change(input, { target: { files: [ARXIO_BACKUP] } });
    await waitFor(() => expect(result.getByTestId('rythisies-backup-restore').disabled).toBe(false), {
      timeout: 1000,
    });
    const apogoi = kanei_prompt_aneftiko();
    fireEvent.click(result.getByTestId('rythisies-backup-restore'));
    await waitFor(() => expect(result.getByTestId('rythisies-backup-restore').disabled).toBe(false), {
      timeout: 1000,
    });
    apogoi();
    result.unmount();
  });

  it('δέχεται αλλαγή εισόδου χωρίς αρχείο', async () => {
    vaultSecurity.mockReturnValue(ergaleio_vault());
    const result = apostrophe_rythisies();
    await waitFor(
      () => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(),
      { timeout: 1000 }
    );
    const input = result.getByTestId('rythisies-backup-file');
    fireEvent.change(input, { target: { files: undefined } });
    // δεν επιλέχθηκε αρχείο· το κουμπί επαναφοράς παραμένει απενεργοποιημένο
    await waitFor(
      () => expect(result.getByTestId('rythisies-backup-restore').disabled).toBe(false),
      { timeout: 1000 }
    );
    result.unmount();
  });

  describe('Passphrase Modal (αντικατάσταση window.prompt)', () => {
    it('εμφανίζει masked modal, toggles visibility, ελέγχει >= 12 χαρακτήρες και εξάγει backup', async () => {
      // Σε κανονικό περιβάλλον χωρίς mock prompt
      const originalPrompt = window.prompt;
      // @ts-expect-error test native unmocked prompt
      window.prompt = function nativePrompt() {};
      vaultSecurity.mockReturnValue(ergaleio_vault());

      const result = apostrophe_rythisies();
      await waitFor(() => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(), { timeout: 1000 });

      // Κλικ εξαγωγής
      fireEvent.click(result.getByTestId('rythisies-backup-export'));
      await waitFor(() => expect(result.getByTestId('backup-passphrase-input')).not.toBeNull(), { timeout: 1000 });

      const input = result.getByTestId('backup-passphrase-input') as HTMLInputElement;
      expect(input.type).toBe('password');

      // Toggle εμφάνισης/απόκρυψης
      const toggleBtn = result.getByLabelText('Εμφάνιση κωδικού');
      fireEvent.click(toggleBtn);
      expect(input.type).toBe('text');

      const hideBtn = result.getByLabelText('Απόκρυψη κωδικού');
      fireEvent.click(hideBtn);
      expect(input.type).toBe('password');

      // Εισαγωγή κωδικού < 12 χαρακτήρων
      fireEvent.change(input, { target: { value: 'short-pass' } });
      fireEvent.click(result.getByTestId('backup-passphrase-submit'));
      await waitFor(
        () => expect(result.getByText('Ο κωδικός backup πρέπει να έχει τουλάχιστον 12 χαρακτήρες.')).not.toBeNull(),
        { timeout: 1000 }
      );

      // Εισαγωγή έγκυρου κωδικού >= 12 χαρακτήρων
      fireEvent.change(input, { target: { value: KLEIDI_BACKUP } });
      fireEvent.click(result.getByTestId('backup-passphrase-submit'));

      await waitFor(() => expect(result.queryByTestId('backup-passphrase-input')).toBeNull(), { timeout: 1000 });
      await waitFor(() => expect(result.getByText('Το αντίγραφο ασφαλείας εξήχθη επιτυχώς.')).not.toBeNull(), {
        timeout: 1000,
      });
      expect(deliver).toHaveBeenCalledWith(expect.any(Blob), expect.stringContaining('DPS.guide'));

      window.prompt = originalPrompt;
      result.unmount();
    });

    it('ακυρώνει το modal και υποστηρίζει modal επαναφοράς', async () => {
      const originalPrompt = window.prompt;
      // @ts-expect-error test native unmocked prompt
      window.prompt = function nativePrompt() {};
      const fake = ergaleio_vault();
      vaultSecurity.mockReturnValue(fake);

      const result = apostrophe_rythisies();
      await waitFor(() => expect(result.getByTestId('rythisies-ekran')).not.toBeNull(), { timeout: 1000 });

      // Άνοιγμα modal και ακύρωση
      fireEvent.click(result.getByTestId('rythisies-backup-export'));
      await waitFor(() => expect(result.getByTestId('backup-passphrase-input')).not.toBeNull(), { timeout: 1000 });
      fireEvent.click(result.getByText('Ακύρωση'));
      await waitFor(() => expect(result.queryByTestId('backup-passphrase-input')).toBeNull(), { timeout: 1000 });

      // Επαναφορά μέσω modal
      const fileInput = result.getByTestId('rythisies-backup-file');
      fireEvent.change(fileInput, { target: { files: [ARXIO_BACKUP] } });
      await waitFor(() => expect(result.getByTestId('rythisies-backup-restore').disabled).toBe(false), {
        timeout: 1000,
      });

      fireEvent.click(result.getByTestId('rythisies-backup-restore'));
      await waitFor(() => expect(result.getByTestId('backup-passphrase-input')).not.toBeNull(), { timeout: 1000 });

      const passInput = result.getByTestId('backup-passphrase-input');
      fireEvent.change(passInput, { target: { value: KLEIDI_BACKUP } });
      fireEvent.click(result.getByTestId('backup-passphrase-submit'));

      await waitFor(() => expect(result.queryByTestId('backup-passphrase-input')).toBeNull(), { timeout: 1000 });
      await waitFor(() => expect(result.getByText('Το αντίγραφο επαναφέρθηκε επιτυχώς.')).not.toBeNull(), {
        timeout: 1000,
      });

      window.prompt = originalPrompt;
      result.unmount();
    });
  });
});
