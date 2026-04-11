import { ReportsBrowser } from "@/components/reports-browser"
import { PageHeader } from "@/components/page-header"

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Previous Emotional Reports"
        subtitle="Browse archived sessions, reopen details, and track affect over time."
      />
      <ReportsBrowser />
    </>
  )
}
