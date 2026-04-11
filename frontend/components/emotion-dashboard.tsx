"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { RotateCcw, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceRecordingPanel } from "@/components/voice-recording-panel"
import { Spectrogram, type SpectrogramHandle } from "./spectrogram"
import { EmotionDisplay, type EmotionType } from "./emotion-display"
import { MoodTrendChart, emotionToValue } from "./mood-trend-chart"
import { VoiceIndicators } from "./voice-indicators"
import { EmotionalBalanceGauge } from "./emotional-balance-gauge"
import { AiInterpretationPanel } from "./ai-interpretation-panel"
import { QuickInsightsPanel } from "./quick-insights-panel"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"
import { cn } from "@/lib/utils"
import {
  computeBalanceScore,
  buildAiInterpretation,
  quickInsightLines,
} from "@/lib/emotional-balance"
import { addReport, loadReports, trendVsPrevious } from "@/lib/reports-storage"
import { saveVoiceRecording } from "@/lib/voice-recording-idb"
import type { EmotionalReport } from "@/lib/types/emotional-report"

interface MoodEntry {
  time: string
  emotion: EmotionType
  confidence: number
  value: number
}

export function EmotionDashboard() {
  const {
    isRecording,
    recordingWallStartMs,
    recordingHint,
    analyser,
    isAnalyzing,
    result,
    toggleRecording,
    peekRecordingBlob,
    clearRecordingBlob,
  } = useVoiceRecorder()

  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([])
  const [holdSpectrogram, setHoldSpectrogram] = useState(false)
  const savedSigRef = useRef<string | null>(null)
  const spectrogramRef = useRef<SpectrogramHandle>(null)
  const capturedSpectrogramRef = useRef<string | undefined>(undefined)
  const prevRecordingRef = useRef(false)

  const sessionActive = isRecording || isAnalyzing || holdSpectrogram || !!result

  useEffect(() => {
    if (isRecording) {
      setHoldSpectrogram(false)
    }
  }, [isRecording])

  useEffect(() => {
    if (prevRecordingRef.current && !isRecording) {
      setHoldSpectrogram(true)
    }
    prevRecordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    if (!result || isAnalyzing) {
      if (!result) capturedSpectrogramRef.current = undefined
      return
    }
    let cancelled = false
    const capture = () => {
      if (cancelled) return
      capturedSpectrogramRef.current =
        spectrogramRef.current?.getSnapshot() ?? undefined
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(capture)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [result, isAnalyzing])

  const balanceScore = useMemo(() => {
    if (!result) return null
    return computeBalanceScore(result.emotion, result.confidence)
  }, [result])

  const aiInterpretationText = useMemo(() => {
    if (!result || isAnalyzing) return null
    return buildAiInterpretation(
      result.emotion,
      result.confidence,
      balanceScore ?? 0,
      result.pitchVariation,
      result.speechEnergy,
      result.rhythmStability,
    )
  }, [result, isAnalyzing, balanceScore])

  useEffect(() => {
    if (result && !isAnalyzing) {
      const time = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })

      setMoodHistory((prev) => [
        ...prev.slice(-9),
        {
          time,
          emotion: result.emotion,
          confidence: Math.round(result.confidence),
          value: emotionToValue[result.emotion],
        },
      ])
    }
  }, [result, isAnalyzing])

  useEffect(() => {
    if (!result || isAnalyzing) return
    const sig = JSON.stringify({
      e: result.emotion,
      c: Math.round(result.confidence * 100) / 100,
      d: result.distribution,
      p: result.pitchVariation,
      s: result.speechEnergy,
      r: result.rhythmStability,
    })
    if (savedSigRef.current === sig) return

    const t = window.setTimeout(() => {
      savedSigRef.current = sig
      void (async () => {
        const snapshot =
          capturedSpectrogramRef.current ??
          spectrogramRef.current?.getSnapshot() ??
          undefined

        const balance = computeBalanceScore(result.emotion, result.confidence)
        const prev = loadReports()[0]
        const reportId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `r-${Date.now()}`

        let voiceBlob = peekRecordingBlob()
        if (!voiceBlob) {
          await new Promise((r) => setTimeout(r, 320))
          voiceBlob = peekRecordingBlob()
        }

        const report: EmotionalReport = {
          id: reportId,
          createdAt: new Date().toISOString(),
          emotion: result.emotion,
          confidence: result.confidence,
          emotionDistribution: result.distribution,
          balanceScore: balance,
          pitchVariation: result.pitchVariation,
          speechEnergy: result.speechEnergy,
          rhythmStability: result.rhythmStability,
          trendVsPrevious: trendVsPrevious(balance, prev),
          aiInterpretation: buildAiInterpretation(
            result.emotion,
            result.confidence,
            balance,
            result.pitchVariation,
            result.speechEnergy,
            result.rhythmStability,
          ),
          quickInsights: quickInsightLines(result.emotion),
          spectrogramImage: snapshot,
          hasVoiceRecording: !!(voiceBlob && voiceBlob.size > 0),
        }
        addReport(report)

        if (voiceBlob && voiceBlob.size > 0) {
          try {
            await saveVoiceRecording(reportId, voiceBlob)
          } finally {
            clearRecordingBlob()
          }
        } else {
          clearRecordingBlob()
        }
      })()
    }, 380)

    return () => window.clearTimeout(t)
  }, [result, isAnalyzing])

  const clearHistory = useCallback(() => {
    setMoodHistory([])
  }, [])

  const cardClass =
    "glass-card glass-card-hover self-start rounded-2xl border border-white/[0.07] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.35)] transition-all duration-300 min-h-0 flex flex-col"

  return (
    <div className="relative space-y-4 overflow-hidden pb-6">
      {/* Band 1: only capture — avoids one tall card stretching this row */}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        <div className={cn(cardClass)}>
          <VoiceRecordingPanel
            isRecording={isRecording}
            isAnalyzing={isAnalyzing}
            recordingWallStartMs={recordingWallStartMs}
            recordingHint={recordingHint}
            analyser={analyser}
            toggleRecording={toggleRecording}
          />
        </div>

        <div className={cn(cardClass)}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Mel Spectrogram</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-secondary/50 px-2 py-1 text-xs text-muted-foreground">
                {isRecording ? "Live FFT" : sessionActive ? "Captured" : "Real-time FFT"}
              </span>
              {holdSpectrogram && !isRecording && !isAnalyzing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHoldSpectrogram(false)}
                  className="h-8 border-rose-300/25 bg-rose-950/30 text-rose-100 hover:bg-rose-950/50 hover:text-white"
                >
                  <Square className="mr-1.5 h-3.5 w-3.5" />
                  Stop
                </Button>
              )}
            </div>
          </div>
          <div className="min-h-[180px] overflow-hidden rounded-xl relative">
            {(!isRecording && !isAnalyzing && result) ? (
              // @ts-ignore
              <img src={`/api/mel?t=${result._t || Date.now()}`} alt="Mel Spectrogram" className="h-52 w-full object-cover" style={{ width: "100%", height: "208px" }} />
            ) : (
              <Spectrogram
                ref={spectrogramRef}
                analyser={analyser}
                isRecording={isRecording}
                sessionActive={sessionActive}
              />
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {sessionActive && !isRecording
              ? "Review the capture, then press Stop to dismiss the spectrogram."
              : "Frequency analysis with neural processing"}
          </p>
        </div>
      </div>

      {/* Band 2: emotion (tall pie) on its own row — no huge gap under Voice / Mel */}
      <div className="grid grid-cols-1 items-start gap-4">
        <div className={cn(cardClass)}>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Emotion Detection</h2>
          <div className="min-w-0 overflow-x-auto">
            <EmotionDisplay
              emotion={result?.emotion ?? null}
              confidence={result?.confidence ?? 0}
              isAnalyzing={isAnalyzing}
              emotionDistribution={result?.distribution ?? null}
            />
          </div>
        </div>
      </div>

      {/* Band 3: signals + balance + AI */}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={cn(cardClass)}>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Voice Signals</h2>
          <VoiceIndicators
            pitchVariation={result?.pitchVariation ?? null}
            speechEnergy={result?.speechEnergy ?? null}
            rhythmStability={result?.rhythmStability ?? null}
          />
        </div>

        <div className={cn(cardClass, "items-center")}>
          <h2 className="mb-1 w-full text-lg font-semibold text-foreground">
            Emotional Balance
          </h2>
          <p className="mb-4 w-full text-xs text-muted-foreground">
            Composite score from affect + confidence
          </p>
          <EmotionalBalanceGauge score={balanceScore} isAnalyzing={isAnalyzing} />
        </div>

        <div className={cn(cardClass)}>
          <AiInterpretationPanel
            text={aiInterpretationText}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </div>

      {/* Band 4: trend + quick insights */}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={cn(cardClass, "md:col-span-2 xl:col-span-2")}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Emotional Trend</h2>
            {moodHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="shrink-0 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
          <div className="min-h-[220px] w-full flex-1">
            <MoodTrendChart data={moodHistory} />
          </div>
        </div>

        <div className={cn(cardClass, "md:col-span-2 xl:col-span-1")}>
          <QuickInsightsPanel emotion={result?.emotion ?? null} isAnalyzing={isAnalyzing} />
        </div>
      </div>
    </div>
  )
}
