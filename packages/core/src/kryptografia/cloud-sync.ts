/**
 * Προδιαγραφή Zero-Knowledge Cloud Backup Sync Spec (cloud-sync.ts).
 *
 * Παρέχει κρυπτογράφηση AES-GCM-256 client-side με PBKDF2 derivation,
 * εξασφαλίζοντας ότι ο cloud provider δεν έχει ποτέ πρόσβαση στα περιεχόμενα του vault,
 * καθώς και ντετερμινιστική επίλυση συγκρούσεων (conflict resolution).
 */

export interface DpsSyncManifest {
  readonly schemaEkdosi: number;
  readonly ekdosiPaketou: number;
  readonly xronosSimioIso: string;
  readonly hashDedomenon: string;
  readonly systimaDeviceId: string;
  readonly megethosBytes?: number;
}

export interface DpsSyncPackage {
  readonly manifest: DpsSyncManifest;
  readonly encryptedPayload: string; // Base64
  readonly iv: string;               // Base64
  readonly salt: string;             // Base64
  readonly algorithmos: 'AES-GCM-256';
}

export type ApotelesmaSygkrousis =
  | 'topiko_neotero'
  | 'apomakrysmeno_neotero'
  | 'sygkrousi'
  | 'idies_ekdoseis';

const PBKDF2_ITERATIONS = 100_000;

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    const b = bytes[i];
    if (b !== undefined) {
      binary += String.fromCharCode(b);
    }
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < byteArray.length; i++) {
    const b = byteArray[i];
    if (b !== undefined) {
      hex += b.toString(16).padStart(2, '0');
    }
  }
  return hex;
}

async function deriveAesKey(kleidi: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(kleidi),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function ypologise_sha256(keimeno: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await globalThis.crypto.subtle.digest('SHA-256', enc.encode(keimeno));
  return bufferToHex(digest);
}

/**
 * Υπολογίζει την κανονική μορφή Additional Authenticated Data (AAD) από το manifest.
 */
export function ypologise_kanoniko_aad(manifest: DpsSyncManifest): Uint8Array {
  const kanoniko = JSON.stringify({
    schemaEkdosi: manifest.schemaEkdosi,
    ekdosiPaketou: manifest.ekdosiPaketou,
    xronosSimioIso: manifest.xronosSimioIso,
    hashDedomenon: manifest.hashDedomenon,
    systimaDeviceId: manifest.systimaDeviceId,
    ...(manifest.megethosBytes !== undefined ? { megethosBytes: manifest.megethosBytes } : {}),
  });
  return new TextEncoder().encode(`dps.sync.v1/manifest:${kanoniko}`);
}

/**
 * Δημιουργεί ένα Zero-Knowledge κρυπτογραφημένο πακέτο συγχρονισμού.
 *
 * @param dedomenaVault Το σειριοποιημένο JSON κείμενο του vault.
 * @param kleidi Ο προσωπικός κωδικός/κλειδί κρυπτογράφησης του χρήστη.
 * @param ekdosi Ο μονοτονικά αυξανόμενος αριθμός έκδοσης του πακέτου.
 * @param xronosToraIso Προαιρετικό ISO timestamp (για ντετερμινισμό και tests).
 */
export async function dimiourgia_sync_paketou(
  dedomenaVault: string,
  kleidi: string,
  ekdosi: number,
  xronosToraIso: string = new Date().toISOString()
): Promise<DpsSyncPackage> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await deriveAesKey(kleidi, salt);
  const enc = new TextEncoder();
  const clearBytes = enc.encode(dedomenaVault);

  const hashDedomenon = await ypologise_sha256(dedomenaVault);
  const megethosBytes = clearBytes.byteLength + 16;

  const manifest: DpsSyncManifest = {
    schemaEkdosi: 1,
    ekdosiPaketou: ekdosi,
    xronosSimioIso: xronosToraIso,
    hashDedomenon,
    systimaDeviceId: 'dps-core-client',
    megethosBytes,
  };

  const aad = ypologise_kanoniko_aad(manifest);

  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      additionalData: aad as unknown as BufferSource,
    },
    aesKey,
    clearBytes
  );

  return {
    manifest,
    encryptedPayload: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
    iv: uint8ArrayToBase64(iv),
    salt: uint8ArrayToBase64(salt),
    algorithmos: 'AES-GCM-256',
  };
}

/**
 * Αποκρυπτογραφεί ένα Zero-Knowledge πακέτο συγχρονισμού και επαληθεύει την ακεραιότητά του.
 */
export async function apokryptografisi_sync_paketou(
  paketo: DpsSyncPackage,
  kleidi: string
): Promise<string> {
  const salt = base64ToUint8Array(paketo.salt);
  const iv = base64ToUint8Array(paketo.iv);
  const encryptedBytes = base64ToUint8Array(paketo.encryptedPayload);

  const aesKey = await deriveAesKey(kleidi, salt);
  const aad = ypologise_kanoniko_aad(paketo.manifest);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await globalThis.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
        additionalData: aad as unknown as BufferSource,
      },
      aesKey,
      encryptedBytes as unknown as BufferSource
    );
  } catch {
    throw new Error('Αποτυχία επαλήθευσης ακεραιότητας ή αυθεντικοποίησης: Το πακέτο έχει αλλοιωθεί ή το κλειδί είναι εσφαλμένο.');
  }

  const dec = new TextDecoder();
  const dedomena = dec.decode(decryptedBuffer);

  const ipologismenoHash = await ypologise_sha256(dedomena);
  if (ipologismenoHash !== paketo.manifest.hashDedomenon) {
    throw new Error('Αποτυχία επαλήθευσης ακεραιότητας: Το SHA-256 hash δεν ταυτίζεται με το manifest.');
  }

  return dedomena;
}

/**
 * Συγκρίνει δύο manifests συγχρονισμού (τοπικό vs απομακρυσμένο) και επιλύει τυχόν συγκρούσεις.
 */
export function epalithefsi_kai_epilysi_sygkrouseon(
  topiko: DpsSyncManifest,
  apomakrysmeno: DpsSyncManifest
): ApotelesmaSygkrousis {
  // 1. Πανομοιότυπη έκδοση και δεδομένα
  if (
    topiko.ekdosiPaketou === apomakrysmeno.ekdosiPaketou &&
    topiko.hashDedomenon === apomakrysmeno.hashDedomenon
  ) {
    return 'idies_ekdoseis';
  }

  // 2. Ίδια έκδοση αλλά διαφορετικά δεδομένα -> σύγκρουση
  if (topiko.ekdosiPaketou === apomakrysmeno.ekdosiPaketou) {
    return 'sygkrousi';
  }

  const topikoXronos = new Date(topiko.xronosSimioIso).getTime();
  const apomakrysmenoXronos = new Date(apomakrysmeno.xronosSimioIso).getTime();

  // 3. Τοπικό έχει μεγαλύτερη έκδοση
  if (topiko.ekdosiPaketou > apomakrysmeno.ekdosiPaketou) {
    if (topikoXronos >= apomakrysmenoXronos) {
      return 'topiko_neotero';
    }
    // Χρονική ανακολουθία
    return 'sygkrousi';
  }

  // 4. Απομακρυσμένο έχει μεγαλύτερη έκδοση (η μοναδική περίπτωση που φτάνει εδώ)
  else {
    if (apomakrysmenoXronos >= topikoXronos) {
      return 'apomakrysmeno_neotero';
    }
    // Χρονική ανακολουθία
    return 'sygkrousi';
  }
}
