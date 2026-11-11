// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ApothikiPyli, MystikaPyli } from '@dps/core';

/** Πλαστικές συναρτήσεις του `./vault.js` (το crypto είναι βαρύ για μονάδες). */
const fakeVault = vi.hoisted(() => ({
  vaultExists: vi.fn(),
  createVault: vi.fn(),
  unlockVault: vi.fn(),
  restoreEncryptedBackup: vi.fn(),
  exportBiometricUnlockKey: vi.fn(),
  unlockWithBiometricKey: vi.fn(),
  createEncryptedBackup: vi.fn(),
}));

/** Πλαστική συσκευή: αποθήκη + μυστικά, χωρίς IndexedDB / Capacitor. */
function fakeDevice(): DeviceStorage {
  const apothiki = {
    grapse_keimeno: vi.fn(),
    diavase_keimeno: vi.fn(),
    grapse_dyadiko: vi.fn(),
    diavase_dyadiko: vi.fn(),
    yparxei: vi.fn(),
    lista: vi.fn(),
    diagrafi: vi.fn(),
  } as unknown as ApothikiPyli;
  const mystika = {
    pare: vi.fn(),
    vale: vi.fn(),
    svise: vi.fn(),
  } as unknown as MystikaPyli;
  return { apothiki, mystika, native: false };
}

const device = fakeDevice();
const periballon = vi.hoisted(() => ({ call: vi.fn(() => ({ deigma: true })) }));

vi.mock('./vault.js', () => ({
  vaultExists: fakeVault.vaultExists,
  createVault: fakeVault.createVault,
  unlockVault: fakeVault.unlockVault,
  restoreEncryptedBackup: fakeVault.restoreEncryptedBackup,
  exportBiometricUnlockKey: fakeVault.exportBiometricUnlockKey,
  unlockWithBiometricKey: fakeVault.unlockWithBiometricKey,
  createEncryptedBackup: fakeVault.createEncryptedBackup,
}));

vi.mock('./runtime.js', () => ({
  createDeviceStorage: () => device,
  createProductionPeriballon: periballon.call,
}));

import type { DeviceStorage } from './runtime.js';
import type { VaultSession } from './vault.js';
import type { VaultSecurityControls } from './vault-gate.js';
import { VaultGate, useVaultSecurity } from './vault-gate.js';

/** Πλαστικό βιομετρικό: διαθέσιμο και επιτυχές εξ ορισμού. */
const biometric = vi.hoisted(() => ({
  checkBiometry: vi.fn(() => Promise.resolve({ isAvailable: true })),
  authenticate: vi.fn(() => Promise.resolve({})),
}));
vi.mock('@aparajita/capacitor-biometric-auth', () => ({
  BiometricAuth: biometric,
  AndroidBiometryStrength: { weak: 'weak' },
}));

/** Παιδί που διαβάζει το context — μόνο από εκεί περνάει το restoreBackupFromFile. */
function RestoreChild({ onDone }: { onDone: () => void }) {
  const controls = useVaultSecurity() as VaultSecurityControls | null;
  void (async () => {
    if (controls === null) return;
    try {
      await controls.restoreBackupFromFile(new File(['backup'], 'b.dpsbackup'), 'backup-password-12345678');
    } catch {
      onDone();
    }
    onDone();
  })();
  return <div data-testid="restore-child" />;
}

/** Παιδί που εκτελεί μια ενέργεια μέσω του context. */
function SecurityChild({ action }: { action: (controls: VaultSecurityControls) => Promise<void> }) {
  const controls = useVaultSecurity() as VaultSecurityControls | null;
  void (async () => {
    if (controls === null) return;
    await action(controls);
  })();
  return <div data-testid="security-child" />;
}

/** Φτιάχνει session που θα κάνει το component έτοιμο ('ready'). */

/** Κάνει το component έτοιμο (μοντέλο 'setup' ή 'unlock'). */
async function mount(mode: 'setup' | 'unlock'): Promise<void> {
  fakeVault.vaultExists.mockResolvedValue(mode === 'unlock');
  render(<VaultGate>παιδί</VaultGate>);
  await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
  await new Promise((r) => setTimeout(r, 0));
}

