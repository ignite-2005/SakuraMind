"use client"

import { memo, useMemo } from "react"
import type { EmotionType } from "@/components/emotion-display"
import type { EmotionDistribution } from "@/lib/emotion-distribution"
import {
  EMOTION_ORDER,
  chartAngleDistribution,
  dominantEmotion,
} from "@/lib/emotion-distribution"
import { cn } from "@/lib/utils"

const EMOJI: Record<EmotionType, string> = {
  happy: "😊",
  neutral: "😐",
  sad: "😢",
  angry: "😤",
}

const LABEL: Record<EmotionType, string> = {
  happy: "Happy",
  neutral: "Neutral",
  sad: "Sad",
  angry: "Stressed",
}

/** Solid fills — no url(#id) so no SVG id / hydration clashes */
const FILL: Record<EmotionType, string> = {
  happy: "#34d399",
  neutral: "#a78bfa",
  sad: "#fbbf24",
  angry: "#f87171",
}

const CX = 100
const CY = 100
const R_OUT = 78
const R_IN = 44

/** Donut slice from startAngle to endAngle (degrees, 0 = top, clockwise). */
function donutArcPath(
  startDeg: number,
  endDeg: number,
  outer: number,
  inner: number,
): string {
  if (
    endDeg - startDeg < 0.2 ||
    ![startDeg, endDeg, outer, inner].every((n) => Number.isFinite(n))
  ) {
    return ""
  }
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180
  const xo1 = CX + outer * Math.cos(toRad(startDeg))
  const yo1 = CY + outer * Math.sin(toRad(startDeg))
  const xo2 = CX + outer * Math.cos(toRad(endDeg))
  const yo2 = CY + outer * Math.sin(toRad(endDeg))
  const xi1 = CX + inner * Math.cos(toRad(endDeg))
  const yi1 = CY + inner * Math.sin(toRad(endDeg))
  const xi2 = CX + inner * Math.cos(toRad(startDeg))
  const yi2 = CY + inner * Math.sin(toRad(startDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${xo1} ${yo1}`,
    `A ${outer} ${outer} 0 ${large} 1 ${xo2} ${yo2}`,
    `L ${xi1} ${yi1}`,
    `A ${inner} ${inner} 0 ${large} 0 ${xi2} ${yi2}`,
    "Z",
  ].join(" ")
}

function valenceHint(d: EmotionDistribution): string {
  const h = d.happy
  const s = d.sad
  if (h > s + 4) {
    return `You lean happier than sad (${h.toFixed(0)}% 😊 vs ${s.toFixed(0)}% 😢).`
  }
  if (s > h + 4) {
    return `You lean sadder than happy (${s.toFixed(0)}% 😢 vs ${h.toFixed(0)}% 😊).`
  }
  return "Happy and sad cues are close — check neutral & stress slices too."
}

export const EmotionConfidencePie = memo(function EmotionConfidencePie({
  distribution,
  className,
  variant = "live",
}: {
  distribution: EmotionDistribution
  className?: string
  variant?: "live" | "preview"
}) {
  const isPreview = variant === "preview"
  const { emotion: top, value: topPct } = dominantEmotion(distribution)

  const arcDistribution = useMemo(
    () => (isPreview ? distribution : chartAngleDistribution(distribution)),
    [distribution, isPreview],
  )

  const slices = useMemo(() => {
    let cursor = 0
    return EMOTION_ORDER.map((key) => {
      const span = (arcDistribution[key] / 100) * 360
      const gapDeg = span <= 0.02 ? 0 : Math.min(0.95, Math.max(0.2, span * 0.06))
      const start = cursor
      const arc = Math.max(0, span - gapDeg)
      const end = cursor + arc
      cursor += span
      const path =
        arc > 0.25 ? donutArcPath(start, end, R_OUT, R_IN) : ""
      return { key, path, label: LABEL[key], emoji: EMOJI[key], pct: distribution[key] }
    })
  }, [arcDistribution, distribution])

  return (
    <div
      className={cn(
        "relative w-full",
        isPreview && "opacity-[0.92]",
        className,
      )}
    >
      <div className="relative mx-auto flex h-[260px] w-full max-w-[260px] items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="h-[220px] w-[220px] shrink-0 overflow-visible"
          role="img"
          aria-label="Emotion mix donut chart"
        >
          {slices.map(({ key, path, label, emoji, pct }) =>
            path ? (
              <path
                key={key}
                d={path}
                fill={FILL[key]}
                stroke="#14081a"
                strokeWidth={2}
                className="transition-[opacity,filter] duration-200 hover:brightness-110"
              >
                <title>
                  {emoji} {label}: {pct.toFixed(1)}%
                </title>
              </path>
            ) : null,
          )}
        </svg>

        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          aria-hidden
        >
          {isPreview ? (
            <>
              <span className="text-4xl drop-shadow-md">🎤</span>
              <p className="mt-0.5 max-w-[9rem] text-center text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
                Tap record to fill this chart
              </p>
            </>
          ) : (
            <>
              <span className="text-4xl drop-shadow-md">{EMOJI[top]}</span>
              <p className="mt-0.5 max-w-[7rem] text-center text-[10px] font-medium uppercase leading-tight tracking-wide text-muted-foreground">
                Largest slice · {topPct.toFixed(0)}%
              </p>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-sm leading-snug text-foreground/85">
        {isPreview
          ? "Preview layout — after you record, slices show how much of the signal reads as 😊 happy, 😢 sad, 😐 neutral, and 😤 stressed."
          : valenceHint(distribution)}
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EMOTION_ORDER.map((key) => (
          <li
            key={key}
            className={cn(
              "flex flex-col items-center rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent px-2 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
              isPreview && "opacity-80",
            )}
          >
            <span className="text-2xl leading-none" aria-hidden>
              {EMOJI[key]}
            </span>
            <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {LABEL[key]}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
              {isPreview ? "—" : `${distribution[key].toFixed(1)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}, arePiePropsEqual)

function arePiePropsEqual(
  prev: {
    distribution: EmotionDistribution
    className?: string
    variant?: "live" | "preview"
  },
  next: {
    distribution: EmotionDistribution
    className?: string
    variant?: "live" | "preview"
  },
): boolean {
  if (prev.variant !== next.variant || prev.className !== next.className) {
    return false
  }
  return EMOTION_ORDER.every(
    (e) => prev.distribution[e] === next.distribution[e],
  )
}
