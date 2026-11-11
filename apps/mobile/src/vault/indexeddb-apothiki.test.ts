// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { IndexedDbApothiki } from './indexeddb-apothiki.js';

/** Κεντρική μνήμη: `db -> store -> key -> item`. */
const fakeStorage: Record<string, Record<string, unknown>> = {};
/** Ενεργοποιεί σφάλματα σε συναλλαγές (πρόσβαση σε `transaction.error`). */
let transactionErrors = false;
/** Εναλλακτικά: το `onerror` τρέχει με `transaction.error` null. */
let transactionErrorNull = false;
/** Λειτουργία σφάλματος στα objectStore requests (`get`, `getKey`, `getAllKeys`). */
let objectStoreErrorMode: 'none' | 'with-error' | 'without-error' = 'none';
/** Λειτουργία σφάλματος στο `indexedDB.open` (`request.error`). */
let openErrorMode: 'none' | 'with-error' | 'without-error' = 'none';
/** Ενεργοποιεί το `request.onblocked` (κλειδωμένη βάση από άλλο tab). */
let openBlockedMode = false;

/** Πλαστή `indexedDB` — όλα τα requests ολοκληρώνονται σε queueMicrotask. */
function fakeIndexedDb(): Record<string, unknown> {
  return {
    open(name: string, version: number) {
      const db = fakeStorage[name] ?? (fakeStorage[name] = { stores: new Set<string>(), data: {} });
      const request: Record<string, unknown> = { error: null };
      request.result = {
        name,
        version,
        objectStoreNames: { contains: (storeName: string) => db.stores.has(storeName) },
        createObjectStore(storeName: string) {
          db.stores.add(storeName);
          db.data[storeName] = new Map();
          return {};
        },
        transaction(storeName: string, mode: string) {
          const tx: Record<string, unknown> = {
            error: null,
            oncomplete: null,
            onabort: null,
            onerror: null,
            objectStore(storeName: string) {
              return fakeObjectStore(db, storeName);
            },
            abort() {
              tx.error = null;
              tx.onabort?.({});
            },
          };
          queueMicrotask(() => {
            if (transactionErrors) {
              tx.error = new Error('IndexedDB transaction failed');
              tx.onerror?.({});
            } else if (transactionErrorNull) {
              tx.onerror?.({});
            }
            tx.oncomplete?.({});
          });
          return tx;
        },
      };
      request.onsuccess = () => {};
      request.onerror = () => {};
      request.onblocked = () => {};
      request.onupgradeneeded = () => {};
      queueMicrotask(() => {
        request.onupgradeneeded?.({});
        if (openErrorMode !== 'none') {
          request.error = openErrorMode === 'with-error' ? new Error('IndexedDB open failed') : null;
          request.onerror?.({});
        } else if (openBlockedMode) {
          request.onblocked?.({});
        } else {
          request.onsuccess?.({});
        }
      });
      return request;
    },
  };
}

/** Πλαστό `objectStore` με κεντρική μνήμη. */
function fakeObjectStore(db: Record<string, unknown>, store: string): Record<string, unknown> {
  const map = (db.data[store] ?? (db.data[store] = new Map())) as Map<string, unknown>;
  return {
    get(key: string) {
      const r: Record<string, unknown> = {};
      r.result = map.get(key);
      r.onsuccess = () => {};
      r.onerror = () => {};
      r.error = null;
      queueMicrotask(() => {
        if (objectStoreErrorMode === 'none') {
          r.onsuccess?.({});
        } else {
          r.error = objectStoreErrorMode === 'with-error' ? new Error('IndexedDB request failed') : null;
          r.onerror?.({});
        }
      });
      return r;
    },
    put(item: unknown) {
      const r: Record<string, unknown> = {};
      const data = item as Record<string, unknown>;
      map.set(data.path, item);
      r.result = undefined;
      r.onsuccess = () => {};
      r.onerror = () => {};
      queueMicrotask(() => {
        r.onsuccess?.({});
      });
      return r;
    },
    delete(key: string) {
      const r: Record<string, unknown> = {};
      map.delete(key);
      r.result = undefined;
      r.onsuccess = () => {};
      r.onerror = () => {};
      queueMicrotask(() => {
        r.onsuccess?.({});
      });
      return r;
    },
    getKey(key: string) {
      const r: Record<string, unknown> = {};
      r.result = map.has(key) ? key : undefined;
      r.onsuccess = () => {};
      r.onerror = () => {};
      r.error = null;
      queueMicrotask(() => {
        if (objectStoreErrorMode === 'none') {
          r.onsuccess?.({});
        } else {
          r.error = objectStoreErrorMode === 'with-error' ? new Error('IndexedDB request failed') : null;
          r.onerror?.({});
        }
      });
      return r;
    },
    getAllKeys() {
      const r: Record<string, unknown> = {};
      r.result = Array.from(map.keys());
      r.onsuccess = () => {};
      r.onerror = () => {};
      r.error = null;
      queueMicrotask(() => {
        if (objectStoreErrorMode === 'none') {
          r.onsuccess?.({});
        } else {
          r.error = objectStoreErrorMode === 'with-error' ? new Error('IndexedDB request failed') : null;
          r.onerror?.({});
        }
      });
      return r;
    },
  };
}

