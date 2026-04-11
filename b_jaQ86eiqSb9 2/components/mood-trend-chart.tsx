"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { EmotionType } from "./emotion-display"

interface MoodEntry {
  time: string
  emotion: EmotionType
  confidence: number
  value: number
}

interface MoodTrendChartProps {
  data: MoodEntry[]
}

const emotionToValue: Record<EmotionType, number> = {
  happy: 4,
  neutral: 3,
  sad: 2,
  angry: 1,
}

const valueToEmoji: Record<number, string> = {
  1: "😠",
  2: "😔",
  3: "😐",
  4: "😊",
}

const valueToLabel: Record<number, string> = {
  1: "Angry",
  2: "Sad",
  3: "Neutral",
  4: "Happy",
}

export function MoodTrendChart({ data }: MoodTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-52 flex flex-col items-center justify-center text-muted-foreground gap-3">
        <div className="flex gap-2">
          {["😊", "😐", "😔", "😠"].map((emoji, i) => (
            <span key={i} className="text-2xl opacity-30">{emoji}</span>
          ))}
        </div>
        <p className="text-sm">Record to start tracking emotional trends</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
        <defs>
          <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.15 350)" stopOpacity={0.42} />
            <stop offset="50%" stopColor="oklch(0.88 0.1 15)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="oklch(0.78 0.14 350)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.82 0.15 350)" />
            <stop offset="50%" stopColor="oklch(0.9 0.09 15)" />
            <stop offset="100%" stopColor="oklch(0.78 0.15 350)" />
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="oklch(0.35 0.04 350 / 0.25)" 
          vertical={false}
        />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: "oklch(0.55 0.03 350)" }}
          tickLine={false}
          axisLine={{ stroke: "oklch(0.35 0.04 350 / 0.25)" }}
        />
        <YAxis
          domain={[0.5, 4.5]}
          ticks={[1, 2, 3, 4]}
          tickFormatter={(value) => valueToEmoji[value] || ""}
          tick={{ fontSize: 18 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const entry = payload[0].payload as MoodEntry
              return (
                <div className="glass-card rounded-xl p-4 shadow-xl border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">{entry.time}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{valueToEmoji[entry.value]}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground capitalize">{entry.emotion}</p>
                      <p className="text-xs text-muted-foreground">
                        {entry.confidence}% confidence
                      </p>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          fill="url(#moodGradient)"
          dot={{
            fill: "oklch(0.75 0.14 350)",
            stroke: "oklch(0.15 0.03 350)",
            strokeWidth: 2,
            r: 5,
          }}
          activeDot={{
            fill: "oklch(0.85 0.12 350)",
            stroke: "oklch(0.15 0.03 350)",
            strokeWidth: 3,
            r: 7,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export { emotionToValue }
