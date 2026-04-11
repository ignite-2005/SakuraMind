"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardBackground } from "@/components/dashboard-background"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const next = searchParams.get("next") || "/dashboard"
  const registered = searchParams.get("registered") === "1"
  const safeNext = next.startsWith("/") ? next : "/dashboard"

  useEffect(() => {
    if (loading || !user) return
    router.replace(safeNext)
    router.refresh()
  }, [loading, user, router, safeNext])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const res = await login(email, password, rememberMe)
    setPending(false)
    if (res.error) {
      setError(res.error)
      return
    }
    router.replace(safeNext)
    router.refresh()
  }

  return (
    <main className="relative min-h-screen">
      <DashboardBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-2xl border border-white/[0.08] p-8 shadow-2xl">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              Access your SakuraMind workspace
            </p>
          </div>

          {registered ? (
            <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-center text-sm text-primary">
              Account created. You can sign in now.
            </p>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={pending}
              />
              <Label htmlFor="remember-me" className="text-sm text-muted-foreground">
                Remember me
              </Label>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 font-semibold"
              disabled={pending}
            >
              {pending ? "Signing in…" : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
          <p className="mt-3 text-center">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
