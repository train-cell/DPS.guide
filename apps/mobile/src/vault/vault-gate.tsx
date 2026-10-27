import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { BiometricAuth, AndroidBiometryStrength } from '@aparajita/capacitor-biometric-auth';
import type { Periballon } from '../periballon/periballon.js';
import { ParoxosPeriballontos } from '../periballon/provolos.js';
import { createDeviceStorage, createProductionPeriballon } from './runtime.js';
import type { VaultSession } from './vault.js';
import {
  createVault,
  createEncryptedBackup,
  exportBiometricUnlockKey,
  restoreEncryptedBackup,
  unlockVault,
  unlockWithBiometricKey,
  vaultExists,
} from './vault.js';

interface Props {
  readonly children: ReactNode;
}

type Mode = 'loading' | 'setup' | 'unlock' | 'recovery' | 'ready';

export interface VaultSecurityControls {
  readonly biometricEnabled: boolean;
  readonly biometricAvailable: boolean;
  readonly enableBiometrics: () => Promise<void>;
  readonly disableBiometrics: () => Promise<void>;
  readonly createEncryptedBackup: (backupPassword: string) => Promise<Blob>;
  readonly restoreBackupFromFile: (backupFile: File, backupPassword: string) => Promise<void>;
  readonly lockVault: () => void;
}

const VaultSecurityContext = createContext<VaultSecurityControls | null>(null);

export function useVaultSecurity(): VaultSecurityControls | null {
  return useContext(VaultSecurityContext);
}