describe('IndexedDbApothiki', () => {
  beforeAll(() => {
    vi.stubGlobal('indexedDB', fakeIndexedDb());
  });

  afterEach(() => {
    transactionErrors = false;
    transactionErrorNull = false;
    objectStoreErrorMode = 'none';
    openErrorMode = 'none';
    openBlockedMode = false;
    for (const db of Object.values(fakeStorage)) {
      for (const store of Object.values(db.data)) {
        store.clear();
      }
    }
  });

  it('αποθηκεύει και διαβάζει κείμενο', async () => {
    const apothiki = new IndexedDbApothiki();
    await apothiki.grapse_keimeno('test/arxeio.txt', 'καλώς');
    const read = await apothiki.diavase_keimeno('test/arxeio.txt');
    expect(read.ok).toBe(true);
    if (read.ok) expect(read.timi).toBe('καλώς');
  });

  it('δεν βρίσκει αρχείο που δεν υπάρχει', async () => {
    const apothiki = new IndexedDbApothiki();
    const read = await apothiki.diavase_keimeno('missing.txt');
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('ελέγχει αν υπάρχει διαδρομή', async () => {
    const apothiki = new IndexedDbApothiki();
    await apothiki.grapse_keimeno('test/arxeio.txt', 'καλώς');
    expect(await apothiki.yparxei('test/arxeio.txt')).toBe(true);
    expect(await apothiki.yparxei('missing.txt')).toBe(false);
  });

  it('μετράει τα αρχεία ενός φακέλου', async () => {
    const apothiki = new IndexedDbApothiki();
    await apothiki.grapse_keimeno('test/a.txt', 'α');
    await apothiki.grapse_keimeno('test/b.txt', 'β');
    const list = await apothiki.lista('test');
    expect(list.ok).toBe(true);
    if (list.ok) expect(list.timi).toEqual(['test/a.txt', 'test/b.txt']);
    const listAll = await apothiki.lista('.');
    expect(listAll.ok).toBe(true);
    if (listAll.ok) expect(listAll.timi.length).toBe(2);
  });

  it('διαγράφει ένα αρχείο', async () => {
    const apothiki = new IndexedDbApothiki();
    await apothiki.grapse_keimeno('test/a.txt', 'α');
    const deleted = await apothiki.diagrafi('test/a.txt');
    expect(deleted.ok).toBe(true);
    const missing = await apothiki.diagrafi('test/a.txt');
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.sfalma.kodikos).toBe('DEN_VRETHIKE');
  });

  it('αρνείται μη έγκυρη διαδρομή', async () => {
    const apothiki = new IndexedDbApothiki();
    const bad = await apothiki.diavase_keimeno('../malicious');
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    expect(await apothiki.yparxei('../malicious')).toBe(false);
    const badList = await apothiki.lista('../malicious');
    expect(badList.ok).toBe(false);
    if (!badList.ok) expect(badList.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    const badDel = await apothiki.diagrafi('../malicious');
    expect(badDel.ok).toBe(false);
    if (!badDel.ok) expect(badDel.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('απορρίπτει λάθος διαδρομή και στο put', async () => {
    const apothiki = new IndexedDbApothiki();
    const write = await apothiki.grapse_keimeno('../malicious', 'α');
    expect(write.ok).toBe(false);
    if (!write.ok) expect(write.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    const bytes = await apothiki.diavase_dyadiko('../malicious');
    expect(bytes.ok).toBe(false);
    if (!bytes.ok) expect(bytes.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
    const dyadiko = await apothiki.grapse_dyadiko('../malicious', new Uint8Array());
    expect(dyadiko.ok).toBe(false);
    if (!dyadiko.ok) expect(dyadiko.sfalma.kodikos).toBe('MI_EGKYRO_SXIMA');
  });

  it('απορρίπτει την IndexedDB όταν λείπει', async () => {
    const original = globalThis.indexedDB;
    vi.stubGlobal('indexedDB', undefined);
    try {
      const apothiki = new IndexedDbApothiki();
      const read = await apothiki.diavase_keimeno('test/arxeio.txt');
      expect(read.ok).toBe(false);
      if (!read.ok) expect(read.sfalma.kodikos).toBe('AGNOSTO');
      expect(await apothiki.yparxei('test/arxeio.txt')).toBe(false);
    } finally {
      vi.stubGlobal('indexedDB', original);
    }
  });

  it('καλύπτει το onerror της συναλλαγής με λάθος', async () => {
    transactionErrors = true;
    const apothiki = new IndexedDbApothiki();
    await apothiki.grapse_keimeno('test/x.txt', 'α');
    const read = await apothiki.diavase_keimeno('test/x.txt');
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('καλύπτει το onerror της συναλλαγής χωρίς λάθος', async () => {
    transactionErrorNull = true;
    const apothiki = new IndexedDbApothiki();
    const read = await apothiki.diavase_keimeno('test/x.txt');
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('καλύπτει το onerror του request με λάθος', async () => {
    objectStoreErrorMode = 'with-error';
    const apothiki = new IndexedDbApothiki();
    const read = await apothiki.diavase_keimeno('test/x.txt');
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('καλύπτει το onerror του request χωρίς λάθος', async () => {
    objectStoreErrorMode = 'without-error';
    const apothiki = new IndexedDbApothiki();
    const read = await apothiki.diavase_keimeno('test/x.txt');
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('καλύπτει το onerror του open με λάθος', async () => {
    openErrorMode = 'with-error';
    const apothiki = new IndexedDbApothiki();
    const read = await apothiki.diavase_keimeno('test/x.txt');
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('καλύπτει το onerror του open χωρίς λάθος', async () => {
    openErrorMode = 'without-error';
    const apothiki = new IndexedDbApothiki();
    const read = await apothiki.diavase_keimeno('test/x.txt');
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('δεν επαναφέρει το objectStore όταν υπάρχει', async () => {
    const πρώτο = new IndexedDbApothiki();
    await πρώτο.grapse_keimeno('test/arxeio.txt', 'καλώς');
    const δεύτερο = new IndexedDbApothiki();
    const read = await δεύτερο.diavase_keimeno('test/arxeio.txt');
    expect(read.ok).toBe(true);
    if (read.ok) expect(read.timi).toBe('καλώς');
  });

  it('καλύπτει το onblocked όταν κλειδώνεται η βάση', async () => {
    openBlockedMode = true;
    const apothiki = new IndexedDbApothiki();
    const read = await apothiki.diavase_keimeno('test/x.txt');
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('καλύπτει το catch της lista', async () => {
    transactionErrors = true;
    const apothiki = new IndexedDbApothiki();
    const list = await apothiki.lista('.');
    expect(list.ok).toBe(false);
    if (!list.ok) expect(list.sfalma.kodikos).toBe('AGNOSTO');
  });

  it('καλύπτει το catch της diagrafi', async () => {
    const apothiki = new IndexedDbApothiki();
    await apothiki.grapse_keimeno('test/x.txt', 'α');
    transactionErrors = true;
    const deleted = await apothiki.diagrafi('test/x.txt');
    expect(deleted.ok).toBe(false);
    if (!deleted.ok) expect(deleted.sfalma.kodikos).toBe('AGNOSTO');
  });
});
