import { getSession } from "@/lib/auth-client"
import { notifyReportsMutated } from "@/lib/reports-mutated"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function storageKey(): string {
  const e = getSession()?.email
  const prefix = e ? normalizeEmail(e) : "_"
  return `sakuramind_report_unlock_v1_${prefix}`
}

function readIds(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(storageKey())
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : []
  } catch {
    return []
  }
}

function writeIds(ids: string[]): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(storageKey(), JSON.stringify([...new Set(ids)]))
}

export function isReportUnlockedInSession(reportId: string): boolean {
  return readIds().includes(reportId)
}

export function unlockReportInSession(reportId: string): void {
  const ids = readIds()
  if (ids.includes(reportId)) return
  ids.push(reportId)
  writeIds(ids)
  notifyReportsMutated()
}

/** Call when setting a lock or signing out of viewing a locked report for this tab */
export function lockReportInSession(reportId: string): void {
  const next = readIds().filter((id) => id !== reportId)
  writeIds(next)
  notifyReportsMutated()
}
