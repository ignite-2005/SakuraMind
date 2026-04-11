"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Sparkles } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user) {
      const next = pathname || "/dashboard"
      router.replace(`/login?next=${encodeURIComponent(next)}`)
    }
  }, [loading, user, router, pathname])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 shadow-[0_0_32px_rgba(244,114,182,0.4)]">
          <Sparkles className="h-7 w-7 text-white animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground">Verifying session…</p>
      </div>
    )
  }

  return <>{children}</>
}
