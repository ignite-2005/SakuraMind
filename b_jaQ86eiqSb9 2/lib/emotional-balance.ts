import type { EmotionType } from "@/components/emotion-display"

const emotionBase: Record<EmotionType, number> = {
  happy: 82,
  neutral: 52,
  sad: 38,
  angry: 28,
}

export function computeBalanceScore(
  emotion: EmotionType,
  confidence: number,
): number {
  const c = Math.min(100, Math.max(0, confidence)) / 100
  const blended = emotionBase[emotion] * 0.55 + c * 100 * 0.45
  return Math.round(Math.min(100, Math.max(0, blended)))
}

function levelWord(v: "high" | "normal" | "low"): string {
  if (v === "high") return "elevated"
  if (v === "low") return "reduced"
  return "moderate"
}

export function buildAiInterpretation(
  emotion: EmotionType,
  confidence: number,
  balanceScore: number,
  pitch: "high" | "normal" | "low",
  energy: "high" | "normal" | "low",
  rhythm: "high" | "normal" | "low",
): string {
  const tone =
    emotion === "happy"
      ? "warm and expressive"
      : emotion === "neutral"
        ? "steady and measured"
        : emotion === "sad"
          ? "subdued with softer dynamics"
          : "intense with sharper dynamics"

  return (
    `Neural analysis indicates a ${emotion} affect (${Math.round(confidence)}% confidence) with ${tone} vocal delivery. ` +
    `Emotional balance is ${balanceScore}/100. Prosodic cues show ${levelWord(pitch)} pitch variation, ${levelWord(energy)} speech energy, and ${levelWord(rhythm)} rhythmic stability — consistent with the inferred affective state.`
  )
}

export function quickInsightLines(emotion: EmotionType): string[] {
  const lines: Record<EmotionType, string[]> = {
    happy: [
      "Positive valence detected in tone contour",
      "Energy levels support an upbeat interpretation",
      "Consider capturing this baseline for future sessions",
    ],
    neutral: [
      "Baseline arousal within expected range",
      "Little affective drift across the sample",
      "Good candidate for longitudinal comparison",
    ],
    sad: [
      "Lower energy envelope on sustained vowels",
      "Pitch variability suggests reflective mood",
      "Gentle pacing may benefit wellbeing check-ins",
    ],
    angry: [
      "Elevated intensity in consonant bursts",
      "Shorter phrase lengths possible — monitor stress",
      "Breathing cues recommend a short reset if needed",
    ],
  }
  return lines[emotion]
}
