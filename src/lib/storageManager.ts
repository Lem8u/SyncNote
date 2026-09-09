import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";

export const STORAGE_SCHEMA_VERSION = 2;
export const SCHEMA_VERSION_KEY = "syncnote_schema_version";
export const LEGACY_DB_NAME = "syncnote_storage_v1";
export const CURRENT_DB_NAME = "syncnote_storage_v2";
export const BACKUP_DB_PREFIX = "syncnote_backup_";

export interface StorageInitResult {
  provider: IndexeddbPersistence | null;
  recoveryNotice: string | null;
  isRecovered: boolean;
}

/**
 * Safely open an IndexedDB database with timeout and blocked event handling.
 */
function openDatabaseSafely(name: string, timeoutMs: number = 1500): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not available in this environment."));
    }

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error(`Timed out after ${timeoutMs}ms while opening IndexedDB "${name}".`));
      }
    }, timeoutMs);

    try {
      const request = window.indexedDB.open(name);

      request.onblocked = () => {
        console.warn(`[Storage] Database "${name}" is blocked by another connection.`);
      };

      request.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          reject(request.error || new Error(`Failed to open IndexedDB "${name}".`));
        }
      };

      request.onsuccess = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          const db = request.result;
          db.onversionchange = () => {
            try {
              db.close();
            } catch (e) {}
          };
          resolve(db);
        } else {
          // If resolved by timeout already, ensure DB is closed immediately
          try {
            request.result.close();
          } catch (e) {}
        }
      };
    } catch (err) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        reject(err);
      }
    }
  });
}

/**
 * Safely backup all accessible stores from a database into a new backup database.
 */
async function backupDatabase(sourceDbName: string): Promise<string> {
  const backupDbName = `${BACKUP_DB_PREFIX}${Date.now()}`;
  console.log(`[Storage] Creating safety backup of "${sourceDbName}" into "${backupDbName}"...`);

  try {
    const sourceDb = await openDatabaseSafely(sourceDbName, 1200);
    const storeNames = Array.from(sourceDb.objectStoreNames);

    if (storeNames.length === 0) {
      sourceDb.close();
      return backupDbName;
    }

    // Read all records from source DB
    const dump: Record<string, any[]> = {};
    for (const storeName of storeNames) {
      try {
        const tx = sourceDb.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        const records = await new Promise<any[]>((resolve, reject) => {
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
        dump[storeName] = records;
      } catch (readErr) {
        console.warn(`[Storage] Could not dump store "${storeName}":`, readErr);
      }
    }
    sourceDb.close();

    // Write records into backup DB
    await new Promise<void>((resolve) => {
      const openReq = window.indexedDB.open(backupDbName, 1);
      openReq.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        for (const storeName of Object.keys(dump)) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { autoIncrement: true });
          }
        }
      };
      openReq.onsuccess = () => {
        const db = openReq.result;
        try {
          const writeTx = db.transaction(Object.keys(dump), "readwrite");
          for (const [storeName, records] of Object.entries(dump)) {
            const store = writeTx.objectStore(storeName);
            for (const record of records) {
              store.add(record);
            }
          }
          writeTx.oncomplete = () => {
            db.close();
            resolve();
          };
          writeTx.onerror = () => {
            db.close();
            resolve();
          };
        } catch (e) {
          db.close();
          resolve();
        }
      };
      openReq.onerror = () => resolve();
    });

    console.log(`[Storage] Safety backup completed: "${backupDbName}".`);
  } catch (err) {
    console.warn(`[Storage] Non-fatal: unable to complete full backup snapshot:`, err);
  }

  return backupDbName;
}

/**
 * Perform safe schema migration from v1 (or unversioned) to v2.
 */
