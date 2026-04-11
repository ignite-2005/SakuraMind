import { LandingPage } from "@/components/landing-page"
import { DashboardBackground } from "@/components/dashboard-background"

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <DashboardBackground />
      <div className="relative z-10">
        <LandingPage />
      </div>
    </main>
  )
}
