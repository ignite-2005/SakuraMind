import type { EmotionType } from "@/components/emotion-display"

export const EMOTION_ORDER: readonly EmotionType[] = [
  "happy",
  "neutral",
  "sad",
  "angry",
] as const

export type EmotionDistribution = Record<EmotionType, number>

/** Even split for idle / preview UI before a session exists */
export const PREVIEW_EMOTION_DISTRIBUTION: EmotionDistribution = {
  happy: 25,
  neutral: 25,
  sad: 25,
  angry: 25,
}

/** Normalize raw weights to percentages that sum to 100 (0.1 step, stable). */
export function normalizeTo100(weights: EmotionDistribution): EmotionDistribution {
  const safe = EMOTION_ORDER.map((e) => Math.max(0.0001, weights[e]))
  const sum = safe.reduce((a, v) => a + v, 0)
  const scaled: EmotionDistribution = {
    happy: 0,
    neutral: 0,
    sad: 0,
    angry: 0,
  }
  for (let i = 0; i < EMOTION_ORDER.length; i++) {
    scaled[EMOTION_ORDER[i]] = (safe[i] / sum) * 100
  }
  const rounded: EmotionDistribution = {
    happy: Math.round(scaled.happy * 10) / 10,
    neutral: Math.round(scaled.neutral * 10) / 10,
    sad: Math.round(scaled.sad * 10) / 10,
    angry: Math.round(scaled.angry * 10) / 10,
  }
  let total = EMOTION_ORDER.reduce((a, e) => a + rounded[e], 0)
  const diff = Math.round((100 - total) * 10) / 10
  const top = EMOTION_ORDER.reduce((best, e) =>
    rounded[e] > rounded[best] ? e : best,
  EMOTION_ORDER[0])
  rounded[top] = Math.round((rounded[top] + diff) * 10) / 10
  return rounded
}

/** Blend audio cues so the pie shows happy vs sad (etc.), not only the top label. */
export function buildEmotionDistributionFromFeatures(
  primary: EmotionType,
  confidence: number,
  f: { rms: number; spectralHighRatio: number; timeVariance: number },
): EmotionDistribution {
  const { rms, spectralHighRatio, timeVariance } = f
  const weights: EmotionDistribution = {
    happy:
      0.2 +
      Math.pow(Math.max(0, (rms - 0.022) / 0.062), 1.12) * 0.92 +
      Math.max(0, 0.42 - spectralHighRatio) * 0.35,
    sad:
      0.2 +
      Math.pow(Math.max(0, (0.046 - rms) / 0.05), 1.08) * 0.95 +
      Math.max(0, spectralHighRatio - 0.48) * 0.12,
    neutral:
      0.24 +
      Math.exp(-Math.pow((rms - 0.036) / 0.024, 2)) * 0.88 +
      (1 - Math.abs(spectralHighRatio - 0.46)) * 0.18,
    angry:
      0.16 +
      Math.max(0, (spectralHighRatio - 0.37) / 0.3) * 0.62 +
      Math.max(0, timeVariance - 0.035) * 1.65,
  }
  const c = Math.min(96, Math.max(52, confidence)) / 100
  weights[primary] *= 1.08 + c * 0.82
  return normalizeTo100(weights)
}

/** Older reports without stored distribution. */
export function fallbackEmotionDistribution(
  primary: EmotionType,
  confidence: number,
): EmotionDistribution {
  const c = Math.min(94, Math.max(50, confidence))
  const each = (100 - c) / 3
  const w: EmotionDistribution = {
    happy: primary === "happy" ? c : each,
    neutral: primary === "neutral" ? c : each,
    sad: primary === "sad" ? c : each,
    angry: primary === "angry" ? c : each,
  }
  return normalizeTo100(w)
}

/**
 * Slightly lifts tiny non-zero slices so SVG arcs stay drawable; labels still use raw `distribution`.
 */
export function chartAngleDistribution(d: EmotionDistribution): EmotionDistribution {
  const EPS = 0.2
  const MIN_SLICE = 2.8
  const copy: EmotionDistribution = { ...d }
  let changed = false
  for (const e of EMOTION_ORDER) {
    if (copy[e] > EPS && copy[e] < MIN_SLICE) {
      copy[e] = MIN_SLICE
      changed = true
    }
  }
  return changed ? normalizeTo100(copy) : d
}

export function dominantEmotion(
  d: EmotionDistribution,
): { emotion: EmotionType; value: number } {
  let best: EmotionType = EMOTION_ORDER[0]
  for (const e of EMOTION_ORDER) {
    if (d[e] > d[best]) best = e
  }
  return { emotion: best, value: d[best] }
}
