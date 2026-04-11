import { getSession } from "@/lib/auth-client"

const DB_NAME = "sakuramind_voice_v1"
const STORE = "recordings"
const DB_VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Scoped per logged-in user so clips do not leak across accounts on one device. */
function voiceStoreKey(reportId: string): string {
  const e = getSession()?.email
  const prefix = e ? normalizeEmail(e) : "_"
  return `${prefix}::${reportId}`
}

function getWithKey(
  db: IDBDatabase,
  key: string,
): Promise<Blob | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as Blob | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function saveVoiceRecording(
  reportId: string,
  blob: Blob,
): Promise<void> {
  const db = await openDb()
  const key = voiceStoreKey(reportId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE).put(blob, key)
  })
}

export async function getVoiceRecording(
  reportId: string,
): Promise<Blob | null> {
  const db = await openDb()
  const key = voiceStoreKey(reportId)
  try {
    let blob = await getWithKey(db, key)
    if (blob) return blob
    // Older builds stored blobs under raw reportId only
    blob = await getWithKey(db, reportId)
    return blob ?? null
  } catch {
    return null
  }
}

export async function deleteVoiceRecording(reportId: string): Promise<void> {
  const db = await openDb()
  const key = voiceStoreKey(reportId)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    const store = tx.objectStore(STORE)
    store.delete(key)
    store.delete(reportId)
  })
}
