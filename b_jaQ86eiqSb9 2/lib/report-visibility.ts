import type { EmotionalReport } from "@/lib/types/emotional-report"
import { isReportUnlockedInSession } from "@/lib/report-unlock-session"

/** Used for dashboard stats and “recent activity” — omits hidden and locked (until unlocked this session). */
export function isReportVisibleInAggregates(r: EmotionalReport): boolean {
  if (r.hidden) return false
  if (r.lockPasswordHash && !isReportUnlockedInSession(r.id)) return false
  return true
}
