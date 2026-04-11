"use client"

import Link from "next/link"
import { Brain, Heart, LogIn, Mic, UserPlus, Waves } from "lucide-react"

export function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div className="relative z-10 mx-auto max-w-3xl space-y-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-rose-400/35 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-300 via-pink-400 to-fuchsia-700 shadow-[0_0_48px_rgba(244,114,182,0.45)] ring-2 ring-rose-200/25">
              <Waves className="h-10 w-10 text-white drop-shadow-md" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="animate-[gradient-shift_4s_ease_infinite] bg-[length:200%_auto] bg-gradient-to-r from-rose-100 via-pink-200 to-rose-300 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              SakuraMind
            </h1>
            <p className="max-w-lg text-balance text-lg text-rose-200/80 md:text-xl">
              Real-time spectral inference, affect mapping, and session memory —
              engineered for clinical-grade signal clarity.
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg space-y-4">
          <div
            className="pointer-events-none absolute -inset-8 animate-[pulse-glow_3s_ease-in-out_infinite] rounded-[2.5rem] blur-2xl"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.82 0.14 350 / 0.4), oklch(0.88 0.1 15 / 0.28))",
            }}
          />
          <p className="relative text-center text-sm font-medium text-rose-200/90">
            Sign in or create an account to open your workspace.
          </p>
          <div className="relative flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/login"
              className="group relative flex flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-2xl border border-rose-200/25 bg-rose-950/35 px-8 py-4 text-base font-semibold text-rose-50 shadow-[0_0_24px_rgba(244,114,182,0.12)] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-rose-200/40 hover:bg-rose-950/50 hover:shadow-[0_0_36px_rgba(244,114,182,0.22)] active:scale-[0.98]"
            >
              <LogIn className="h-5 w-5 shrink-0 opacity-90" />
              Log in
            </Link>
            <Link
              href="/signup"
              className="group relative flex flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary to-accent px-8 py-4 text-base font-semibold text-primary-foreground shadow-[0_0_32px_oklch(0.75_0.14_350_/_0.45)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_48px_oklch(0.75_0.14_350_/_0.55)] active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/15 via-transparent to-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <UserPlus className="relative h-5 w-5 shrink-0" />
              <span className="relative">Sign up</span>
            </Link>
          </div>
        </div>

        <div className="space-y-8 pt-8">
          <h2 className="flex items-center justify-center gap-2 text-lg font-medium text-muted-foreground">
            <span className="h-px w-8 bg-border" />
            How it Works
            <span className="h-px w-8 bg-border" />
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { icon: Mic, title: "1. Record Voice", desc: "Speak naturally for analysis" },
              { icon: Brain, title: "2. AI Processing", desc: "Neural pattern detection" },
              { icon: Heart, title: "3. Get Insights", desc: "Personalized recommendations" },
            ].map((item, i) => (
              <div
                key={i}
                className="group glass-card glass-card-hover flex cursor-default flex-col items-center gap-4 rounded-2xl p-6 transition-all duration-300"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-border/50 bg-gradient-to-br from-secondary to-secondary/50 transition-all duration-300 group-hover:scale-110 group-hover:border-primary/30 group-hover:from-primary/30 group-hover:to-accent/20">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-1 text-center">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
          {[
            { color: "bg-chart-3", label: "Spectrogram Analysis" },
            { color: "bg-chart-2", label: "Emotion Detection" },
            { color: "bg-chart-1", label: "Mood Tracking" },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border border-border/30 bg-secondary/30 px-3 py-1.5"
            >
              <div className={`h-2 w-2 rounded-full ${feature.color}`} />
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