export function VaultGate({ children }: Props) {
  const device = useMemo(createDeviceStorage, []);
  const [mode, setMode] = useState<Mode>('loading');
  const [session, setSession] = useState<VaultSession | null>(null);
  const [pendingSession, setPendingSession] = useState<VaultSession | null>(null);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [credential, setCredential] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const periballon: Periballon | null = useMemo(
    () => session === null ? null : createProductionPeriballon(device, session),
    [device, session],
  );

  useEffect(() => {
    let active = true;
    void vaultExists(device.apothiki)
      .then((exists) => { if (active) setMode(exists ? 'unlock' : 'setup'); })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Δεν ήταν δυνατός ο έλεγχος της συσκευής.');
          setMode('setup');
        }
      });
    return () => { active = false; };
  }, [device.apothiki]);

  useEffect(() => {
    let active = true;
    if (!device.native) return () => { active = false; };
    void Promise.all([BiometricAuth.checkBiometry(), device.mystika.pare('vault_biometric_unlock')])
      .then(([status, key]) => {
        if (active) {
          setBiometricAvailable(status.isAvailable);
          setBiometricEnabled(key !== null);
        }
      })
      .catch(() => {
        if (active) {
          setBiometricAvailable(false);
          setBiometricEnabled(false);
        }
      });
    return () => { active = false; };
  }, [device]);

  const lock = useCallback((): void => {
    if (session === null && pendingSession === null) return;
    setSession(null);
    setPendingSession(null);
    setRecoveryKey(null);
    setMasterPassword('');
    setConfirmation('');
    setCredential('');
    setMode('unlock');
  }, [session, pendingSession]);

  useEffect(() => {
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden' && (session !== null || pendingSession !== null)) lock();
    };
    window.addEventListener('pagehide', lock);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', lock);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [lock, session, pendingSession]);

  async function setup(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    if (masterPassword !== confirmation) {
      setError('Οι δύο κύριοι κωδικοί δεν ταιριάζουν.');
      return;
    }
    setBusy(true);
    try {
      const created = await createVault(device.apothiki, masterPassword);
      setPendingSession(created.session);
      setRecoveryKey(created.recoveryKey);
      setMode('recovery');
      setMasterPassword('');
      setConfirmation('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Δεν ήταν δυνατή η δημιουργία του vault.');
    } finally {
      setBusy(false);
    }
  }

  async function unlock(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      setSession(await unlockVault(device.apothiki, credential));
      setCredential('');
      setMode('ready');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Δεν ήταν δυνατό το ξεκλείδωμα.');
    } finally {
      setBusy(false);
    }
  }

  async function restoreBackup(): Promise<void> {
    if (backupFile === null) {
      setError('Επίλεξε πρώτα το αρχείο encrypted backup.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await restoreEncryptedBackup(device.apothiki, device.mystika, backupFile, backupPassword);
      setBackupPassword('');
      setBackupFile(null);
      setError('Το backup επαναφέρθηκε. Ξεκλείδωσε με τον master password ή το recovery key του backup.');
      setMode('unlock');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Δεν ήταν δυνατή η επαναφορά του backup.');
    } finally {
      setBusy(false);
    }
  }

  const restoreBackupFromFile = useCallback(
    async (file: File, password: string): Promise<void> => {
      setError(null);
      setBusy(true);
      try {
        const existing = await device.apothiki.lista('.dps-vault');
        if (existing.ok) {
          for (const filePath of existing.timi) {
            await device.apothiki.diagrafi(filePath);
          }
        }
        await device.mystika.svise('vault_biometric_unlock');
        await restoreEncryptedBackup(device.apothiki, device.mystika, file, password);
        setSession(null);
        setPendingSession(null);
        setRecoveryKey(null);
        setMasterPassword('');
        setConfirmation('');
        setCredential('');
        setBiometricEnabled(false);
        setError('Το backup επαναφέρθηκε. Ξεκλείδωσε με τον master password ή το recovery key του backup.');
        setMode('unlock');
      } finally {
        setBusy(false);
      }
    },
    [device],
  );

  async function enableBiometrics(): Promise<void> {
    if (!device.native || session === null && pendingSession === null) {
      throw new Error('Τα βιομετρικά ξεκλειδώματα είναι διαθέσιμα μόνο αφού ανοίξει native vault.');
    }
    const status = await BiometricAuth.checkBiometry();
    if (!status.isAvailable) throw new Error('Δεν υπάρχει διαθέσιμο βιομετρικό ξεκλείδωμα στη συσκευή.');
    await BiometricAuth.authenticate({
      reason: 'Προστασία του κρυπτογραφημένου vault DPS.guide',
      cancelTitle: 'Άκυρο',
      allowDeviceCredential: false,
      iosFallbackTitle: '',
      androidTitle: 'Γρήγορο ξεκλείδωμα',
      androidSubtitle: 'Επιβεβαίωσε για αποθήκευση του κλειδιού του vault',
      androidConfirmationRequired: true,
      androidBiometryStrength: AndroidBiometryStrength.weak,
    });
    const selectedSession = session ?? pendingSession;
    if (selectedSession === null) throw new Error('Το vault είναι κλειδωμένο.');
    await device.mystika.vale('vault_biometric_unlock', await exportBiometricUnlockKey(selectedSession));
    setBiometricEnabled(true);
    setBiometricAvailable(true);
  }

  async function disableBiometrics(): Promise<void> {
    if (!device.native) return;
    await device.mystika.svise('vault_biometric_unlock');
    setBiometricEnabled(false);
  }

  async function unlockWithBiometrics(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      await BiometricAuth.authenticate({
        reason: 'Ξεκλείδωμα του κρυπτογραφημένου vault DPS.guide',
        cancelTitle: 'Άκυρο',
        allowDeviceCredential: false,
        iosFallbackTitle: '',
        androidTitle: 'Ξεκλείδωμα DPS.guide',
        androidSubtitle: 'Χρησιμοποίησε βιομετρική ταυτοποίηση',
        androidConfirmationRequired: true,
        androidBiometryStrength: AndroidBiometryStrength.weak,
      });
      const encodedKey = await device.mystika.pare('vault_biometric_unlock');
      if (encodedKey === null) throw new Error('Το βιομετρικό κλειδί δεν βρέθηκε. Χρησιμοποίησε τον κύριο κωδικό.');
      setSession(await unlockWithBiometricKey(device.apothiki, encodedKey));
      setMode('ready');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Δεν ήταν δυνατό το βιομετρικό ξεκλείδωμα.');
    } finally {
      setBusy(false);
    }
  }

  function finishRecovery(): void {
    if (pendingSession === null) return;
    setSession(pendingSession);
    setPendingSession(null);
    setRecoveryKey(null);
    setMode('ready');
  }

  const form = (
    <main className="vault-gate-selida">
      <section className="vault-gate-kouti" aria-live="polite">
        <div aria-hidden="true" className="vault-gate-eikonidio">🔐</div>
        <h1 className="vault-gate-titlos">DPS.guide · τοπικό vault</h1>
        {mode === 'loading' && <p>Έλεγχος τοπικής αποθήκευσης…</p>}
        {mode === 'setup' && (
          <>
            <form onSubmit={(event) => void setup(event)} className="vault-gate-forma">
              <p>Όλα τα μαθήματα, αρχεία και μυστικά κρυπτογραφούνται στη συσκευή. Ο κύριος κωδικός δεν αποθηκεύεται.</p>
              <label htmlFor="vault-master">Κύριος κωδικός · τουλάχιστον 12 χαρακτήρες</label>
              <input id="vault-master" className="vault-gate-eisodos" type="password" autoComplete="new-password" minLength={12} required value={masterPassword} onChange={(event) => setMasterPassword(event.target.value)} />
              <label htmlFor="vault-confirm">Επιβεβαίωση κύριου κωδικού</label>
              <input id="vault-confirm" className="vault-gate-eisodos" type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
              <button className="vault-gate-koumpi" disabled={busy}>{busy ? 'Δημιουργία…' : 'Δημιουργία κρυπτογραφημένου vault'}</button>
            </form>
            <section className="vault-gate-tmima-backup">
              <h2 className="vault-gate-titlos-tmimatos">Επαναφορά encrypted backup</h2>
              <p className="vault-gate-keimeno">Η επαναφορά γίνεται μόνο σε καθαρή εγκατάσταση. Το αρχείο περιέχει αποκλειστικά κρυπτογραφημένα δεδομένα και απαιτεί τον ξεχωριστό κωδικό backup.</p>
              <label htmlFor="vault-backup-file">Αρχείο DPS.guide backup</label>
              <input id="vault-backup-file" className="vault-gate-eisodos" type="file" accept=".dpsbackup,application/octet-stream,application/vnd.dps-guide.backup" onChange={(event) => setBackupFile(event.target.files?.[0] ?? null)} />
              <label htmlFor="vault-backup-password">Κωδικός backup</label>
              <input id="vault-backup-password" className="vault-gate-eisodos" type="password" autoComplete="off" minLength={12} value={backupPassword} onChange={(event) => setBackupPassword(event.target.value)} />
              <button type="button" className="vault-gate-koumpi vault-gate-koumpi-defterevon" disabled={busy || backupFile === null || backupPassword.trim().length < 12} onClick={() => void restoreBackup()}>
                {busy ? 'Επαναφορά…' : 'Επαναφορά και ξεκλείδωμα'}
              </button>
            </section>
          </>
        )}
        {mode === 'recovery' && recoveryKey !== null && (
          <div className="vault-gate-recovery-kouti">
            <p><strong>Αποθήκευσε το recovery key τώρα.</strong> Είναι η μόνη εναλλακτική αν ξεχάσεις τον κύριο κωδικό. Δεν θα εμφανιστεί ξανά.</p>
            <code className="vault-gate-kodikas">{recoveryKey}</code>
            {device.native && biometricAvailable && !biometricEnabled && (
              <button type="button" className="vault-gate-koumpi vault-gate-koumpi-defterevon" onClick={() => void enableBiometrics().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Δεν ενεργοποιήθηκαν τα βιομετρικά.'))}>
                Προαιρετικό γρήγορο ξεκλείδωμα με Face ID / δακτυλικό αποτύπωμα
              </button>
            )}
            <button className="vault-gate-koumpi" onClick={finishRecovery}>Το αποθήκευσα — άνοιγμα εφαρμογής</button>
          </div>
        )}
        {mode === 'unlock' && (
          <form onSubmit={(event) => void unlock(event)} className="vault-gate-forma">
            <p>Το vault κλειδώθηκε. Ξεκλείδωσε με τον κύριο κωδικό ή με το recovery key.</p>
            <label htmlFor="vault-credential">Κύριος κωδικός ή recovery key</label>
            <input id="vault-credential" className="vault-gate-eisodos" type="password" autoComplete="current-password" required value={credential} onChange={(event) => setCredential(event.target.value)} />
            <button className="vault-gate-koumpi" disabled={busy}>{busy ? 'Ξεκλείδωμα…' : 'Ξεκλείδωμα'}</button>
            {device.native && biometricEnabled && (
              <button type="button" className="vault-gate-koumpi vault-gate-koumpi-defterevon" disabled={busy} onClick={() => void unlockWithBiometrics()}>
                {busy ? 'Έλεγχος…' : 'Γρήγορο ξεκλείδωμα με βιομετρικά'}
              </button>
            )}
            {device.native && biometricEnabled && (
              <button type="button" className="vault-gate-koumpi-kleidi" onClick={() => void disableBiometrics().catch(() => setError('Δεν αφαιρέθηκε το βιομετρικό κλειδί.'))}>
                Απενεργοποίηση βιομετρικού ξεκλειδώματος
              </button>
            )}
          </form>
        )}
        {error !== null && <p role="alert" className="vault-gate-sfalma">{error}</p>}
        {mode !== 'loading' && mode !== 'ready' && (
          <p className="vault-gate-ypovathro">Το vault κλειδώνει αμέσως όταν η εφαρμογή πάει στο παρασκήνιο.</p>
        )}
      </section>
    </main>
  );

  if (mode !== 'ready' || periballon === null) return form;
  return (
    <VaultSecurityContext.Provider value={{
      biometricEnabled,
      biometricAvailable,
      enableBiometrics,
      disableBiometrics,
      createEncryptedBackup: (password) => createEncryptedBackup(device.apothiki, device.mystika, password),
      restoreBackupFromFile,
      lockVault: lock,
    }}>
      <ParoxosPeriballontos periballon={periballon}>{children}</ParoxosPeriballontos>
    </VaultSecurityContext.Provider>
  );
}
