"use client"

import { Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface AiInterpretationPanelProps {
  text: string | null
  isAnalyzing: boolean
}

export function AiInterpretationPanel({
  text,
  isAnalyzing,
}: AiInterpretationPanelProps) {
  return (
    <div className="flex min-h-[140px] flex-col gap-3">
      <div className="flex items-center gap-2 text-primary">
        <Brain className="h-5 w-5" />
        <h2 className="text-lg font-semibold text-foreground">AI Interpretation</h2>
      </div>
      <div
        className={cn(
          "rounded-xl border border-white/[0.08] bg-black/20 p-4 text-sm leading-relaxed text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          "min-h-[100px]",
        )}
      >
        {isAnalyzing ? (
          <p className="animate-pulse">Synthesizing neural narrative…</p>
        ) : text ? (
          <p className="text-foreground/90">{text}</p>
        ) : (
          <p>Run a voice capture to generate an AI interpretation of your affective profile.</p>
        )}
      </div>
    </div>
  )
}