/** Κάνει το component έτοιμο και επιστρέφει session. */
async function unlockSession(): Promise<VaultSession> {
  const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
  fakeVault.vaultExists.mockResolvedValue(true);
  fakeVault.unlockVault.mockResolvedValue(session);
  render(<VaultGate>παιδί</VaultGate>);
  await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
  return session;
}

describe('vault-gate.tsx — τοπικό vault', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    device.native = false;
    fakeVault.vaultExists.mockResolvedValue(false);
    fakeVault.createVault.mockRejectedValue(new Error('Πιθανό σφάλμα'));
    fakeVault.unlockVault.mockRejectedValue(new Error('Λάθος κωδικός'));
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    biometric.authenticate.mockResolvedValue({});
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('είναι έτοιμο όταν δεν υπάρχει vault', async () => {
    await mount('setup');
    expect(screen.getByText('Δημιουργία κρυπτογραφημένου vault')).toBeTruthy();
    expect(screen.queryByText('Ξεκλείδωμα')).toBeNull();
  });

  it('είναι έτοιμο όταν υπάρχει vault', async () => {
    await mount('unlock');
    expect(screen.getByText('Ξεκλείδωμα')).toBeTruthy();
    expect(screen.queryByText('Δημιουργία κρυπτογραφημένου vault')).toBeNull();
  });

  it('περιμένει τον έλεγχο της συσκευής', async () => {
    fakeVault.vaultExists.mockResolvedValue(false);
    const utils = render(<VaultGate>παιδί</VaultGate>);
    expect(screen.getByText('Έλεγχος τοπικής αποθήκευσης…')).toBeTruthy();
    expect(utils.container.querySelector('form')).toBeNull();
    await waitFor(() => expect(screen.getByText('Δημιουργία κρυπτογραφημένου vault')).toBeTruthy());
  });

  it('δέρνει σφάλμα όταν αποτυγχάνει ο έλεγχος της συσκευής', async () => {
    fakeVault.vaultExists.mockRejectedValue(new Error('Δεν ήταν δυνατός ο έλεγχος της συσκευής.'));
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Δεν ήταν δυνατός ο έλεγχος της συσκευής.');
    expect(screen.getByText('Δημιουργία κρυπτογραφημένου vault')).toBeTruthy();
  });

  it('δέρνει σφάλμα όταν ο έλεγχος πετάει συμβολοσειρά', async () => {
    fakeVault.vaultExists.mockRejectedValue('όχι σφάλμα');
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Δεν ήταν δυνατός ο έλεγχος της συσκευής.');
  });

  it('δεν ελέγχει βιομετρικά όταν δεν είναι native', async () => {
    await mount('setup');
    expect(biometric.checkBiometry).not.toHaveBeenCalled();
    expect(screen.queryByText('Γρήγορο ξεκλείδωμα με βιομετρικά')).toBeNull();
  });

  it('ελέγχει βιομετρικά όταν είναι native', async () => {
    device.native = true;
    fakeVault.vaultExists.mockResolvedValue(false);
    const utils = render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    await new Promise((r) => setTimeout(r, 0));
    expect(biometric.checkBiometry).toHaveBeenCalledOnce();
    expect(biometric.authenticate).not.toHaveBeenCalled();
  });

  it('δέρνει τα βιομετρικά ως μη διαθέσιμα', async () => {
    device.native = true;
    biometric.checkBiometry.mockRejectedValue(new Error('δεν υπάρχει'));
    fakeVault.vaultExists.mockResolvedValue(false);
    const utils = render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    await new Promise((r) => setTimeout(r, 0));
    expect(utils.container.querySelector('[type="password"]')).not.toBeNull();
  });

  it('δέρνει βιομετρικά διαθέσιμα με κλειδί', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    device.mystika.pare.mockResolvedValue('biometric-key');
    fakeVault.vaultExists.mockResolvedValue(false);
    const utils = render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    await new Promise((r) => setTimeout(r, 0));
    expect(utils.container.querySelector('[type="password"]')).not.toBeNull();
  });

  it('δημιουργεί vault όταν ταιριάζουν οι κωδικοί', async () => {
    await mount('setup');
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.createVault.mockResolvedValue({ session, recoveryKey: 'RECOVERY-KEY' });

    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));

    await waitFor(() => expect(fakeVault.createVault).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByText('Το αποθήκευσα — άνοιγμα εφαρμογής')).toBeTruthy());
    expect(screen.getByText('RECOVERY-KEY')).toBeTruthy();
    expect(fakeVault.createVault).toHaveBeenCalledWith(device.apothiki, 'kwdikos-test-12345678');
  });

  it('δέρνει σφάλμα όταν διαφέρουν οι κωδικοί', async () => {
    await mount('setup');
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'allios' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Οι δύο κύριοι κωδικοί δεν ταιριάζουν.');
    expect(fakeVault.createVault).not.toHaveBeenCalled();
  });

  it('δέρνει σφάλμα όταν πετάει η δημιουργία του vault', async () => {
    await mount('setup');
    fakeVault.createVault.mockRejectedValue(new Error('δεν γράφει'));
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('δεν γράφει');
    expect(fakeVault.createVault).toHaveBeenCalledOnce();
  });

  it('δέρνει σφάλμα όταν η δημιουργία πετάει συμβολοσειρά', async () => {
    await mount('setup');
    fakeVault.createVault.mockRejectedValue('δεν γράφει');
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Δεν ήταν δυνατή η δημιουργία του vault.');
  });

  it('κλειδώνει και ξεκλειδώνει με τον κύριο κωδικό', async () => {
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός ή recovery key'), { target: { value: 'main-password-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Ξεκλείδωμα' }));
    await waitFor(() => expect(fakeVault.unlockVault).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(screen.queryByText('Ξεκλείδωμα')).toBeNull();
  });

  it('δέρνει σφάλμα όταν πετάει το ξεκλείδωμα', async () => {
    await mount('unlock');
    fakeVault.unlockVault.mockRejectedValue(new Error('δεν ξεκλειδώνει'));
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός ή recovery key'), { target: { value: 'main-password-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Ξεκλείδωμα' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('δεν ξεκλειδώνει');
  });

  it('δέρνει σφάλμα όταν το ξεκλείδωμα πετάει συμβολοσειρά', async () => {
    await mount('unlock');
    fakeVault.unlockVault.mockRejectedValue('δεν ξεκλειδώνει');
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός ή recovery key'), { target: { value: 'main-password-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Ξεκλείδωμα' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Δεν ήταν δυνατό το ξεκλείδωμα.');
  });

  it('επαναφέρει backup με αρχείο και κωδικό', async () => {
    await mount('setup');
    const file = new File(['backup'], 'backup.dpsbackup', { type: 'application/vnd.dps-guide.backup' });
    fireEvent.change(screen.getByLabelText('Αρχείο DPS.guide backup'), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText('Κωδικός backup'), { target: { value: 'backup-password-12345678' } });
    fakeVault.restoreEncryptedBackup.mockResolvedValue(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Επαναφορά και ξεκλείδωμα' }));
    await waitFor(() => expect(fakeVault.restoreEncryptedBackup).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Το backup επαναφέρθηκε. Ξεκλείδωσε με τον master password ή το recovery key του backup.');
  });

  it('δέρνει σφάλμα όταν πετάει η επαναφορά του backup', async () => {
    await mount('setup');
    const file = new File(['backup'], 'backup.dpsbackup', { type: 'application/vnd.dps-guide.backup' });
    fireEvent.change(screen.getByLabelText('Αρχείο DPS.guide backup'), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText('Κωδικός backup'), { target: { value: 'backup-password-12345678' } });
    fakeVault.restoreEncryptedBackup.mockRejectedValue(new Error('δεν επαναφέρει'));
    fireEvent.click(screen.getByRole('button', { name: 'Επαναφορά και ξεκλείδωμα' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('δεν επαναφέρει');
  });

  it('δέρνει σφάλμα όταν η επαναφορά πετάει συμβολοσειρά', async () => {
    await mount('setup');
    const file = new File(['backup'], 'backup.dpsbackup', { type: 'application/vnd.dps-guide.backup' });
    fireEvent.change(screen.getByLabelText('Αρχείο DPS.guide backup'), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText('Κωδικός backup'), { target: { value: 'backup-password-12345678' } });
    fakeVault.restoreEncryptedBackup.mockRejectedValue('δεν επαναφέρει');
    fireEvent.click(screen.getByRole('button', { name: 'Επαναφορά και ξεκλείδωμα' }));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Δεν ήταν δυνατή η επαναφορά του backup.');
  });

  it('αφαιρεί τα βιομετρικά όταν είναι native', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    device.mystika.pare.mockResolvedValue('biometric-key');
    fakeVault.vaultExists.mockResolvedValue(true);
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.unlockVault.mockResolvedValue(session);
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText('Απενεργοποίηση βιομετρικού ξεκλειδώματος')).toBeTruthy();
    fireEvent.click(screen.getByText('Απενεργοποίηση βιομετρικού ξεκλειδώματος'));
    await waitFor(() => expect(device.mystika.svise).toHaveBeenCalledOnce());
  });

  it('ενεργοποιεί βιομετρικά στην ανάκτηση', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    device.mystika.vale.mockResolvedValue(undefined);
    fakeVault.vaultExists.mockResolvedValue(false);
    fakeVault.createVault.mockResolvedValue({ session: { storage: device.apothiki, dataKey: {} as never } as VaultSession, recoveryKey: 'RECOVERY-KEY' });
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));
    await waitFor(() => expect(screen.getByText('Το αποθήκευσα — άνοιγμα εφαρμογής')).toBeTruthy());
    // Το κουμπί βιομετρικών εμφανίζεται μόνο με native συσκευή.
    expect(screen.queryByText('Προαιρετικό γρήγορο ξεκλείδωμα με Face ID / δακτυλικό αποτύπωμα')).toBeNull();
  });

  it('ενεργοποιεί βιομετρικά στη συσκευή με βιομετρικά', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    device.mystika.pare.mockResolvedValue(null);
    fakeVault.vaultExists.mockResolvedValue(false);
    fakeVault.createVault.mockResolvedValue({ session: { storage: device.apothiki, dataKey: {} as never } as VaultSession, recoveryKey: 'RECOVERY-KEY' });
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));
    await waitFor(() => expect(screen.getByText('Το αποθήκευσα — άνοιγμα εφαρμογής')).toBeTruthy());
    expect(screen.getByText('Προαιρετικό γρήγορο ξεκλείδωμα με Face ID / δακτυλικό αποτύπωμα')).toBeTruthy();
    fireEvent.click(screen.getByText('Προαιρετικό γρήγορο ξεκλείδωμα με Face ID / δακτυλικό αποτύπωμα'));
    await waitFor(() => expect(biometric.authenticate).toHaveBeenCalledOnce());
    await waitFor(() => expect(device.mystika.vale).toHaveBeenCalledOnce());
  });

  it('ενεργοποιεί βιομετρικά με κλειδί session', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    device.mystika.vale.mockResolvedValue(undefined);
    fakeVault.exportBiometricUnlockKey.mockResolvedValue('encoded-key');
    fakeVault.vaultExists.mockResolvedValue(false);
    fakeVault.createVault.mockResolvedValue({ session: { storage: device.apothiki, dataKey: {} as never } as VaultSession, recoveryKey: 'RECOVERY-KEY' });
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));
    await waitFor(() => expect(screen.getByText('Το αποθήκευσα — άνοιγμα εφαρμογής')).toBeTruthy());
    fireEvent.click(screen.getByText('Το αποθήκευσα — άνοιγμα εφαρμογής'));
    await waitFor(() => expect(periballon.call).toHaveBeenCalledOnce());
    expect(screen.queryByText('Το αποθήκευσα — άνοιγμα εφαρμογής')).toBeNull();
  });

  it('κλειδώνει όταν η εφαρμογή πάει στο παρασκήνιο', async () => {
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 0));
    expect(utils.container.querySelector('form')).not.toBeNull();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('δεν κλειδώνει όταν δεν υπάρχει ανοιχτό vault', async () => {
    fakeVault.vaultExists.mockResolvedValue(false);
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.getByText('Δημιουργία κρυπτογραφημένου vault')).toBeTruthy());
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByText('Δημιουργία κρυπτογραφημένου vault')).toBeTruthy();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('χρησιμοποιεί το context για επαναφορά από αρχείο', async () => {
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    device.apothiki.lista.mockResolvedValue({ ok: true, timi: ['.dps-vault/header.json'] });
    fakeVault.restoreEncryptedBackup.mockResolvedValue(undefined);
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(
      <VaultGate>
        <RestoreChild onDone={() => {}} />
      </VaultGate>,
    );
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    fireEvent.submit(utils.container.querySelector('form')!);
    await waitFor(() => expect(utils.container.querySelector('[data-testid="restore-child"]')).not.toBeNull());
    await waitFor(() => expect(fakeVault.restoreEncryptedBackup).toHaveBeenCalledOnce());
    expect(device.apothiki.diagrafi).toHaveBeenCalledWith('.dps-vault/header.json');
  });

  it('δέρνει σφάλμα στο context restore', async () => {
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    device.apothiki.lista.mockRejectedValue(new Error('δεν διαβάζει'));
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(
      <VaultGate>
        <RestoreChild onDone={() => {}} />
      </VaultGate>,
    );
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    fireEvent.submit(utils.container.querySelector('form')!);
    await waitFor(() => expect(utils.container.querySelector('[data-testid="restore-child"]')).not.toBeNull());
  });

  it('δέρνει το context όταν η αποθήκη δεν έχει αρχεία', async () => {
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    device.apothiki.lista.mockResolvedValue({ ok: false, sfalma: {} as never });
    fakeVault.restoreEncryptedBackup.mockResolvedValue(undefined);
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(
      <VaultGate>
        <RestoreChild onDone={() => {}} />
      </VaultGate>,
    );
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    fireEvent.submit(utils.container.querySelector('form')!);
    await waitFor(() => expect(utils.container.querySelector('[data-testid="restore-child"]')).not.toBeNull());
  });

  it('δέρνει βιομετρικά με κλειδί αν και η συσκευή δεν είναι native', async () => {
    device.native = false;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(
      <VaultGate>
        <SecurityChild action={async (controls) => {
          await expect(controls.enableBiometrics()).rejects.toThrow('native vault');
        }} />
      </VaultGate>,
    );
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    fireEvent.submit(utils.container.querySelector('form')!);
    await waitFor(() => expect(utils.container.querySelector('[data-testid="security-child"]')).not.toBeNull());
  });

  it('δέρνει βιομετρικά χωρίς συσκευή', async () => {
    device.native = false;
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(
      <VaultGate>
        <SecurityChild action={async (controls) => {
          await controls.disableBiometrics();
        }} />
      </VaultGate>,
    );
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    fireEvent.submit(utils.container.querySelector('form')!);
    await waitFor(() => expect(utils.container.querySelector('[data-testid="security-child"]')).not.toBeNull());
    expect(device.mystika.svise).not.toHaveBeenCalled();
  });

  it('δέρνει βιομετρικά με κλειδί στη συσκευή', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    device.mystika.pare.mockResolvedValue('biometric-key');
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(
      <VaultGate>
        <SecurityChild action={async () => {}} />
      </VaultGate>,
    );
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    await waitFor(() => expect(screen.getByText('Γρήγορο ξεκλείδωμα με βιομετρικά')).toBeTruthy());
    fireEvent.click(screen.getByText('Γρήγορο ξεκλείδωμα με βιομετρικά'));
    await waitFor(() => expect(biometric.authenticate).toHaveBeenCalledOnce());
    expect(device.mystika.pare).toHaveBeenCalledWith('vault_biometric_unlock');
  });

  it('δέρνει σφάλμα όταν λείπει το βιομετρικό κλειδί', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    device.mystika.pare.mockResolvedValue('biometric-key');
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(
      <VaultGate>
        <SecurityChild action={async () => {}} />
      </VaultGate>,
    );
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    await waitFor(() => expect(screen.getByText('Γρήγορο ξεκλείδωμα με βιομετρικά')).toBeTruthy());
    device.mystika.pare.mockResolvedValue(null);
    fireEvent.click(screen.getByText('Γρήγορο ξεκλείδωμα με βιομετρικά'));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Το βιομετρικό κλειδί δεν βρέθηκε. Χρησιμοποίησε τον κύριο κωδικό.');
  });

  it('δέρνει σφάλμα όταν δεν υπάρχει βιομετρικό ξεκλείδωμα', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: false });
    fakeVault.vaultExists.mockResolvedValue(false);
    fakeVault.createVault.mockResolvedValue({ session: { storage: device.apothiki, dataKey: {} as never } as VaultSession, recoveryKey: 'RECOVERY-KEY' });
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));
    await waitFor(() => expect(screen.getByText('Το αποθήκευσα — άνοιγμα εφαρμογής')).toBeTruthy());
    expect(screen.queryByText('Προαιρετικό γρήγορο ξεκλείδωμα με Face ID / δακτυλικό αποτύπωμα')).toBeNull();
  });

  it('κλειδώνει όταν η εφαρμογή πάει στο παρασκήνιο με ανοιχτό vault', async () => {
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    fireEvent.submit(utils.container.querySelector('form')!);
    await waitFor(() => expect(utils.container.querySelector('form')).toBeNull());
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((r) => setTimeout(r, 0));
    expect(utils.container.querySelector('form')).not.toBeNull();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('δέρνει το αρχείο χωρίς files', async () => {
    await mount('setup');
    fireEvent.change(screen.getByLabelText('Αρχείο DPS.guide backup'));
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByRole('button', { name: 'Επαναφορά και ξεκλείδωμα' }).disabled).toBe(true);
  });

  it('δέρνει το loading όταν απολυθεί πριν ολοκληρωθεί ο έλεγχος', async () => {
    fakeVault.vaultExists.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
    const utils = render(<VaultGate>παιδί</VaultGate>);
    await new Promise((r) => setTimeout(r, 0));
    utils.unmount();
    await new Promise((r) => setTimeout(r, 150));
    expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull();
  });

  it('δέρνει το loading όταν απολυθεί και ο έλεγχος πετάει', async () => {
    fakeVault.vaultExists.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('δεν διαβάζεται'), 100))));
    const utils = render(<VaultGate>παιδί</VaultGate>);
    utils.unmount();
    await new Promise((r) => setTimeout(r, 150));
    expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull();
  });

  it('αγνοεί τα βιομετρικά όταν απολυθεί πριν γυρίσει το check', async () => {
    device.native = true;
    biometric.checkBiometry.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ isAvailable: true }), 50)));
    fakeVault.vaultExists.mockResolvedValue(false);
    const utils = render(<VaultGate>παιδί</VaultGate>);
    utils.unmount();
    await new Promise((r) => setTimeout(r, 60));
    expect(biometric.checkBiometry).toHaveBeenCalledOnce();
    expect(biometric.authenticate).not.toHaveBeenCalled();
  });

  it('αγνοεί τα βιομετρικά όταν απολυθεί πριν πετάξει το check', async () => {
    device.native = true;
    biometric.checkBiometry.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('δεν υπάρχει'), 50))));
    fakeVault.vaultExists.mockResolvedValue(false);
    const utils = render(<VaultGate>παιδί</VaultGate>);
    utils.unmount();
    await new Promise((r) => setTimeout(r, 60));
    expect(biometric.checkBiometry).toHaveBeenCalledOnce();
    expect(biometric.authenticate).not.toHaveBeenCalled();
  });

  it('κλειδώνει με pagehide όταν δεν υπάρχει ανοιχτό vault', async () => {
    fakeVault.vaultExists.mockResolvedValue(false);
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.getByText('Δημιουργία κρυπτογραφημένου vault')).toBeTruthy());
    window.dispatchEvent(new Event('pagehide'));
    await new Promise((r) => setTimeout(r, 0));
    // Κενό session: η lock βγάζει νωρίς — το mode μένει setup.
    expect(screen.getByText('Δημιουργία κρυπτογραφημένου vault')).toBeTruthy();
  });

  it('δέρνει σφάλμα όταν η ενεργοποίηση πετάει συμβολοσειρά', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    biometric.authenticate.mockRejectedValue('δεν ενεργοποιείται');
    fakeVault.vaultExists.mockResolvedValue(false);
    fakeVault.createVault.mockResolvedValue({ session: { storage: device.apothiki, dataKey: {} as never } as VaultSession, recoveryKey: 'RECOVERY-KEY' });
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));
    await waitFor(() => expect(screen.getByText('Το αποθήκευσα — άνοιγμα εφαρμογής')).toBeTruthy());
    expect(screen.getByText('Προαιρετικό γρήγορο ξεκλείδωμα με Face ID / δακτυλικό αποτύπωμα')).toBeTruthy();
    fireEvent.click(screen.getByText('Προαιρετικό γρήγορο ξεκλείδωμα με Face ID / δακτυλικό αποτύπωμα'));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Δεν ενεργοποιήθηκαν τα βιομετρικά.');
  });

  it('δέρνει σφάλμα όταν δεν υπάρχει διαθέσιμο βιομετρικό', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: false });
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(
      <VaultGate>
        <SecurityChild action={async (controls) => {
          await expect(controls.enableBiometrics()).rejects.toThrow('Δεν υπάρχει διαθέσιμο βιομετρικό ξεκλείδωμα στη συσκευή.');
        }} />
      </VaultGate>,
    );
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    fireEvent.submit(utils.container.querySelector('form')!);
    await waitFor(() => expect(utils.container.querySelector('[data-testid="security-child"]')).not.toBeNull());
  });

  it('δέρνει σφάλμα όταν αποτυγχάνει η ενεργοποίηση των βιομετρικών', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    biometric.authenticate.mockRejectedValue(new Error('δεν ενεργοποιείται'));
    fakeVault.vaultExists.mockResolvedValue(false);
    fakeVault.createVault.mockResolvedValue({ session: { storage: device.apothiki, dataKey: {} as never } as VaultSession, recoveryKey: 'RECOVERY-KEY' });
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.queryByText('Έλεγχος τοπικής αποθήκευσης…')).toBeNull());
    fireEvent.change(screen.getByLabelText('Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.change(screen.getByLabelText('Επιβεβαίωση κύριου κωδικού'), { target: { value: 'kwdikos-test-12345678' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Δημιουργία κρυπτογραφημένου vault' }));
    await waitFor(() => expect(screen.getByText('Το αποθήκευσα — άνοιγμα εφαρμογής')).toBeTruthy());
    expect(screen.getByText('Προαιρετικό γρήγορο ξεκλείδωμα με Face ID / δακτυλικό αποτύπωμα')).toBeTruthy();
    fireEvent.click(screen.getByText('Προαιρετικό γρήγορο ξεκλείδωμα με Face ID / δακτυλικό αποτύπωμα'));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('δεν ενεργοποιείται');
  });

  it('δέρνει σφάλμα όταν το βιομετρικό πετάει συμβολοσειρά', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    device.mystika.pare.mockResolvedValue('biometric-key');
    biometric.authenticate.mockRejectedValue('δεν πετυχαίνει');
    fakeVault.vaultExists.mockResolvedValue(true);
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.getByText('Ξεκλείδωμα')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('Γρήγορο ξεκλείδωμα με βιομετρικά')).toBeTruthy());
    fireEvent.click(screen.getByText('Γρήγορο ξεκλείδωμα με βιομετρικά'));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Δεν ήταν δυνατό το βιομετρικό ξεκλείδωμα.');
  });

  it('δέρνει σφάλμα όταν αποτυγχάνει η απενεργοποίηση των βιομετρικών', async () => {
    device.native = true;
    biometric.checkBiometry.mockResolvedValue({ isAvailable: true });
    device.mystika.pare.mockResolvedValue('biometric-key');
    device.mystika.svise.mockRejectedValue(new Error('δεν αφαιρεί'));
    fakeVault.vaultExists.mockResolvedValue(true);
    render(<VaultGate>παιδί</VaultGate>);
    await waitFor(() => expect(screen.getByText('Ξεκλείδωμα')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('Απενεργοποίηση βιομετρικού ξεκλειδώματος')).toBeTruthy());
    fireEvent.click(screen.getByText('Απενεργοποίηση βιομετρικού ξεκλειδώματος'));
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByRole('alert').textContent).toBe('Δεν αφαιρέθηκε το βιομετρικό κλειδί.');
  });

  it('δημιουργεί encrypted backup μέσω context', async () => {
    const session = { storage: device.apothiki, dataKey: {} as never } as VaultSession;
    fakeVault.vaultExists.mockResolvedValue(true);
    fakeVault.unlockVault.mockResolvedValue(session);
    const utils = render(
      <VaultGate>
        <SecurityChild action={async (controls) => {
          await controls.createEncryptedBackup('backup-password-12345678');
          expect(fakeVault.createEncryptedBackup).toHaveBeenCalledWith(device.apothiki, device.mystika, 'backup-password-12345678');
        }} />
      </VaultGate>,
    );
    await waitFor(() => expect(utils.container.querySelector('form')).not.toBeNull());
    fireEvent.submit(utils.container.querySelector('form')!);
    await waitFor(() => expect(utils.container.querySelector('[data-testid="security-child"]')).not.toBeNull());
  });
});
