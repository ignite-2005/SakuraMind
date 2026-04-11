"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Petal {
  id: number
  left: number
  animationDuration: number
  animationDelay: number
  size: number
  opacity: number
  swayDuration: number
  variant: 1 | 2 | 3
}

interface CherryBlossomsProps {
  className?: string
  /** default ~32 petals */
  count?: number
}

export function CherryBlossoms({ className, count = 32 }: CherryBlossomsProps) {
  const [petals, setPetals] = useState<Petal[]>([])

  useEffect(() => {
    const newPetals: Petal[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 10 + Math.random() * 12,
      animationDelay: Math.random() * 15,
      size: 12 + Math.random() * 16,
      opacity: 0.4 + Math.random() * 0.4,
      swayDuration: 3 + Math.random() * 4,
      variant: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
    }))
    setPetals(newPetals)
  }, [count])

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute"
          style={{
            left: `${petal.left}%`,
            top: "-30px",
            animation: `sakura-fall ${petal.animationDuration}s linear infinite`,
            animationDelay: `${petal.animationDelay}s`,
          }}
        >
          <div
            style={{
              animation: `sakura-sway ${petal.swayDuration}s ease-in-out infinite`,
              opacity: petal.opacity,
            }}
          >
            <SakuraPetal size={petal.size} variant={petal.variant} />
          </div>
        </div>
      ))}
      
      {/* Ambient sakura glow orbs */}
      <div
        className="absolute left-[18%] top-1/4 h-[400px] w-[400px] animate-[float_12s_ease-in-out_infinite] rounded-full blur-[100px]"
        style={{ background: "oklch(0.82 0.12 350 / 0.14)" }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 h-[500px] w-[500px] animate-[float_15s_ease-in-out_infinite_reverse] rounded-full blur-[120px]"
        style={{ background: "oklch(0.88 0.09 15 / 0.1)" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px]"
        style={{ background: "oklch(0.78 0.14 350 / 0.08)" }}
      />

      <style jsx>{`
        @keyframes sakura-fall {
          0% {
            transform: translateY(-30px) rotate(0deg);
            opacity: 0;
          }
          5% { opacity: 1; }
          95% { opacity: 0.6; }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes sakura-sway {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(20px) rotate(15deg); }
          50% { transform: translateX(-15px) rotate(-10deg); }
          75% { transform: translateX(25px) rotate(20deg); }
        }
      `}</style>
    </div>
  )
}

function SakuraPetal({ size, variant }: { size: number; variant: 1 | 2 | 3 }) {
  // Different petal shapes for variety
  if (variant === 1) {
    // Classic 5-petal sakura flower
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <g filter="url(#glow1)">
          <path
            d="M16 2C16 2 18 8 16 12C14 8 16 2 16 2Z"
            fill="oklch(0.9 0.08 350)"
          />
          <path
            d="M16 2C16 2 18 8 16 12C14 8 16 2 16 2Z"
            fill="oklch(0.85 0.1 350)"
            transform="rotate(72 16 16)"
          />
          <path
            d="M16 2C16 2 18 8 16 12C14 8 16 2 16 2Z"
            fill="oklch(0.88 0.09 350)"
            transform="rotate(144 16 16)"
          />
          <path
            d="M16 2C16 2 18 8 16 12C14 8 16 2 16 2Z"
            fill="oklch(0.9 0.08 355)"
            transform="rotate(216 16 16)"
          />
          <path
            d="M16 2C16 2 18 8 16 12C14 8 16 2 16 2Z"
            fill="oklch(0.87 0.1 345)"
            transform="rotate(288 16 16)"
          />
          <circle cx="16" cy="16" r="2" fill="oklch(0.85 0.15 60)" />
        </g>
        <defs>
          <filter id="glow1" x="-4" y="-4" width="40" height="40" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    )
  }

  if (variant === 2) {
    // Single petal
    return (
      <svg width={size * 0.7} height={size} viewBox="0 0 20 32" fill="none">
        <g filter="url(#glow2)">
          <ellipse
            cx="10"
            cy="16"
            rx="8"
            ry="14"
            fill="oklch(0.88 0.1 350)"
          />
          <ellipse
            cx="10"
            cy="16"
            rx="5"
            ry="10"
            fill="oklch(0.92 0.07 355)"
          />
          <path
            d="M10 4C10 4 11 14 10 24"
            stroke="oklch(0.8 0.12 350)"
            strokeWidth="0.5"
            opacity="0.5"
          />
        </g>
        <defs>
          <filter id="glow2" x="-2" y="-2" width="24" height="36" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    )
  }

  // Variant 3: Simplified flower
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g filter="url(#glow3)">
        <circle cx="12" cy="6" r="4" fill="oklch(0.9 0.08 350)" />
        <circle cx="18" cy="10" r="4" fill="oklch(0.87 0.1 355)" />
        <circle cx="16" cy="17" r="4" fill="oklch(0.88 0.09 350)" />
        <circle cx="8" cy="17" r="4" fill="oklch(0.9 0.08 345)" />
        <circle cx="6" cy="10" r="4" fill="oklch(0.86 0.11 350)" />
        <circle cx="12" cy="12" r="2.5" fill="oklch(0.85 0.15 55)" />
      </g>
      <defs>
        <filter id="glow3" x="-2" y="-2" width="28" height="28" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
