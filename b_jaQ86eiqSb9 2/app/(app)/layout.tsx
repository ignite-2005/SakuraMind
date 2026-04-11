import type { Metadata } from "next"
import { Suspense } from "react"
import { DashboardBackground } from "@/components/dashboard-background"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"

export const metadata: Metadata = {
  title: {
    default: "SakuraMind",
    template: "%s · SakuraMind",
  },
  description:
    "Premium AI voice analytics — emotion detection, spectrograms, and emotional balance insights.",
}

function ShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Loading…
    </div>
  )
}

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <AuthGuard>
        <div className="relative min-h-screen text-foreground">
          <DashboardBackground />
          <AppSidebar />
          <div className="relative z-10 min-h-screen pt-14 lg:pt-0 lg:pl-[260px]">
            <main className="mx-auto max-w-[1800px] p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </AuthGuard>
    </Suspense>
  )
}
