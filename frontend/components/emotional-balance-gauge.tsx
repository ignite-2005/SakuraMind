"use client"

import { cn } from "@/lib/utils"

interface EmotionalBalanceGaugeProps {
  score: number | null
  isAnalyzing: boolean
}

export function EmotionalBalanceGauge({
  score,
  isAnalyzing,
}: EmotionalBalanceGaugeProps) {
  const value = score == null ? 0 : Math.min(100, Math.max(0, score))
  const rotation = (value / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-2">
      <div className="relative h-36 w-full max-w-[220px]">
        <div
          className="absolute inset-x-4 top-0 h-[72px] overflow-hidden rounded-t-full border border-rose-300/15 bg-gradient-to-b from-rose-400/15 to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          aria-hidden
        >
          <div
            className="absolute inset-0 opacity-[0.45]"
            style={{
              background:
                "conic-gradient(from 180deg at 50% 100%, transparent 0deg, rgba(251,182,206,0.55) 85deg, rgba(244,114,182,0.45) 140deg, rgba(219,168,200,0.35) 180deg)",
            }}
          />
        </div>
        <div
          className="absolute bottom-0 left-1/2 h-[72px] w-1 origin-bottom rounded-full bg-gradient-to-t from-rose-400 to-pink-200 shadow-[0_0_20px_rgba(251,182,206,0.75)] transition-transform duration-700 ease-out"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            transformOrigin: "50% 100%",
          }}
        />
        <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-rose-50 shadow-[0_0_14px_rgba(255,228,235,0.95)] ring-2 ring-rose-300/60" />
        <p className="absolute bottom-[-4px] left-0 right-0 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Balance
        </p>
      </div>
      <div className="text-center">
        {isAnalyzing ? (
          <p className="text-sm text-muted-foreground">Calibrating…</p>
        ) : score == null ? (
          <p className="text-sm text-muted-foreground">Awaiting sample</p>
        ) : (
          <>
            <p
              className={cn(
                "text-4xl font-bold tabular-nums bg-gradient-to-r from-rose-200 via-pink-200 to-rose-100 bg-clip-text text-transparent",
              )}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground">/ 100 composite</p>
          </>
        )}
      </div>
    </div>
  )
}
