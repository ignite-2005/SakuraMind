"use client"

import { Lightbulb, Sparkles } from "lucide-react"
import type { EmotionType } from "@/components/emotion-display"
import { quickInsightLines } from "@/lib/emotional-balance"
import { cn } from "@/lib/utils"

interface QuickInsightsPanelProps {
  emotion: EmotionType | null
  isAnalyzing: boolean
}

export function QuickInsightsPanel({
  emotion,
  isAnalyzing,
}: QuickInsightsPanelProps) {
  const lines = emotion ? quickInsightLines(emotion) : []

  return (
    <div className="flex min-h-[160px] flex-col gap-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-300/90" />
        <h2 className="text-lg font-semibold text-foreground">Quick Insights</h2>
      </div>
      {isAnalyzing ? (
        <p className="text-sm text-muted-foreground animate-pulse">
          Extracting recommendations…
        </p>
      ) : !emotion ? (
        <p className="text-sm text-muted-foreground">
          Insights unlock after your first successful analysis.
        </p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line, i) => (
            <li
              key={i}
              className={cn(
                "flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-foreground/90",
                "transition-all duration-300 hover:border-primary/25 hover:bg-primary/5 hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]",
              )}
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
