/**
 * Durable storage for asset file bytes. Object URLs (blob:) die on reload and
 * localStorage can't hold large binaries — so the actual Blobs live in
 * IndexedDB, keyed by assetId. On load we read them back and mint fresh URLs.
 */

const DB_NAME = 'motionstudio';
const STORE = 'assets';

/**
 * Ask the browser not to evict this origin's storage.
 *
 * Until an asset's upload is confirmed, the blob here is the *only* copy of
 * that file — and best-effort storage is exactly what a browser drops first
 * under disk pressure. Losing it means losing the user's media outright, with
 * no cloud copy to fall back on, which is the one failure this whole subsystem
 * exists to prevent.
 *
 * Fire-and-forget by design: the answer is not actionable. A "no" (or a browser
 * without the API) doesn't change what the app should do — the upload retries
 * are what carry the risk from there — and prompting the user about storage
 * durability before they have done anything would be noise.
 */
let persistenceRequested = false;
export function requestPersistentStorage(): void {
  if (persistenceRequested || !navigator.storage?.persist) return;
  persistenceRequested = true;
  void navigator.storage.persist().catch(() => {
    /* Nothing to do about a refusal; see above. */
  });
}

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
  // Asked here rather than at startup: this is the moment the origin actually
  // starts holding something worth keeping.
  requestPersistentStorage();
  return withStore('readwrite', (s) => s.put(blob, id));
}

export function getBlob(id: string): Promise<Blob | undefined> {
  return withStore('readonly', (s) => s.get(id));
}

export function deleteBlob(id: string): Promise<undefined> {
  return withStore('readwrite', (s) => s.delete(id));
}
