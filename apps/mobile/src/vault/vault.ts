import type { ApothikiPyli, Apotelesma, KleidiMystikou, MystikaPyli } from '@dps/core';
import { apotyxia, ok } from '@dps/core';

const HEADER_PATH = '.dps-vault/header.json';
const INDEX_PATH = '.dps-vault/index.enc';
const OBJECTS_PATH = '.dps-vault/objects';
const LEGACY_KDF_ITERATIONS = 310_000;
const CURRENT_KDF_ITERATIONS = 600_000;
const VAULT_VERSION = 1;
const BACKUP_MAGIC_V1 = 'DPSBKP01';
const BACKUP_MAGIC_V2 = 'DPSBKP02';
const BACKUP_CHUNK_BYTES = 1024 * 1024;
const MAX_BACKUP_RECORD_BYTES = 220 * 1024 * 1024;
const VAULT_STORAGE_LOCK_NAME = 'dps-guide-vault-storage-v1';
const BACKUP_SECRET_KEYS = [
  'eclass_onoma_xristi',
  'eclass_kodikos',
  'eclass_panepistimio_id',
  'eclass_base_url',
  'moodle_webservice_token',
  'llm_api_key',
] as const satisfies readonly KleidiMystikou[];

let vaultStorageQueue: Promise<void> = Promise.resolve();

/** Serializes vault index operations in this runtime and coordinates same-origin tabs when supported. */
function withVaultStorageLock<T>(operation: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
    return locks === undefined
      ? operation()
      : locks.request(VAULT_STORAGE_LOCK_NAME, { mode: 'exclusive' }, operation);
  };
  const result = vaultStorageQueue.then(run, run);
  vaultStorageQueue = result.then(() => undefined, () => undefined);
  return result;
}

interface Envelope {
  readonly salt: string;
  readonly iv: string;
  readonly wrapped_key: string;
  readonly iterations?: number;
}

interface VaultHeader {
  readonly version: 1;
  readonly master: Envelope;
  readonly recovery: Envelope;
}

interface VaultIndex {
  readonly version: 1;
  readonly files: Record<string, string>;
}

interface Ciphertext {
  readonly iv: string;
  readonly data: string;
}

export class VaultError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VaultError';
  }
}

export interface VaultSession {
  readonly storage: EncryptedApothiki;
  readonly dataKey: CryptoKey;
}

function b64(bytes: Uint8Array): string {
  let raw = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    raw += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(raw);
}

function fromB64(value: string): Uint8Array {
  const raw = atob(value);
  const result = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) result[index] = raw.charCodeAt(index);
  return result;
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** Copies typed bytes into an ArrayBuffer accepted by WebCrypto's strict TS types. */
function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

function normalizePath(value: string): string | null {
  const parts = value.replace(/\\/g, '/').split('/').filter((part) => part !== '' && part !== '.');
  if (parts.length === 0 || parts.some((part) => part === '..' || part.includes('\0'))) return null;
  if (parts[0] === '.dps-vault') return null;
  return parts.join('/');
}

function supportedKdfIterations(value: number): boolean {
  return value === LEGACY_KDF_ITERATIONS || value === CURRENT_KDF_ITERATIONS;
}

async function deriveWrappingKey(secret: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    asArrayBuffer(new TextEncoder().encode(secret)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: asArrayBuffer(salt), iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(key: CryptoKey, clear: Uint8Array, aad: string): Promise<Ciphertext> {
  const iv = randomBytes(12);
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asArrayBuffer(iv), additionalData: asArrayBuffer(new TextEncoder().encode(aad)) },
    key,
    asArrayBuffer(clear),
  );
  return { iv: b64(iv), data: b64(new Uint8Array(data)) };
}

async function decrypt(key: CryptoKey, value: Ciphertext, aad: string): Promise<Uint8Array> {
  const clear = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: asArrayBuffer(fromB64(value.iv)), additionalData: asArrayBuffer(new TextEncoder().encode(aad)) },
    key,
    asArrayBuffer(fromB64(value.data)),
  );
  return new Uint8Array(clear);
}

async function wrapDataKey(dataKey: CryptoKey, password: string, aad: string): Promise<Envelope> {
  const salt = randomBytes(16);
  const iterations = CURRENT_KDF_ITERATIONS;
  const wrappingKey = await deriveWrappingKey(password, salt, iterations);
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', dataKey));
  const wrapped = await encrypt(wrappingKey, rawKey, `${aad}/pbkdf2-sha256/${iterations}`);
  return { salt: b64(salt), iv: wrapped.iv, wrapped_key: wrapped.data, iterations };
}

