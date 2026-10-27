/**
 * Peer-to-Peer Encrypted Study Decks (Ανταλλαγή Κρυπτογραφημένων Πακέτων Καρτών).
 *
 * 100% pure TypeScript module (50/50 boundary).
 * Κρυπτογράφηση AES-256-GCM, PBKDF2 key derivation (SHA-256), SHA-256 checksum ακεραιότητας
 * και εξαγωγή/εισαγωγή σε ενιαίο Base64 string payload.
 */

/** Μοναδική κάρτα μελέτης εντός πακέτου. */
export interface KartaPaketou {
  readonly id?: string;
  readonly erwtisi: string;
  readonly apantisi: string;
  readonly lexeisKleidia?: readonly string[];
  readonly ennoia?: string;
  readonly diskolia?: number;
}

/** Πλήρες πακέτο καρτών μελέτης. */
export interface PaketoKartonPayload {
  readonly id: string;
  readonly titlos: string;
  readonly perigrafi?: string;
  readonly mathima_id?: string;
  readonly dimiourgos?: string;
  readonly dimiourgithike: string;
  readonly kartes: readonly KartaPaketou[];
  readonly ekdosi?: number;
}

/** Δομή κρυπτογραφημένου φακέλου ανταλλαγής. */
export interface KryptografimenoPaketo {
  readonly ekdosi: number;
  readonly algarithmos: 'AES-256-GCM';
  readonly kdf: 'PBKDF2-SHA256';
  readonly epanalipseisKdf: number;
  readonly salt: string;
  readonly iv: string;
  readonly dedomena: string;
  readonly checksum: string;
}

/** Αριθμός επαναλήψεων PBKDF2 (OWASP recommended standard). */
export const PROEPILOGI_EPANALIPSEWN_PBKDF2 = 100_000;

/** Πρόσθετα δεδομένα επικύρωσης AES-GCM (Additional Authenticated Data). */
const AAD_IDENTIFIER = 'DPS-DECK-v1';

/** Μετατρέπει Uint8Array σε Base64 συμβολοσειρά με ασφάλεια. */
function bytesSeBase64(bytes: Uint8Array): string {
  let bin = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

/** Μετατρέπει Base64 συμβολοσειρά σε Uint8Array. */
function base64SeBytes(b64: string): Uint8Array {
  const bin = atob(b64.trim());
  const res = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    res[i] = bin.charCodeAt(i);
  }
  return res;
}

/** Παράγει κλειδί AES-GCM 256-bit από μυστικό κλειδί μέσω PBKDF2. */
async function parageKleidi(kleidi: string, salt: Uint8Array, epanalipseis: number): Promise<CryptoKey> {
  const kleidiBytes = new TextEncoder().encode(kleidi);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    kleidiBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: epanalipseis,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Υπολογίζει το SHA-256 checksum σε δεκαεξαδική μορφή (hex). */
async function ypologiseSha256Checksum(dedomena: Uint8Array): Promise<string> {
  const hashBuf = await crypto.subtle.digest('SHA-256', dedomena as unknown as BufferSource);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Επικυρώνει τη δομή και τους τύπους δεδομένων ενός αποκρυπτογραφημένου αντικειμένου. */
export function epikyrosi_paketou(obj: unknown): asserts obj is PaketoKartonPayload {
  if (!obj || typeof obj !== 'object') {
    throw new Error('Μη έγκυρο πακέτο: τα δεδομένα δεν αποτελούν αντικείμενο.');
  }

  const p = obj as Record<string, unknown>;

  if (typeof p.id !== 'string' || !p.id.trim()) {
    throw new Error('Μη έγκυρο πακέτο: λείπει έγκυρο αλφαριθμητικό id.');
  }

  if (typeof p.titlos !== 'string' || !p.titlos.trim()) {
    throw new Error('Μη έγκυρο πακέτο: λείπει έγκυρος τίτλος.');
  }

  if (!Array.isArray(p.kartes)) {
    throw new Error('Μη έγκυρο πακέτο: το πεδίο kartes πρέπει να είναι πίνακας.');
  }

  for (let i = 0; i < p.kartes.length; i++) {
    const k = p.kartes[i];
    if (!k || typeof k !== 'object') {
      throw new Error(`Μη έγκυρη κάρτα στη θέση ${i}: δεν είναι αντικείμενο.`);
    }
    const karta = k as Record<string, unknown>;
    if (typeof karta.erwtisi !== 'string' || !karta.erwtisi.trim()) {
      throw new Error(`Μη έγκυρη κάρτα στη θέση ${i}: λείπει έγκυρη ερώτηση.`);
    }
    if (typeof karta.apantisi !== 'string') {
      throw new Error(`Μη έγκυρη κάρτα στη θέση ${i}: λείπει έγκυρη απάντηση.`);
    }
  }
}

/**
 * Κρυπτογραφεί ένα πακέτο καρτών μελέτης με AES-256-GCM και PBKDF2 derivation.
 *
 * @param paketo Το πακέτο καρτών προς εξαγωγή
 * @param kleidi Το μυστικό κλειδί/κωδικός προστασίας
 * @returns Μία ενιαία Base64 συμβολοσειρά έτοιμη για διαμοιρασμό (QR, clipboard, αρχείο)
 */
export async function exagwgi_kryptografimenou_paketou(
  paketo: PaketoKartonPayload,
  kleidi: string
): Promise<string> {
  if (!kleidi || kleidi.trim().length === 0) {
    throw new Error('Απαιτείται μη κενό μυστικό κλειδί κρυπτογράφησης.');
  }

  epikyrosi_paketou(paketo);

  const plaintextJson = JSON.stringify(paketo);
  const plaintextBytes = new TextEncoder().encode(plaintextJson);

  // Υπολογισμός SHA-256 checksum
  const checksum = await ypologiseSha256Checksum(plaintextBytes);

  // Δημιουργία τυχαίων salt (16 bytes) και IV (12 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Παραγωγή κλειδιού AES-256-GCM
  const derivedKey = await parageKleidi(kleidi, salt, PROEPILOGI_EPANALIPSEWN_PBKDF2);

  // Κρυπτογράφηση
  const aadBytes = new TextEncoder().encode(AAD_IDENTIFIER);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
      additionalData: aadBytes as unknown as BufferSource,
    },
    derivedKey,
    plaintextBytes as unknown as BufferSource
  );

  const ciphertextBytes = new Uint8Array(ciphertextBuffer);

  const kryptografimenoPaketo: KryptografimenoPaketo = {
    ekdosi: 1,
    algarithmos: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    epanalipseisKdf: PROEPILOGI_EPANALIPSEWN_PBKDF2,
    salt: bytesSeBase64(salt),
    iv: bytesSeBase64(iv),
    dedomena: bytesSeBase64(ciphertextBytes),
    checksum,
  };

  const fakelosJson = JSON.stringify(kryptografimenoPaketo);
  const fakelosBytes = new TextEncoder().encode(fakelosJson);

  return bytesSeBase64(fakelosBytes);
}

