"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DashboardBackground } from "@/components/dashboard-background"

export function SignupForm() {
  const router = useRouter()
  const { signup, user, loading } = useAuth()

  useEffect(() => {
    if (loading || !user) return
    router.replace("/dashboard")
    router.refresh()
  }, [loading, user, router])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setPending(true)
    const res = await signup(email, password)
    setPending(false)
    if (res.error) {
      setError(res.error)
      return
    }
    router.replace("/login?registered=1")
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
              Create account
            </h1>
            <p className="text-sm text-muted-foreground">
              Local credentials — stored only in this browser
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="su-email">Email</Label>
              <Input
                id="su-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-password">Password</Label>
              <Input
                id="su-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50"
              />
              <p className="text-[11px] text-muted-foreground">At least 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="su-confirm">Confirm password</Label>
              <Input
                id="su-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-background/50"
              />
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
              {pending ? "Creating…" : "Sign up"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
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
