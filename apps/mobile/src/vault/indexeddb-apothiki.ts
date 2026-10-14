import type { ApothikiPyli, Apotelesma } from '@dps/core';
import { apotyxia, ok } from '@dps/core';

const DATABASE = 'dps-guide-device-vault';
const STORE = 'files';
const VERSION = 1;

interface EggrafiArxeiou {
  readonly path: string;
  readonly bytes: ArrayBuffer;
}

function cleanPath(path: string): string | null {
  const parts = path.replace(/\\/g, '/').split('/').filter((part) => part !== '' && part !== '.');
  if (parts.length === 0 || parts.some((part) => part === '..' || part.includes('\0'))) return null;
  return parts.join('/');
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  });
}

/** Browser storage for a single device/profile. The encrypted vault wraps this adapter. */
export class IndexedDbApothiki implements ApothikiPyli {
  private database: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is unavailable'));
    this.database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE, { keyPath: 'path' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
      request.onblocked = () => reject(new Error('IndexedDB is blocked by another tab'));
    });
    return this.database;
  }

  async diavase_keimeno(path: string): Promise<Apotelesma<string>> {
    const bytes = await this.diavase_dyadiko(path);
    return bytes.ok ? ok(new TextDecoder().decode(bytes.timi)) : bytes;
  }

  async grapse_keimeno(path: string, value: string): Promise<Apotelesma<void>> {
    return this.grapse_dyadiko(path, new TextEncoder().encode(value));
  }

  async diavase_dyadiko(path: string): Promise<Apotelesma<Uint8Array>> {
    const normalized = cleanPath(path);
    if (normalized === null) return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή IndexedDB δεν είναι έγκυρη.');
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE, 'readonly');
      const done = transactionDone(transaction);
      const record = await requestResult(transaction.objectStore(STORE).get(normalized)) as EggrafiArxeiou | undefined;
      await done;
      return record ? ok(new Uint8Array(record.bytes)) : apotyxia('DEN_VRETHIKE', 'Το αρχείο δεν βρέθηκε.');
    } catch {
      return apotyxia('AGNOSTO', 'Δεν ήταν δυνατή η ανάγνωση της τοπικής αποθήκευσης.');
    }
  }

  async grapse_dyadiko(path: string, bytes: Uint8Array): Promise<Apotelesma<void>> {
    const normalized = cleanPath(path);
    if (normalized === null) return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή IndexedDB δεν είναι έγκυρη.');
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE, 'readwrite');
      const done = transactionDone(transaction);
      const copy = bytes.slice();
      transaction.objectStore(STORE).put({ path: normalized, bytes: copy.buffer });
      await done;
      return ok(undefined);
    } catch {
      return apotyxia('AGNOSTO', 'Δεν ήταν δυνατή η αποθήκευση στην τοπική βάση.');
    }
  }

  async yparxei(path: string): Promise<boolean> {
    const normalized = cleanPath(path);
    if (normalized === null) return false;
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE, 'readonly');
      const done = transactionDone(transaction);
      const record = await requestResult(transaction.objectStore(STORE).getKey(normalized));
      await done;
      return record !== undefined;
    } catch {
      return false;
    }
  }

  async lista(folder: string): Promise<Apotelesma<string[]>> {
    const normalized = folder === '.' || folder === '' ? '' : cleanPath(folder);
    if (normalized === null) return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή φακέλου δεν είναι έγκυρη.');
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE, 'readonly');
      const done = transactionDone(transaction);
      const keys = await requestResult(transaction.objectStore(STORE).getAllKeys());
      await done;
      return ok(keys.map(String).filter((path) => normalized === '' || path.startsWith(`${normalized}/`)).sort());
    } catch {
      return apotyxia('AGNOSTO', 'Δεν ήταν δυνατή η ανάγνωση των τοπικών αρχείων.');
    }
  }

  async diagrafi(path: string): Promise<Apotelesma<void>> {
    const normalized = cleanPath(path);
    if (normalized === null) return apotyxia('MI_EGKYRO_SXIMA', 'Η διαδρομή IndexedDB δεν είναι έγκυρη.');
    try {
      const db = await this.open();
      const transaction = db.transaction(STORE, 'readwrite');
      const done = transactionDone(transaction);
      const store = transaction.objectStore(STORE);
      const previous = await requestResult(store.getKey(normalized));
      if (previous === undefined) {
        transaction.abort();
        return apotyxia('DEN_VRETHIKE', 'Το αρχείο δεν υπάρχει.');
      }
      store.delete(normalized);
      await done;
      return ok(undefined);
    } catch {
      return apotyxia('AGNOSTO', 'Δεν ήταν δυνατή η διαγραφή από την τοπική βάση.');
    }
  }
}
