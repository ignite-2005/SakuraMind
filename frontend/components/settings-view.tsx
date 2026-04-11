"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  SunMedium,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useBrightness } from "@/components/brightness-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"

export function SettingsView() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { brightness, setBrightness } = useBrightness()
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleLogout() {
    logout()
    router.replace("/")
    router.refresh()
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Appearance, display brightness, and your session."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass-card rounded-2xl border border-white/[0.07] p-6">
          <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Theme follows this device until you choose otherwise.
          </p>
          {!mounted ? (
            <div className="mt-6 h-11 rounded-xl bg-muted/30" />
          ) : (
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { id: "light" as const, label: "Light", icon: Sun },
                { id: "dark" as const, label: "Dark", icon: Moon },
                { id: "system" as const, label: "System", icon: Monitor },
              ].map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "rounded-xl border-white/15",
                    theme === id &&
                      "border-primary/40 bg-primary/15 text-primary shadow-[0_0_20px_rgba(244,114,182,0.15)]",
                  )}
                  onClick={() => setTheme(id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          )}
          {mounted ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Active:{" "}
              <span className="font-medium text-foreground">
                {theme === "system"
                  ? `System (${resolvedTheme ?? "…"})`
                  : theme}
              </span>
            </p>
          ) : null}
        </div>

        <div className="glass-card rounded-2xl border border-white/[0.07] p-6">
          <div className="flex items-center gap-2">
            <SunMedium className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Brightness</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Adjust overall UI luminance (50%–130%).
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Dimmer</span>
              <span className="font-mono text-foreground">{brightness}%</span>
              <span>Brighter</span>
            </div>
            <Slider
              min={50}
              max={130}
              step={1}
              value={[brightness]}
              onValueChange={(v) => setBrightness(v[0] ?? 100)}
              className="py-1"
            />
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/[0.07] p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in locally on this browser.
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="mt-1 font-mono text-sm text-foreground">
                {user?.email ?? "—"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-xl border-rose-300/30 text-rose-100 hover:bg-rose-950/40 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
