"use client"

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Volume2,
  Activity,
  AudioWaveform,
} from "lucide-react"

interface VoiceIndicatorsProps {
  pitchVariation: "high" | "normal" | "low" | null
  speechEnergy: "high" | "normal" | "low" | null
  rhythmStability: "high" | "normal" | "low" | null
}

export function VoiceIndicators({
  pitchVariation,
  speechEnergy,
  rhythmStability,
}: VoiceIndicatorsProps) {
  const getIndicator = (value: "high" | "normal" | "low" | null) => {
    if (value === "high")
      return { 
        icon: TrendingUp, 
        color: "oklch(0.7 0.18 160)", 
        bgColor: "oklch(0.7 0.18 160 / 0.15)",
        label: "High",
        barWidth: "85%"
      }
    if (value === "low")
      return { 
        icon: TrendingDown, 
        color: "oklch(0.7 0.15 70)", 
        bgColor: "oklch(0.7 0.15 70 / 0.15)",
        label: "Low",
        barWidth: "35%"
      }
    if (value === "normal")
      return { 
        icon: Minus, 
        color: "oklch(0.65 0.15 200)", 
        bgColor: "oklch(0.65 0.15 200 / 0.15)",
        label: "Normal",
        barWidth: "60%"
      }
    return { 
      icon: Minus, 
      color: "oklch(0.5 0.02 280)", 
      bgColor: "oklch(0.5 0.02 280 / 0.1)",
      label: "---",
      barWidth: "0%"
    }
  }

  const pitch = getIndicator(pitchVariation)
  const energy = getIndicator(speechEnergy)
  const rhythm = getIndicator(rhythmStability)

  const indicators = [
    { label: "Pitch Variation", data: pitch, mainIcon: Activity },
    { label: "Speech Energy", data: energy, mainIcon: Volume2 },
    { label: "Rhythm", data: rhythm, mainIcon: AudioWaveform },
  ]

  return (
    <div className="space-y-4">
      {indicators.map((item, idx) => (
        <div 
          key={idx}
          className="group p-4 rounded-xl bg-secondary/30 border border-border/30 
            hover:bg-secondary/50 hover:border-border/50 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <item.mainIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <div 
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: item.data.bgColor, color: item.data.color }}
            >
              <item.data.icon className="w-3 h-3" />
              {item.data.label}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ 
                width: item.data.barWidth,
                backgroundColor: item.data.color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
