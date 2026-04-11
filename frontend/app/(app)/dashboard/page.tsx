import { DashboardOverview } from "@/components/dashboard-overview"
import { PageHeader } from "@/components/page-header"

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Session metrics, trends, and shortcuts — use Voice Analysis for live capture."
      />
      <DashboardOverview />
    </>
  )
}
