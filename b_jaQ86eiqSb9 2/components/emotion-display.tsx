"use client"

import { memo } from "react"
import { EmotionConfidencePie } from "@/components/emotion-confidence-pie"
import type { EmotionDistribution } from "@/lib/emotion-distribution"
import {
  fallbackEmotionDistribution,
  PREVIEW_EMOTION_DISTRIBUTION,
} from "@/lib/emotion-distribution"
import { cn } from "@/lib/utils"

export type EmotionType = "happy" | "neutral" | "sad" | "angry"

interface EmotionDisplayProps {
  emotion: EmotionType | null
  confidence: number
  isAnalyzing: boolean
  /** When set (e.g. live analysis), used for the pie; legacy reports omit this */
  emotionDistribution?: EmotionDistribution | null
}

const EMOJI: Record<EmotionType, string> = {
  happy: "😊",
  neutral: "😐",
  sad: "😢",
  angry: "😤",
}

const SHORT: Record<EmotionType, string> = {
  happy: "Happy",
  neutral: "Neutral",
  sad: "Sad",
  angry: "Stressed",
}

export const EmotionDisplay = memo(function EmotionDisplay({
  emotion,
  confidence,
  isAnalyzing,
  emotionDistribution,
}: EmotionDisplayProps) {
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-8">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />
          <div className="relative h-28 w-28 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div
            className="absolute inset-4 animate-spin rounded-full border-4 border-accent/20 border-b-accent"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-xl font-semibold text-foreground">
            Analyzing voice pattern
          </p>
          <p className="text-sm text-muted-foreground">
            Building your affect blend…
          </p>
        </div>
      </div>
    )
  }

  if (!emotion) {
    return (
      <div className="flex w-full flex-col items-center gap-4 py-2">
        <div className="w-full max-w-md rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Affect blend
          </p>
          <p className="mt-1 text-center text-sm leading-snug text-muted-foreground">
            Voice Analysis uses this pie after each capture so you can see{" "}
            <span className="font-medium text-foreground/90">happy vs sad</span>{" "}
            (and neutral / stress) at a glance.
          </p>
          <EmotionConfidencePie
            distribution={PREVIEW_EMOTION_DISTRIBUTION}
            variant="preview"
            className="mt-2"
          />
        </div>
      </div>
    )
  }

  const distribution =
    emotionDistribution ?? fallbackEmotionDistribution(emotion, confidence)

  return (
    <div className="flex w-full flex-col items-center gap-4 py-2">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Affect blend
        </p>
        <p className="mt-1 text-center text-sm leading-snug text-foreground/90">
          How much of your voice{" "}
          <span className="whitespace-nowrap font-medium text-foreground">
            {EMOJI.happy} happy
          </span>
          ,{" "}
          <span className="whitespace-nowrap font-medium text-foreground">
            {EMOJI.sad} sad
          </span>
          , and more — at a glance.
        </p>
        <EmotionConfidencePie distribution={distribution} className="mt-2" />
      </div>

      <div
        className={cn(
          "flex w-full max-w-md flex-wrap items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-4 py-3 text-center text-sm text-muted-foreground",
        )}
      >
        <span className="text-base" aria-hidden>
          {EMOJI[emotion]}
        </span>
        <span>
          Top classifier pick:{" "}
          <span className="font-semibold text-foreground">{SHORT[emotion]}</span>
          <span className="font-mono text-foreground/90">
            {" "}
            · {Math.round(confidence)}%
          </span>
        </span>
      </div>
    </div>
  )
})
