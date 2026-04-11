"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

/** Decorative mel-style visualization for archived sessions (no live audio). */
export function StaticSpectrogramArt({
  seed,
  className,
}: {
  seed: string
  className?: string
}) {
  const bars = useMemo(() => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i) * (i + 1)) % 997
    return Array.from({ length: 48 }, (_, i) => {
      const v = Math.sin((h + i * 17) * 0.13) * 0.5 + 0.5
      const hue = 330 + (i % 14) * 1.6
      return { h: 18 + v * 72, hue }
    })
  }, [seed])

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-2",
        className,
      )}
    >
      <div className="flex h-[140px] items-end gap-[2px]">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-[2px] opacity-90 transition-all"
            style={{
              height: `${b.h}%`,
              background: `linear-gradient(to top, oklch(0.25 0.08 ${b.hue}), oklch(0.65 0.2 ${b.hue}))`,
              boxShadow: `0 0 12px oklch(0.55 0.15 ${b.hue} / 0.35)`,
            }}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Archived spectrum snapshot (reconstructed)
      </p>
    </div>
  )
}