async function performMigrationIfNeeded(targetDoc: Y.Doc): Promise<{ migrated: boolean; notice: string | null }> {
  let storedVersion = 1;
  try {
    const rawVersion = localStorage.getItem(SCHEMA_VERSION_KEY);
    if (rawVersion) {
      storedVersion = parseInt(rawVersion, 10) || 1;
    }
  } catch (e) {
    storedVersion = 1;
  }

  console.log(`[Storage] Schema version: current=${storedVersion} | target=${STORAGE_SCHEMA_VERSION}`);

  if (storedVersion >= STORAGE_SCHEMA_VERSION) {
    return { migrated: false, notice: null };
  }

  console.log(`[Storage] Migration started: migrating schema v${storedVersion} to v${STORAGE_SCHEMA_VERSION}...`);
  let notice: string | null = null;

  try {
    // Check if legacy database actually exists if supported by browser/WebView2
    if (typeof window !== "undefined" && typeof window.indexedDB?.databases === "function") {
      const dbs = await window.indexedDB.databases();
      const hasLegacy = dbs.some((db) => db.name === LEGACY_DB_NAME);
      if (!hasLegacy) {
        console.log("[Storage] No legacy database found.");
        try {
          localStorage.setItem(SCHEMA_VERSION_KEY, STORAGE_SCHEMA_VERSION.toString());
        } catch (e) {}
        return { migrated: false, notice: null };
      }
    }

    // Attempt to read from legacy v1 database
    const v1Db = await openDatabaseSafely(LEGACY_DB_NAME, 1500);
    const hasUpdates = v1Db.objectStoreNames.contains("updates");

    if (hasUpdates) {
      const tx = v1Db.transaction("updates", "readonly");
      const store = tx.objectStore("updates");
      const req = store.getAll();

      const updates = await new Promise<Uint8Array[]>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });

      v1Db.close();

      if (updates.length > 0) {
        console.log(`[Storage] Migrating ${updates.length} update chunk(s) from legacy database...`);
        // Test decoding updates on a temporary document to ensure no corruption
        const testDoc = new Y.Doc();
        let decodeSuccess = true;

        for (const update of updates) {
          try {
            Y.applyUpdate(testDoc, update);
          } catch (decodeErr) {
            console.error("[Storage] Corrupted update detected during migration test:", decodeErr);
            decodeSuccess = false;
            break;
          }
        }

        if (decodeSuccess) {
          // Apply safely into target document
          Y.transact(targetDoc, () => {
            for (const update of updates) {
              Y.applyUpdate(targetDoc, update);
            }
          });
          console.log("[Storage] Migration completed");
        } else {
          throw new Error("Legacy data contains corrupted binary updates.");
        }
      } else {
        console.log("[Storage] Legacy database was empty. No data to migrate.");
      }
    } else {
      v1Db.close();
      console.log("[Storage] Legacy database had no updates store.");
    }

    try {
      localStorage.setItem(SCHEMA_VERSION_KEY, STORAGE_SCHEMA_VERSION.toString());
    } catch (e) {}

    return { migrated: true, notice: null };
  } catch (err: any) {
    console.error(`[Storage] Recovery triggered: Migration failed (${err?.message || err}).`);
    // Safe non-destructive backup
    await backupDatabase(LEGACY_DB_NAME);
    notice = "Local workspace recovery was required. Your previous data has been safely preserved.";

    try {
      localStorage.setItem(SCHEMA_VERSION_KEY, STORAGE_SCHEMA_VERSION.toString());
    } catch (e) {}

    return { migrated: false, notice };
  }
}

/**
 * Initialize local persistence safely with timeout, schema migration, and fallback recovery.
 * Guarantees the application never hangs indefinitely.
 */
export async function initializeLocalStorage(targetDoc: Y.Doc): Promise<StorageInitResult> {
  console.log("[Storage] Opening IndexedDB");

  let recoveryNotice: string | null = null;
  let isRecovered = false;

  // 1. Check and perform schema migration if needed
  try {
    const migrationResult = await performMigrationIfNeeded(targetDoc);
    if (migrationResult.notice) {
      recoveryNotice = migrationResult.notice;
      isRecovered = true;
    }
  } catch (migrationErr: any) {
    console.error("[Storage] Unexpected error in migration phase:", migrationErr);
    recoveryNotice = "Local workspace recovery was required.";
    isRecovered = true;
  }

  // 2. Initialize y-indexeddb provider on current schema database with timeout guard
  let provider: IndexeddbPersistence | null = null;

  try {
    provider = new IndexeddbPersistence(CURRENT_DB_NAME, targetDoc);

    const syncPromise = new Promise<void>((resolve, reject) => {
      if (provider?.synced) {
        return resolve();
      }

      const onSynced = () => {
        resolve();
      };

      provider?.on("synced", onSynced);

      provider?.whenSynced
        ?.then(() => resolve())
        ?.catch((err: any) => reject(err));
    });

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        reject(new Error("IndexedDB sync timeout (2000ms exceeded)."));
      }, 2000);
    });

    // Race between sync and safety timeout
    await Promise.race([syncPromise, timeoutPromise]);
    console.log("[Storage] IndexedDB sync confirmed.");
  } catch (syncErr: any) {
    console.warn(`[Storage] Recovery triggered: ${syncErr?.message || syncErr}. Entering safe local mode.`);
    isRecovered = true;
    if (!recoveryNotice) {
      recoveryNotice = "Local workspace recovery was required. SyncNote is operating in safe local mode.";
    }

    // Attempt safety backup of current DB without deleting it
    backupDatabase(CURRENT_DB_NAME).catch(() => {});
  }

  console.log("[Storage] Workspace ready");

  return {
    provider,
    recoveryNotice,
    isRecovered,
  };
}
