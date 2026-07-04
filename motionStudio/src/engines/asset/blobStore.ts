/**
 * Durable storage for asset file bytes. Object URLs (blob:) die on reload and
 * localStorage can't hold large binaries — so the actual Blobs live in
 * IndexedDB, keyed by assetId. On load we read them back and mint fresh URLs.
 */

const DB_NAME = 'motionstudio';
const STORE = 'assets';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

export function putBlob(id: string, blob: Blob): Promise<IDBValidKey> {
  return withStore('readwrite', (s) => s.put(blob, id));
}

export function getBlob(id: string): Promise<Blob | undefined> {
  return withStore('readonly', (s) => s.get(id));
}

export function deleteBlob(id: string): Promise<undefined> {
  return withStore('readwrite', (s) => s.delete(id));
}