async function unwrapDataKey(envelope: Envelope, secret: string, aad: string): Promise<CryptoKey> {
  const iterations = envelope.iterations ?? LEGACY_KDF_ITERATIONS;
  if (!supportedKdfIterations(iterations)) throw new VaultError('Το vault χρησιμοποιεί μη υποστηριζόμενη ρύθμιση κρυπτογράφησης.');
  const wrappingKey = await deriveWrappingKey(secret, fromB64(envelope.salt), iterations);
  const rawKey = await decrypt(
    wrappingKey,
    { iv: envelope.iv, data: envelope.wrapped_key },
    envelope.iterations === undefined ? aad : `${aad}/pbkdf2-sha256/${iterations}`,
  );
  return crypto.subtle.importKey('raw', asArrayBuffer(rawKey), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

function recoverySecret(): string {
  return Array.from(randomBytes(24), (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function readHeader(storage: ApothikiPyli): Promise<VaultHeader | null> {
  const result = await storage.diavase_keimeno(HEADER_PATH);
  if (!result.ok) {
    if (result.sfalma.kodikos === 'DEN_VRETHIKE') return null;
    throw new VaultError('Δεν ήταν δυνατή η ανάγνωση της ρύθμισης του vault.');
  }
  const isVaultHeader = (value: unknown): value is VaultHeader => (
    typeof value === 'object' && value !== null && 'version' in value &&
    value.version === VAULT_VERSION && 'master' in value && 'recovery' in value
  );
  try {
    const parsed: unknown = JSON.parse(result.timi);
    if (isVaultHeader(parsed)) return parsed;
  } catch {
    // Η αλλοιωμένη ρύθμιση αντιμετωπίζεται με το ίδιο ασφαλές μήνυμα.
  }
  try {
    const legacyText = new TextDecoder().decode(fromB64(result.timi.replace(/\s+/g, '')));
    const legacyHeader: unknown = JSON.parse(legacyText);
    if (isVaultHeader(legacyHeader)) {
      const repaired = await storage.grapse_keimeno(HEADER_PATH, JSON.stringify(legacyHeader));
      if (!repaired.ok) throw new VaultError('Δεν ήταν δυνατή η επιδιόρθωση της ρύθμισης του vault.');
      return legacyHeader;
    }
  } catch (reason) {
    if (reason instanceof VaultError) throw reason;
    // Δεν είναι παλιά Base64-κωδικοποιημένη ρύθμιση· αντιμετωπίζεται ως κατεστραμμένη.
  }
  throw new VaultError('Το αρχείο ρύθμισης του vault είναι κατεστραμμένο ή μη υποστηριζόμενο.');
}

/** Δημιουργεί τυχαίο κλειδί δεδομένων και δύο ανεξάρτητους τρόπους ανάκτησής του. */
export function createVault(
  storage: ApothikiPyli,
  masterPassword: string,
): Promise<{ readonly session: VaultSession; readonly recoveryKey: string }> {
  return withVaultStorageLock(() => createVaultUnlocked(storage, masterPassword));
}

async function createVaultUnlocked(
  storage: ApothikiPyli,
  masterPassword: string,
): Promise<{ readonly session: VaultSession; readonly recoveryKey: string }> {
  if (masterPassword.trim().length < 12) {
    throw new VaultError('Ο κύριος κωδικός πρέπει να έχει τουλάχιστον 12 χαρακτήρες.');
  }
  if (await readHeader(storage)) throw new VaultError('Το vault έχει ήδη ρυθμιστεί.');

  const recoveryKey = recoverySecret();
  const dataKey = await crypto.subtle.importKey('raw', asArrayBuffer(randomBytes(32)), { name: 'AES-GCM' }, true, [
    'encrypt', 'decrypt',
  ]);
  const header: VaultHeader = {
    version: VAULT_VERSION,
    master: await wrapDataKey(dataKey, masterPassword, 'dps.vault.v1/master'),
    recovery: await wrapDataKey(dataKey, recoveryKey, 'dps.vault.v1/recovery'),
  };
  const saved = await storage.grapse_keimeno(HEADER_PATH, JSON.stringify(header));
  if (!saved.ok) throw new VaultError('Δεν ήταν δυνατή η αποθήκευση της ρύθμισης του vault.');
  return { session: { storage: new EncryptedApothiki(storage, dataKey), dataKey }, recoveryKey };
}

/** Ξεκλειδώνει με κύριο κωδικό ή με το recovery key. Δεν αποθηκεύει κανένα από τα δύο. */
export async function unlockVault(
  storage: ApothikiPyli,
  credential: string,
): Promise<VaultSession> {
  const header = await readHeader(storage);
  if (!header) throw new VaultError('Δεν έχει δημιουργηθεί vault σε αυτή τη συσκευή.');
  const cleaned = credential.replace(/\s+/g, '').toUpperCase();
  for (const [envelope, aad] of [
    [header.master, 'dps.vault.v1/master'],
    [header.recovery, 'dps.vault.v1/recovery'],
  ] as const) {
    try {
      const dataKey = await unwrapDataKey(envelope, credential, aad);
      return { storage: new EncryptedApothiki(storage, dataKey), dataKey };
    } catch {
      if (aad === 'dps.vault.v1/recovery' && cleaned !== credential) {
        try {
          const dataKey = await unwrapDataKey(envelope, cleaned, aad);
          return { storage: new EncryptedApothiki(storage, dataKey), dataKey };
        } catch {
          // Αποτυχία αυτού του διαπιστευτηρίου· δοκίμασε το επόμενο envelope.
        }
      }
    }
  }
  throw new VaultError('Ο κύριος κωδικός ή το recovery key δεν είναι σωστό.');
}

export async function vaultExists(storage: ApothikiPyli): Promise<boolean> {
  return (await readHeader(storage)) !== null;
}

/** The exported key is held only by native Keychain/Keystore when biometrics are enabled. */
export async function exportBiometricUnlockKey(session: VaultSession): Promise<string> {
  return b64(new Uint8Array(await crypto.subtle.exportKey('raw', session.dataKey)));
}

export async function unlockWithBiometricKey(
  storage: ApothikiPyli,
  encodedKey: string,
): Promise<VaultSession> {
  const dataKey = await crypto.subtle.importKey(
    'raw', asArrayBuffer(fromB64(encodedKey)), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'],
  );
  const session = { storage: new EncryptedApothiki(storage, dataKey), dataKey };
  const index = await session.storage.lista('.');
  if (!index.ok) throw new VaultError('Το κλειδί βιομετρικού ξεκλειδώματος δεν είναι έγκυρο.');
  return session;
}

type BackupChunkKind = 0 | 1;

async function* vaultBackupPlaintext(storage: ApothikiPyli, secrets: MystikaPyli): AsyncGenerator<Uint8Array> {
  const listed = await storage.lista('.dps-vault');
  if (!listed.ok) throw new VaultError('Δεν ήταν δυνατή η ανάγνωση του vault για backup.');
  const encoder = new TextEncoder();

  async function* record(kind: BackupChunkKind, path: string, data: Uint8Array): AsyncGenerator<Uint8Array> {
    const pathBytes = encoder.encode(path);
    if (pathBytes.byteLength > 0xffff) throw new VaultError('Υπάρχει διαδρομή vault πολύ μεγάλη για backup.');
    const header = new Uint8Array(11);
    const view = new DataView(header.buffer);
    header[0] = kind;
    view.setUint16(1, pathBytes.byteLength, false);
    view.setBigUint64(3, BigInt(data.byteLength), false);
    yield header;
    if (pathBytes.byteLength > 0) yield pathBytes;
    for (let offset = 0; offset < data.byteLength; offset += BACKUP_CHUNK_BYTES) {
      yield data.subarray(offset, Math.min(offset + BACKUP_CHUNK_BYTES, data.byteLength));
    }
  }

  for (const path of listed.timi) {
    if (!path.startsWith('.dps-vault/')) throw new VaultError('Το vault περιέχει μη αναμενόμενη διαδρομή.');
    const entry = await storage.diavase_dyadiko(path);
    if (!entry.ok) throw new VaultError('Δεν ήταν δυνατή η ανάγνωση όλων των κρυπτογραφημένων αρχείων του vault.');
    yield* record(0, path, entry.timi);
  }

  for (const key of BACKUP_SECRET_KEYS) {
    const envelope = await secrets.pare(key);
    if (envelope === null) continue;
    const encoded = encoder.encode(envelope);
    yield* record(1, `secret:${key}`, encoded);
  }
  yield new Uint8Array([255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

async function encryptBackupChunk(key: CryptoKey, bytes: Uint8Array, aad: string): Promise<Uint8Array> {
  const iv = randomBytes(12);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asArrayBuffer(iv), additionalData: asArrayBuffer(new TextEncoder().encode(aad)) },
    key,
    asArrayBuffer(bytes),
  ));
  const record = new Uint8Array(17 + ciphertext.byteLength);
  const view = new DataView(record.buffer);
  record[0] = aad.includes('/final/') ? 1 : 0;
  view.setUint32(1, ciphertext.byteLength, false);
  record.set(iv, 5);
  record.set(ciphertext, 17);
  return record;
}

/** Creates an authenticated, chunk-encrypted backup. All vault paths stay encrypted inside it. */
export function createEncryptedBackup(
  storage: ApothikiPyli,
  secrets: MystikaPyli,
  backupPassword: string,
): Promise<Blob> {
  return withVaultStorageLock(() => createEncryptedBackupUnlocked(storage, secrets, backupPassword));
}

async function createEncryptedBackupUnlocked(
  storage: ApothikiPyli,
  secrets: MystikaPyli,
  backupPassword: string,
): Promise<Blob> {
  if (backupPassword.trim().length < 12) throw new VaultError('Ο κωδικός backup πρέπει να έχει τουλάχιστον 12 χαρακτήρες.');
  if (!(await vaultExists(storage))) throw new VaultError('Δεν υπάρχει ρυθμισμένο vault για backup.');

  const salt = randomBytes(16);
  const wrappingKey = await deriveWrappingKey(backupPassword, salt, CURRENT_KDF_ITERATIONS);
  const header = new Uint8Array(28);
  header.set(new TextEncoder().encode(BACKUP_MAGIC_V2), 0);
  header.set(salt, 8);
  new DataView(header.buffer).setUint32(24, CURRENT_KDF_ITERATIONS, false);
  const parts: BlobPart[] = [header.buffer as ArrayBuffer];
  let pending = new Uint8Array(BACKUP_CHUNK_BYTES);
  let used = 0;
  let chunkIndex = 0;

  for await (const bytes of vaultBackupPlaintext(storage, secrets)) {
    let offset = 0;
    while (offset < bytes.byteLength) {
      const take = Math.min(pending.byteLength - used, bytes.byteLength - offset);
      pending.set(bytes.subarray(offset, offset + take), used);
      used += take;
      offset += take;
      if (used === pending.byteLength) {
        const encrypted = await encryptBackupChunk(wrappingKey, pending, `dps.backup.v2/chunk/${chunkIndex}`);
        parts.push(encrypted.buffer as ArrayBuffer);
        pending = new Uint8Array(BACKUP_CHUNK_BYTES);
        used = 0;
        chunkIndex += 1;
      }
    }
  }
  if (used > 0) {
    const encrypted = await encryptBackupChunk(wrappingKey, pending.subarray(0, used), `dps.backup.v2/chunk/${chunkIndex}`);
    parts.push(encrypted.buffer as ArrayBuffer);
    chunkIndex += 1;
  }
  const final = await encryptBackupChunk(wrappingKey, new Uint8Array(), `dps.backup.v2/final/${chunkIndex}`);
  parts.push(final.buffer as ArrayBuffer);
  return new Blob(parts, { type: 'application/vnd.dps-guide.backup' });
}

interface RestoreRecord {
  readonly kind: 0 | 1;
  readonly path: string;
  readonly data: Uint8Array;
}

class BackupPlaintextReader {
  private offset = 0;
  private header: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  private path = '';
  private pathLength = 0;
  private pathBytes = new Uint8Array(0);
  private pathReceived = 0;
  private pathReady = false;
  private dataLength = 0;
  private dataParts: Uint8Array[] = [];
  private dataReceived = 0;
  private kind: 0 | 1 | null = null;
  finished = false;

  constructor(private readonly consume: (record: RestoreRecord) => Promise<void>) {}

  async feed(bytes: Uint8Array): Promise<void> {
    this.offset = 0;
    while (this.offset < bytes.byteLength) {
      if (this.finished) throw new VaultError('Το backup περιέχει επιπλέον δεδομένα μετά το τέλος του.');
      if (this.kind === null) {
        const needed = 11 - this.header.byteLength;
        const take = Math.min(needed, bytes.byteLength - this.offset);
        this.header = joinBytes(this.header, bytes.subarray(this.offset, this.offset + take));
        this.offset += take;
        if (this.header.byteLength < 11) continue;
        const view = new DataView(this.header.buffer, this.header.byteOffset, this.header.byteLength);
        const kind = this.header[0];
        this.pathLength = view.getUint16(1, false);
        const length = view.getBigUint64(3, false);
        if (length > BigInt(MAX_BACKUP_RECORD_BYTES)) throw new VaultError('Το backup περιέχει υπερβολικά μεγάλο αρχείο.');
        this.dataLength = Number(length);
        if (kind === 255) {
          if (this.pathLength !== 0 || this.dataLength !== 0) throw new VaultError('Μη έγκυρο τέλος backup.');
          this.finished = true;
          this.header = new Uint8Array(0);
          continue;
        }
        if (kind !== 0 && kind !== 1) throw new VaultError('Το backup περιέχει άγνωστο τύπο εγγραφής.');
        this.kind = kind;
        this.pathBytes = new Uint8Array(this.pathLength);
        this.pathReceived = 0;
        this.pathReady = this.pathLength === 0;
        this.dataParts = [];
        this.dataReceived = 0;
        this.header = new Uint8Array(0);
      }

      if (!this.pathReady) {
        const take = Math.min(this.pathLength - this.pathReceived, bytes.byteLength - this.offset);
        this.pathBytes.set(bytes.subarray(this.offset, this.offset + take), this.pathReceived);
        this.pathReceived += take;
        this.offset += take;
        if (this.pathReceived < this.pathLength) continue;
        this.path = new TextDecoder('utf-8', { fatal: true }).decode(this.pathBytes);
        if (this.path.length === 0) throw new VaultError('Το backup περιέχει κενή διαδρομή.');
        this.pathReady = true;
      }

      const take = Math.min(this.dataLength - this.dataReceived, bytes.byteLength - this.offset);
      if (take > 0) {
        this.dataParts.push(bytes.slice(this.offset, this.offset + take));
        this.dataReceived += take;
        this.offset += take;
      }
      if (this.dataReceived < this.dataLength) continue;
      const data = joinBytes(...this.dataParts);
      await this.consume({ kind: this.kind!, path: this.path, data });
      this.kind = null;
      this.path = '';
      this.pathBytes = new Uint8Array(0);
      this.pathReceived = 0;
      this.pathReady = false;
      this.dataParts = [];
      this.dataReceived = 0;
    }
  }
}

function joinBytes(...items: readonly Uint8Array[]): Uint8Array {
  const length = items.reduce((sum, item) => sum + item.byteLength, 0);
  const joined = new Uint8Array(length);
  let offset = 0;
  for (const item of items) {
    joined.set(item, offset);
    offset += item.byteLength;
  }
  return joined;
}

class BackupStreamReader {
  private buffered: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  private offset = 0;
  private done = false;

  constructor(private readonly reader: ReadableStreamDefaultReader<Uint8Array>) {}

  async readExact(length: number): Promise<Uint8Array | null> {
    const result = new Uint8Array(length);
    let written = 0;
    while (written < length) {
      if (this.offset >= this.buffered.byteLength) {
        const next = await this.reader.read();
        if (next.done) {
          this.done = true;
          if (written === 0) return null;
          throw new VaultError('Το backup είναι κομμένο ή αλλοιωμένο.');
        }
        this.buffered = next.value;
        this.offset = 0;
        if (this.buffered.byteLength === 0) continue;
      }
      const take = Math.min(length - written, this.buffered.byteLength - this.offset);
      result.set(this.buffered.subarray(this.offset, this.offset + take), written);
      this.offset += take;
      written += take;
    }
    return result;
  }

  async hasTrailingBytes(): Promise<boolean> {
    if (this.offset < this.buffered.byteLength) return true;
    if (this.done) return false;
    while (true) {
      const next = await this.reader.read();
      this.done = next.done;
      this.buffered = next.done ? new Uint8Array(0) : next.value;
      this.offset = 0;
      if (this.done || this.buffered.byteLength > 0) return this.buffered.byteLength > 0;
    }
  }

  release(): void { this.reader.releaseLock(); }
}

function validateBackupPath(path: string): boolean {
  const parts = path.replace(/\\/g, '/').split('/');
  return path.startsWith('.dps-vault/') && parts.every((part) => part !== '' && part !== '.' && part !== '..' && !part.includes('\0'));
}

function validSecretEnvelope(value: string): boolean {
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null && 'iv' in parsed && 'data' in parsed &&
      typeof parsed.iv === 'string' && typeof parsed.data === 'string';
  } catch {
    return false;
  }
}

/** Restores a backup only into an empty device vault; biometric unlock keys are never transferred. */
export function restoreEncryptedBackup(
  storage: ApothikiPyli,
  secrets: MystikaPyli,
  backup: Blob,
  backupPassword: string,
): Promise<void> {
  return withVaultStorageLock(() => restoreEncryptedBackupUnlocked(storage, secrets, backup, backupPassword));
}

async function restoreEncryptedBackupUnlocked(
  storage: ApothikiPyli,
  secrets: MystikaPyli,
  backup: Blob,
  backupPassword: string,
): Promise<void> {
  if (backupPassword.trim().length < 12) throw new VaultError('Ο κωδικός backup πρέπει να έχει τουλάχιστον 12 χαρακτήρες.');
  if (backup.size < 40 || backup.size > 2 * 1024 * 1024 * 1024) throw new VaultError('Το μέγεθος του αρχείου backup δεν είναι έγκυρο.');
  const existing = await storage.lista('.dps-vault');
  if (!(await vaultExists(storage)) && existing.ok && existing.timi.length > 0) {
    throw new VaultError('Η συσκευή περιέχει ήδη δεδομένα vault. Η επαναφορά επιτρέπεται μόνο σε καθαρή εγκατάσταση.');
  }
  if (!existing.ok || existing.timi.length > 0) throw new VaultError('Η επαναφορά επιτρέπεται μόνο σε κενή συσκευή.');

  const reader = new BackupStreamReader(backup.stream().getReader());
  const writtenPaths = new Set<string>();
  const writtenSecrets = new Set<(typeof BACKUP_SECRET_KEYS)[number]>();
  try {
    const prefix = await reader.readExact(24);
    if (prefix === null) {
      throw new VaultError('Το αρχείο δεν είναι έγκυρο DPS.guide encrypted backup.');
    }
    const magic = new TextDecoder().decode(prefix.subarray(0, 8));
    let backupVersion: 1 | 2;
    let kdfIterations: number;
    if (magic === BACKUP_MAGIC_V1) {
      backupVersion = 1;
      kdfIterations = LEGACY_KDF_ITERATIONS;
    } else if (magic === BACKUP_MAGIC_V2) {
      backupVersion = 2;
      const encodedIterations = await reader.readExact(4);
      if (encodedIterations === null) throw new VaultError('Το backup δεν περιέχει ρύθμιση κρυπτογράφησης.');
      kdfIterations = new DataView(encodedIterations.buffer, encodedIterations.byteOffset, encodedIterations.byteLength)
        .getUint32(0, false);
      if (!supportedKdfIterations(kdfIterations)) {
        throw new VaultError('Το backup χρησιμοποιεί μη υποστηριζόμενη ρύθμιση κρυπτογράφησης.');
      }
    } else {
      throw new VaultError('Το αρχείο δεν είναι έγκυρο DPS.guide encrypted backup.');
    }
    const wrappingKey = await deriveWrappingKey(backupPassword, prefix.subarray(8, 24), kdfIterations);
    const backupAadPrefix = `dps.backup.v${backupVersion}`;
    const files = new Set<string>();
    let hasHeader = false;
    const importedSecretKeys = new Set<string>();
    const parser = new BackupPlaintextReader(async (record) => {
      if (record.kind === 0) {
        if (!validateBackupPath(record.path) || files.has(record.path)) throw new VaultError('Το backup περιέχει άκυρη ή διπλή διαδρομή.');
        const saved = await storage.grapse_dyadiko(record.path, record.data);
        if (!saved.ok) throw new VaultError('Δεν ήταν δυνατή η εγγραφή των δεδομένων στο vault.');
        files.add(record.path);
        writtenPaths.add(record.path);
        if (record.path === HEADER_PATH) hasHeader = true;
        return;
      }

      const keyName = record.path.startsWith('secret:') ? record.path.slice('secret:'.length) : '';
      if (!(BACKUP_SECRET_KEYS as readonly string[]).includes(keyName) || importedSecretKeys.has(keyName) ||
          !validSecretEnvelope(new TextDecoder().decode(record.data))) {
        throw new VaultError('Το backup περιέχει μη έγκυρο κρυπτογραφημένο μυστικό.');
      }
      const key = keyName as (typeof BACKUP_SECRET_KEYS)[number];
      const value = new TextDecoder().decode(record.data);
      await secrets.vale(key, value);
      writtenSecrets.add(key);
      importedSecretKeys.add(keyName);
    });

    let index = 0;
    let hasFinal = false;
    while (!hasFinal) {
      const recordHeader = await reader.readExact(5);
      if (recordHeader === null) throw new VaultError('Το backup δεν έχει έγκυρο τέλος.');
      const kind = recordHeader[0];
      const length = new DataView(recordHeader.buffer, recordHeader.byteOffset, recordHeader.byteLength).getUint32(1, false);
      if ((kind !== 0 && kind !== 1) || length < 16 || length > BACKUP_CHUNK_BYTES + 16 || (kind === 1 && length !== 16)) {
        throw new VaultError('Το backup περιέχει μη έγκυρο κρυπτογραφημένο τμήμα.');
      }
      const iv = await reader.readExact(12);
      const ciphertext = await reader.readExact(length);
      if (iv === null || ciphertext === null) throw new VaultError('Το backup είναι κομμένο.');
      const aad = kind === 1 ? `${backupAadPrefix}/final/${index}` : `${backupAadPrefix}/chunk/${index}`;
      let clear: Uint8Array;
      try {
        clear = new Uint8Array(await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: asArrayBuffer(iv), additionalData: asArrayBuffer(new TextEncoder().encode(aad)) },
          wrappingKey,
          asArrayBuffer(ciphertext),
        ));
      } catch {
        throw new VaultError('Ο κωδικός backup δεν είναι σωστός ή το αρχείο αλλοιώθηκε.');
      }
      if (kind === 1) {
        if (clear.byteLength !== 0 || !parser.finished) throw new VaultError('Το backup δεν περιέχει πλήρη, αυθεντικοποιημένα δεδομένα.');
        hasFinal = true;
      } else {
        await parser.feed(clear);
        index += 1;
      }
    }
    if (await reader.hasTrailingBytes()) throw new VaultError('Το backup περιέχει δεδομένα μετά την τελική υπογραφή.');
    if (!hasHeader || !(await vaultExists(storage))) throw new VaultError('Το backup δεν περιέχει πλήρες vault.');
    await readHeader(storage);
  } catch (reason) {
    for (const path of writtenPaths) await storage.diagrafi(path);
    for (const key of writtenSecrets) await secrets.svise(key);
    throw reason instanceof VaultError ? reason : new VaultError('Δεν ήταν δυνατή η ανάγνωση του encrypted backup.');
  } finally {
    reader.release();
  }
}

/** ApothikiPyli που κρυπτογραφεί index, διαδρομές και περιεχόμενα με AES-256-GCM. */
export class EncryptedApothiki implements ApothikiPyli {
  constructor(private readonly storage: ApothikiPyli, private readonly dataKey: CryptoKey) {}

  private async loadIndex(): Promise<VaultIndex> {
    const stored = await this.storage.diavase_dyadiko(INDEX_PATH);
    if (!stored.ok) {
      if (stored.sfalma.kodikos === 'DEN_VRETHIKE') return { version: 1, files: {} };
      throw new VaultError('Δεν ήταν δυνατή η ανάγνωση του κρυπτογραφημένου καταλόγου.');
    }
    try {
      const clear = await decrypt(this.dataKey, this.decodeCipher(stored.timi), 'dps.vault.v1/index');
      const value: unknown = JSON.parse(new TextDecoder().decode(clear));
      if (typeof value === 'object' && value !== null && 'version' in value && value.version === 1 &&
          'files' in value && typeof value.files === 'object' && value.files !== null) {
        return value as VaultIndex;
      }
    } catch {
      throw new VaultError('Ο κρυπτογραφημένος κατάλογος είναι αλλοιωμένος.');
    }
    throw new VaultError('Ο κρυπτογραφημένος κατάλογος δεν έχει έγκυρη μορφή.');
  }

  private decodeCipher(bytes: Uint8Array): Ciphertext {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof parsed !== 'object' || parsed === null || !('iv' in parsed) || !('data' in parsed) ||
        typeof parsed.iv !== 'string' || typeof parsed.data !== 'string') {
      throw new VaultError('Μη έγκυρα κρυπτογραφημένα δεδομένα.');
    }
    return { iv: parsed.iv, data: parsed.data };
  }

  private async saveIndex(index: VaultIndex): Promise<boolean> {
    const cipher = await encrypt(this.dataKey, new TextEncoder().encode(JSON.stringify(index)), 'dps.vault.v1/index');
    const result = await this.storage.grapse_dyadiko(INDEX_PATH, new TextEncoder().encode(JSON.stringify(cipher)));
    return result.ok;
  }

  async diavase_keimeno(diadromi: string): Promise<Apotelesma<string>> {
    const result = await this.diavase_dyadiko(diadromi);
    return result.ok ? ok(new TextDecoder().decode(result.timi)) : result;
  }

  async grapse_keimeno(diadromi: string, periexomeno: string): Promise<Apotelesma<void>> {
    return this.grapse_dyadiko(diadromi, new TextEncoder().encode(periexomeno));
  }

  async diavase_dyadiko(diadromi: string): Promise<Apotelesma<Uint8Array>> {
    const path = normalizePath(diadromi);
    if (path === null) return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αποθήκευσης δεν είναι έγκυρη.');
    return withVaultStorageLock(async () => {
      try {
        const index = await this.loadIndex();
        const id = index.files[path];
        if (id === undefined) return apotyxia('DEN_VRETHIKE', 'Το κρυπτογραφημένο αρχείο δεν βρέθηκε.');
        const stored = await this.storage.diavase_dyadiko(`${OBJECTS_PATH}/${id}.enc`);
        if (!stored.ok) return apotyxia('DEN_VRETHIKE', 'Το κρυπτογραφημένο αρχείο δεν βρέθηκε.');
        const clear = await decrypt(this.dataKey, this.decodeCipher(stored.timi), `dps.vault.v1/file/${id}`);
        return ok(clear);
      } catch {
        return apotyxia('MI_EGKYRO_SXIMA', 'Δεν ήταν δυνατή η αποκρυπτογράφηση του αρχείου.');
      }
    });
  }

  async grapse_dyadiko(diadromi: string, dedomena: Uint8Array): Promise<Apotelesma<void>> {
    const path = normalizePath(diadromi);
    if (path === null) return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αποθήκευσης δεν είναι έγκυρη.');
    return withVaultStorageLock(async () => {
      try {
        const index = await this.loadIndex();
        const id = crypto.randomUUID();
        const cipher = await encrypt(this.dataKey, dedomena, `dps.vault.v1/file/${id}`);
        const encoded = new TextEncoder().encode(JSON.stringify(cipher));
        const stored = await this.storage.grapse_dyadiko(`${OBJECTS_PATH}/${id}.enc`, encoded);
        if (!stored.ok) return stored;
        const previousId = index.files[path];
        index.files[path] = id;
        if (!(await this.saveIndex(index))) {
          await this.storage.diagrafi(`${OBJECTS_PATH}/${id}.enc`);
          return apotyxia('AGNOSTO', 'Δεν ήταν δυνατή η ενημέρωση του κρυπτογραφημένου καταλόγου.');
        }
        if (previousId !== undefined) await this.storage.diagrafi(`${OBJECTS_PATH}/${previousId}.enc`);
        return ok(undefined);
      } catch {
        return apotyxia('AGNOSTO', 'Δεν ήταν δυνατή η κρυπτογράφηση και αποθήκευση του αρχείου.');
      }
    });
  }

  async yparxei(diadromi: string): Promise<boolean> {
    const path = normalizePath(diadromi);
    if (path === null) return false;
    return withVaultStorageLock(async () => {
      try { return (await this.loadIndex()).files[path] !== undefined; } catch { return false; }
    });
  }

  async lista(fakelos: string): Promise<Apotelesma<string[]>> {
    const prefix = fakelos === '.' || fakelos === '' ? '' : normalizePath(fakelos);
    if (prefix === null) return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή φακέλου δεν είναι έγκυρη.');
    return withVaultStorageLock(async () => {
      try {
        const files = Object.keys((await this.loadIndex()).files);
        return ok(files.filter((path) => prefix === '' || path.startsWith(`${prefix}/`)).sort());
      } catch {
        return apotyxia('MI_EGKYRO_SXIMA', 'Δεν ήταν δυνατή η ανάγνωση του κρυπτογραφημένου καταλόγου.');
      }
    });
  }

  async diagrafi(diadromi: string): Promise<Apotelesma<void>> {
    const path = normalizePath(diadromi);
    if (path === null) return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή αποθήκευσης δεν είναι έγκυρη.');
    return withVaultStorageLock(async () => {
      try {
        const index = await this.loadIndex();
        const id = index.files[path];
        if (id === undefined) return apotyxia('DEN_VRETHIKE', 'Το αρχείο δεν υπάρχει.');
        delete index.files[path];
        if (!(await this.saveIndex(index))) return apotyxia('AGNOSTO', 'Δεν ήταν δυνατή η ενημέρωση του vault.');
        await this.storage.diagrafi(`${OBJECTS_PATH}/${id}.enc`);
        return ok(undefined);
      } catch {
        return apotyxia('AGNOSTO', 'Δεν ήταν δυνατή η διαγραφή του αρχείου από το vault.');
      }
    });
  }
}

/** Credentials remain in the platform secure store, with the vault data key encrypting each value. */
export class EncryptedMystikaPyli implements MystikaPyli {
  constructor(private readonly secureStorage: MystikaPyli, private readonly dataKey: CryptoKey) {}

  async pare(key: KleidiMystikou): Promise<string | null> {
    const stored = await this.secureStorage.pare(key);
    if (stored === null) return null;
    try {
      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== 'object' || parsed === null || !('iv' in parsed) || !('data' in parsed) ||
          typeof parsed.iv !== 'string' || typeof parsed.data !== 'string') return null;
      const clear = await decrypt(this.dataKey, { iv: parsed.iv, data: parsed.data }, `dps.vault.v1/secret/${key}`);
      return new TextDecoder().decode(clear);
    } catch {
      return null;
    }
  }

  async vale(key: KleidiMystikou, value: string): Promise<void> {
    const cipher = await encrypt(this.dataKey, new TextEncoder().encode(value), `dps.vault.v1/secret/${key}`);
    await this.secureStorage.vale(key, JSON.stringify(cipher));
  }

  async svise(key: KleidiMystikou): Promise<void> {
    await this.secureStorage.svise(key);
  }
}

/** Browser-only backing store for encrypted secret envelopes; native uses Keychain/Keystore. */
export class ApothikiMystikaPyli implements MystikaPyli {
  constructor(private readonly storage: ApothikiPyli) {}

  async pare(key: KleidiMystikou): Promise<string | null> {
    const result = await this.storage.diavase_keimeno(`.dps-vault/secrets/${key}`);
    return result.ok ? result.timi : null;
  }

  async vale(key: KleidiMystikou, value: string): Promise<void> {
    const result = await this.storage.grapse_keimeno(`.dps-vault/secrets/${key}`, value);
    if (!result.ok) throw new VaultError('Δεν ήταν δυνατή η αποθήκευση του κλειδιού στη συσκευή.');
  }

  async svise(key: KleidiMystikou): Promise<void> {
    const result = await this.storage.diagrafi(`.dps-vault/secrets/${key}`);
    if (!result.ok && result.sfalma.kodikos !== 'DEN_VRETHIKE') {
      throw new VaultError('Δεν ήταν δυνατή η διαγραφή του κλειδιού από τη συσκευή.');
    }
  }
}
