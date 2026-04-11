"use client"

import { useCallback, useEffect, useState } from "react"
import { Activity, Mic, MicOff } from "lucide-react"
import { Waveform } from "@/components/waveform"
import { MIN_RECORDING_MS } from "@/hooks/use-voice-recorder"
import { cn } from "@/lib/utils"

type Props = {
  isRecording: boolean
  isAnalyzing: boolean
  recordingWallStartMs: number | null
  recordingHint: string | null
  analyser: AnalyserNode | null
  toggleRecording: () => void
}

/**
 * Isolated recording UI + ~4 Hz timer tick so the rest of the dashboard (incl. pie chart)
 * does not re-render every 100ms while the mic is on.
 */
export function VoiceRecordingPanel({
  isRecording,
  isAnalyzing,
  recordingWallStartMs,
  recordingHint,
  analyser,
  toggleRecording,
}: Props) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!isRecording || recordingWallStartMs == null) return
    const id = window.setInterval(() => setTick((t) => t + 1), 250)
    return () => window.clearInterval(id)
  }, [isRecording, recordingWallStartMs])

  const elapsedMs =
    isRecording && recordingWallStartMs != null
      ? Date.now() - recordingWallStartMs
      : 0
  const canStopRecording = !isRecording || elapsedMs >= MIN_RECORDING_MS

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  const recordSecondsFloored = Math.floor(elapsedMs / 1000)

  return (
    <>
      <div className="mb-5 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Voice Recording</h2>
        {isRecording && (
          <span className="ml-auto flex items-center gap-2 text-sm text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Live
          </span>
        )}
      </div>

      <div className="rounded-xl bg-background/30 p-1">
        <Waveform isRecording={isRecording} analyser={analyser} />
      </div>

      <div className="mt-8 flex flex-col items-center gap-5">
        <div className="relative">
          {isRecording && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
              <span className="absolute -inset-4 animate-pulse rounded-full border-2 border-red-500/30" />
              <span
                className="absolute -inset-8 animate-pulse rounded-full border border-red-500/15"
                style={{ animationDelay: "0.5s" }}
              />
            </>
          )}
          {!isRecording && !isAnalyzing && (
            <span className="absolute -inset-2 animate-[pulse-glow_3s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-rose-400/30 to-pink-400/25 blur-lg" />
          )}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isAnalyzing || (isRecording && !canStopRecording)}
            title={
              isRecording && !canStopRecording
                ? `Record at least ${MIN_RECORDING_MS / 1000}s before stopping`
                : undefined
            }
            className={cn(
              "relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full transition-all duration-500",
              "hover:scale-105 active:scale-95",
              isRecording
                ? "bg-gradient-to-br from-red-500 to-red-600"
                : "bg-gradient-to-br from-rose-400 via-pink-500 to-fuchsia-800",
              isAnalyzing && "cursor-not-allowed opacity-50",
              isRecording &&
                !canStopRecording &&
                "cursor-not-allowed opacity-70 ring-2 ring-amber-400/50 ring-offset-2 ring-offset-background",
            )}
            style={{
              boxShadow: isRecording
                ? "0 0 40px rgba(239,68,68,0.45), 0 0 80px rgba(239,68,68,0.2)"
                : "0 0 44px rgba(244,114,182,0.45), 0 0 88px rgba(251,182,206,0.22)",
            }}
          >
            <span
              className={cn(
                "absolute inset-[3px] rounded-full transition-all duration-300",
                isRecording
                  ? "bg-gradient-to-br from-red-400/30 to-transparent"
                  : "bg-gradient-to-br from-white/20 to-transparent",
              )}
            />
            {isRecording ? (
              <MicOff className="relative z-10 h-12 w-12 text-white drop-shadow-lg" />
            ) : (
              <Mic className="relative z-10 h-12 w-12 text-white drop-shadow-lg" />
            )}
          </button>
        </div>

        <div className="space-y-1 text-center">
          <p
            className={cn(
              "text-sm font-medium transition-colors duration-300",
              isRecording ? "text-red-400" : "text-muted-foreground",
            )}
          >
            {isRecording
              ? "Recording..."
              : isAnalyzing
                ? "Analyzing patterns..."
                : `Tap to capture · min ${MIN_RECORDING_MS / 1000}s per take`}
          </p>
          {isRecording && (
            <p className="font-mono text-4xl font-bold tabular-nums text-foreground">
              {formatTime(recordSecondsFloored)}
            </p>
          )}
          {isRecording && !canStopRecording && (
            <p className="text-xs font-medium text-amber-200/90">
              Min {MIN_RECORDING_MS / 1000}s —{" "}
              {Math.max(
                1,
                Math.ceil((MIN_RECORDING_MS - elapsedMs) / 1000),
              )}
              s left to stop
            </p>
          )}
          {recordingHint ? (
            <p className="max-w-[16rem] text-xs text-amber-200/95">{recordingHint}</p>
          ) : null}
        </div>
      </div>
    </>
  )
}
