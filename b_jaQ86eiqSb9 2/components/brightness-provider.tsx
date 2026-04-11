"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

const STORAGE_KEY = "sakuramind_brightness_v1"
const DEFAULT = 100

type BrightnessContextValue = {
  /** 50–130 → UI brightness multiplier ~0.5–1.3 */
  brightness: number
  setBrightness: (v: number) => void
}

const BrightnessContext = createContext<BrightnessContextValue | null>(null)

function readStored(): number {
  if (typeof window === "undefined") return DEFAULT
  const raw = localStorage.getItem(STORAGE_KEY)
  const n = raw ? Number.parseInt(raw, 10) : NaN
  if (Number.isFinite(n) && n >= 50 && n <= 130) return n
  return DEFAULT
}

export function BrightnessProvider({ children }: { children: React.ReactNode }) {
  const [brightness, setBrightnessState] = useState(DEFAULT)

  useEffect(() => {
    setBrightnessState(readStored())
  }, [])

  useEffect(() => {
    const mult = brightness / 100
    document.documentElement.style.setProperty("--app-brightness", String(mult))
  }, [brightness])

  const setBrightness = useCallback((v: number) => {
    const clamped = Math.min(130, Math.max(50, Math.round(v)))
    setBrightnessState(clamped)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(clamped))
    }
  }, [])

  const value = useMemo(
    () => ({ brightness, setBrightness }),
    [brightness, setBrightness],
  )

  return (
    <BrightnessContext.Provider value={value}>
      {children}
    </BrightnessContext.Provider>
  )
}

export function useBrightness() {
  const ctx = useContext(BrightnessContext)
  if (!ctx) throw new Error("useBrightness must be used within BrightnessProvider")
  return ctx
}
