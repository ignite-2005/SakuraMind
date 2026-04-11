import type { EmotionType } from "@/components/emotion-display"
import type { EmotionDistribution } from "@/lib/emotion-distribution"

export type TrendDirection = "up" | "down" | "flat"

export interface EmotionalReport {
  id: string
  createdAt: string
  emotion: EmotionType
  confidence: number
  /** Saved affect blend for pie chart; absent on legacy reports */
  emotionDistribution?: EmotionDistribution
  balanceScore: number
  pitchVariation: "high" | "normal" | "low"
  speechEnergy: "high" | "normal" | "low"
  rhythmStability?: "high" | "normal" | "low"
  trendVsPrevious: TrendDirection
  aiInterpretation: string
  quickInsights: string[]
  /** JPEG data URL of the mel spectrogram at analysis time */
  spectrogramImage?: string
  /** Voice clip stored in IndexedDB under this report id */
  hasVoiceRecording?: boolean
  /** When true, hidden from the default reports list until “Show hidden” is enabled */
  hidden?: boolean
  /** SHA-256 (hex) of a user-chosen passphrase; details stay redacted until unlocked this session */
  lockPasswordHash?: string
}
