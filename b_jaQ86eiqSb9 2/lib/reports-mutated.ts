export const REPORTS_MUTATED_EVENT = "sakuramind-reports-mutated" as const

export function notifyReportsMutated(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(REPORTS_MUTATED_EVENT))
}