/**
 * Αποκρυπτογραφεί και επικυρώνει ένα κωδικοποιημένο πακέτο καρτών.
 *
 * @param encodedStr Το Base64 encoded πακέτο
 * @param kleidi Το μυστικό κλειδί αποκρυπτογράφησης
 * @returns Το αποκρυπτογραφημένο και επικυρωμένο PaketoKartonPayload
 */
export async function eisagwgi_kryptografimenou_paketou(
  encodedStr: string,
  kleidi: string
): Promise<PaketoKartonPayload> {
  if (!encodedStr || encodedStr.trim().length === 0) {
    throw new Error('Το παρεχόμενο κρυπτογραφημένο πακέτο είναι κενό.');
  }

  if (!kleidi || kleidi.trim().length === 0) {
    throw new Error('Απαιτείται μη κενό μυστικό κλειδί αποκρυπτογράφησης.');
  }

  let paketoEnc: KryptografimenoPaketo;
  try {
    const fakelosBytes = base64SeBytes(encodedStr);
    const fakelosJson = new TextDecoder().decode(fakelosBytes);
    paketoEnc = JSON.parse(fakelosJson) as KryptografimenoPaketo;
  } catch {
    throw new Error('Μη έγκυρη μορφή πακέτου: αδυναμία ανάγνωσης κωδικοποιημένων δεδομένων.');
  }

  if (
    !paketoEnc ||
    paketoEnc.algarithmos !== 'AES-256-GCM' ||
    !paketoEnc.salt ||
    !paketoEnc.iv ||
    !paketoEnc.dedomena ||
    !paketoEnc.checksum
  ) {
    throw new Error('Μη έγκυρη μορφή φακέλου κρυπτογράφησης.');
  }

  const saltBytes = base64SeBytes(paketoEnc.salt);
  const ivBytes = base64SeBytes(paketoEnc.iv);
  const ciphertextBytes = base64SeBytes(paketoEnc.dedomena);
  const epanalipseis = paketoEnc.epanalipseisKdf ?? PROEPILOGI_EPANALIPSEWN_PBKDF2;

  // Παραγωγή κλειδιού
  const derivedKey = await parageKleidi(kleidi, saltBytes, epanalipseis);

  let decryptedBuffer: ArrayBuffer;
  try {
    const aadBytes = new TextEncoder().encode(AAD_IDENTIFIER);
    decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes as unknown as BufferSource,
        additionalData: aadBytes as unknown as BufferSource,
      },
      derivedKey,
      ciphertextBytes as unknown as BufferSource
    );
  } catch {
    throw new Error('Αποτυχία αποκρυπτογράφησης: λανθασμένο κλειδί ή κατεστραμμένα δεδομένα.');
  }

  const decryptedBytes = new Uint8Array(decryptedBuffer);

  // Επαλήθευση ακεραιότητας μέσω SHA-256 checksum
  const ypologismenoChecksum = await ypologiseSha256Checksum(decryptedBytes);
  if (ypologismenoChecksum !== paketoEnc.checksum) {
    throw new Error('Αποτυχία επαλήθευσης checksum: το πακέτο έχει αλλοιωθεί.');
  }

  const plaintextJson = new TextDecoder().decode(decryptedBytes);
  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(plaintextJson);
  } catch {
    throw new Error('Μη έγκυρη μορφή JSON στα αποκρυπτογραφημένα δεδομένα.');
  }

  // Επικύρωση τύπων
  epikyrosi_paketou(parsedPayload);

  return parsedPayload;
}
