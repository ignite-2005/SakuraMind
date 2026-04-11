"use client"

import { Coffee, MessageCircle, Sparkles, Heart, Music, Sun, Lightbulb } from "lucide-react"
import type { EmotionType } from "./emotion-display"

interface SupportActionsProps {
  emotion: EmotionType | null
}

const actionsByEmotion: Record<
  EmotionType,
  { icon: typeof Coffee; text: string }[]
> = {
  happy: [
    { icon: Sparkles, text: "Keep up the positive energy!" },
    { icon: Heart, text: "Share your joy with others" },
    { icon: Music, text: "Listen to your favorite music" },
  ],
  neutral: [
    { icon: Coffee, text: "Take a refreshing break" },
    { icon: Sun, text: "Get some fresh air" },
    { icon: MessageCircle, text: "Connect with a friend" },
  ],
  sad: [
    { icon: Coffee, text: "Take a short break" },
    { icon: MessageCircle, text: "Talk with a friend" },
    { icon: Heart, text: "Try a relaxation activity" },
  ],
  angry: [
    { icon: Coffee, text: "Step away for a moment" },
    { icon: Music, text: "Listen to calming music" },
    { icon: Sun, text: "Take deep breaths outside" },
  ],
}

export function SupportActions({ emotion }: SupportActionsProps) {
  if (!emotion) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-3">
        <Lightbulb className="w-8 h-8 opacity-30" />
        <p className="text-sm text-center">
          Recommendations appear after analysis
        </p>
      </div>
    )
  }

  const actions = actionsByEmotion[emotion]

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Lightbulb className="w-4 h-4" />
        Suggested Actions
      </h4>
      <ul className="space-y-2">
        {actions.map((action, index) => (
          <li
            key={index}
            className="group flex items-center gap-3 p-3 rounded-xl 
              bg-secondary/30 border border-border/30
              hover:bg-secondary/50 hover:border-primary/30 
              hover:shadow-[0_0_20px_oklch(0.7_0.18_280_/_0.1)]
              active:scale-[0.98] cursor-pointer transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center
              group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300
              border border-primary/10 group-hover:border-primary/30">
              <action.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-foreground group-hover:text-foreground/90 transition-colors">
              {action.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
