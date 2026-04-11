import type { EmotionalReport } from "@/lib/types/emotional-report"
import { getSession } from "@/lib/auth-client"
import { notifyReportsMutated } from "@/lib/reports-mutated"

/** Flat list from older builds — migrated once into the per-user map. */
const LEGACY_KEY = "sakuramind_emotional_reports_v1"
const MAP_KEY = "sakuramind_emotional_reports_by_user_v1"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function currentUserEmail(): string | null {
  const e = getSession()?.email
  return e ? normalizeEmail(e) : null
}

function loadMap(): Record<string, EmotionalReport[]> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(MAP_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const out: Record<string, EmotionalReport[]> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(v)) out[k] = v as EmotionalReport[]
    }
    return out
  } catch {
    return {}
  }
}

function saveMap(map: Record<string, EmotionalReport[]>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(MAP_KEY, JSON.stringify(map))
  notifyReportsMutated()
}

function readLegacyFlatList(): EmotionalReport[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as EmotionalReport[]) : []
  } catch {
    return []
  }
}

/**
 * If the new per-user map has never been written but the legacy flat list
 * exists, attach that list to the current account and remove the legacy key.
 * Other accounts never see that data.
 */
function migrateLegacyIntoMapIfNeeded(email: string): void {
  const map = loadMap()
  if (Object.keys(map).length > 0) return
  const legacy = readLegacyFlatList()
  if (legacy.length === 0) return
  map[email] = legacy
  saveMap(map)
  localStorage.removeItem(LEGACY_KEY)
}

export function loadReports(): EmotionalReport[] {
  if (typeof window === "undefined") return []
  const email = currentUserEmail()
  if (!email) return []
  migrateLegacyIntoMapIfNeeded(email)
  const map = loadMap()
  return map[email] ?? []
}

export function saveReports(reports: EmotionalReport[]): void {
  if (typeof window === "undefined") return
  const email = currentUserEmail()
  if (!email) return
  const map = loadMap()
  map[email] = reports
  saveMap(map)
}

export function addReport(report: EmotionalReport): void {
  const prev = loadReports()
  saveReports([report, ...prev].slice(0, 200))
}

export function updateReport(
  id: string,
  updater: (r: EmotionalReport) => EmotionalReport,
): boolean {
  const prev = loadReports()
  const idx = prev.findIndex((r) => r.id === id)
  if (idx < 0) return false
  const next = [...prev]
  next[idx] = updater(prev[idx])
  saveReports(next)
  return true
}

export function deleteReport(id: string): void {
  const prev = loadReports()
  saveReports(prev.filter((r) => r.id !== id))
}

export function trendVsPrevious(
  newScore: number,
  previous: EmotionalReport | undefined,
): EmotionalReport["trendVsPrevious"] {
  if (!previous) return "flat"
  const delta = newScore - previous.balanceScore
  if (delta > 3) return "up"
  if (delta < -3) return "down"
  return "flat"
}
