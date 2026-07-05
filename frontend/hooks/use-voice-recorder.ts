"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { EmotionType } from "@/components/emotion-display"
import type { EmotionDistribution } from "@/lib/emotion-distribution"
import { buildEmotionDistributionFromFeatures } from "@/lib/emotion-distribution"

/** Require this much audio before stop is allowed (analysis needs a real clip). */
export const MIN_RECORDING_MS = 4000

interface VoiceRecorderState {
  isRecording: boolean
  recordingTime: number
  analyser: AnalyserNode | null
}

interface AnalysisResult {
  emotion: EmotionType
  confidence: number
  /** Percentages for each affect — sums to 100 */
  distribution: EmotionDistribution
  pitchVariation: "high" | "normal" | "low"
  speechEnergy: "high" | "normal" | "low"
  rhythmStability: "high" | "normal" | "low"
  /** Base64 PNG data URL of the mel spectrogram, when the backend provides it */
  mel?: string
  _t?: number
}

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ]
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t
    }
  }
  return "audio/webm"
}

/** RMS + spectral tilt from live analyser (call before stopping the stream). */
function sampleAudioFeatures(analyser: AnalyserNode): {
  rms: number
  spectralHighRatio: number
  timeVariance: number
} {
  const td = new Uint8Array(analyser.fftSize)
  const fd = new Uint8Array(analyser.frequencyBinCount)
  const passes = 6
  let rmsAcc = 0
  const samples: number[] = []

  for (let p = 0; p < passes; p++) {
    analyser.getByteTimeDomainData(td)
    let passMean = 0
    for (let i = 0; i < td.length; i++) {
      const x = (td[i] - 128) / 128
      passMean += x
    }
    passMean /= td.length
    let passVar = 0
    for (let i = 0; i < td.length; i++) {
      const x = (td[i] - 128) / 128
      rmsAcc += x * x
      const d = x - passMean
      passVar += d * d
    }
    samples.push(Math.sqrt(passVar / td.length))
  }

  const rms = Math.sqrt(rmsAcc / (td.length * passes))

  analyser.getByteFrequencyData(fd)
  const n = fd.length
  const split = Math.max(2, Math.floor(n * 0.22))
  let low = 0
  let high = 0
  for (let i = 0; i < split; i++) low += fd[i]
  for (let i = split; i < n; i++) high += fd[i]
  const spectralHighRatio =
    low + high > 1e-6 ? high / (low + high) : 0

  const meanSv = samples.reduce((a, b) => a + b, 0) / samples.length
  let tv = 0
  for (const s of samples) {
    const d = s - meanSv
    tv += d * d
  }
  const timeVariance = Math.sqrt(tv / samples.length)

  return { rms, spectralHighRatio, timeVariance }
}

/** Several grabs in a row — a single frame is often too quiet at stop; pick the strongest. */
function sampleAudioFeaturesBest(analyser: AnalyserNode): {
  rms: number
  spectralHighRatio: number
  timeVariance: number
} {
  let best = sampleAudioFeatures(analyser)
  for (let i = 0; i < 10; i++) {
    const next = sampleAudioFeatures(analyser)
    if (next.rms > best.rms) best = next
  }
  return best
}

/** Below this = no usable signal (silence / disconnected). Softer mics often land between 0.005–0.02. */
const SILENCE_RMS = 0.0032

function inferEmotionFromFeatures(
  features: { rms: number; spectralHighRatio: number; timeVariance: number } | null,
  durationSec: number,
): AnalysisResult | null {
  if (durationSec < MIN_RECORDING_MS / 1000 - 0.05) return null

  if (!features || !Number.isFinite(features.rms)) return null
  if (features.rms < SILENCE_RMS) return null

  const { spectralHighRatio, timeVariance } = features
  /** Slight floor so quiet speech still participates in happy/sad rules without rejecting the clip */
  const rms = Math.max(features.rms, 0.007)

  let emotion: EmotionType
  if (spectralHighRatio > 0.58 && rms > 0.038) {
    emotion = "angry"
  } else if (rms > 0.055) {
    emotion = "happy"
  } else if (rms < 0.032) {
    emotion = "sad"
  } else {
    emotion = "neutral"
  }

  const clarity =
    Math.min(1, rms / 0.09) * 0.55 +
    Math.abs(spectralHighRatio - 0.45) * 0.9 +
    Math.min(1, timeVariance / 0.08) * 0.35
  const confidence = Math.round(
    Math.min(96, Math.max(58, 62 + clarity * 28)),
  )

  const pitchVariation: AnalysisResult["pitchVariation"] =
    spectralHighRatio > 0.52 ? "high" : spectralHighRatio < 0.38 ? "low" : "normal"
  const speechEnergy: AnalysisResult["speechEnergy"] =
    rms > 0.05 ? "high" : rms < 0.028 ? "low" : "normal"
  const rhythmStability: AnalysisResult["rhythmStability"] =
    timeVariance < 0.035 ? "high" : timeVariance > 0.07 ? "low" : "normal"

  const distribution = buildEmotionDistributionFromFeatures(
    emotion,
    confidence,
    { rms, spectralHighRatio, timeVariance },
  )

  return {
    emotion,
    confidence,
    distribution,
    pitchVariation,
    speechEnergy,
    rhythmStability,
  }
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    recordingTime: 0,
    analyser: null,
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [recordingHint, setRecordingHint] = useState<string | null>(null)
  /** Wall time when current take started (for UI timer only; avoids whole-page 10Hz rerenders). */
  const [recordingWallStartMs, setRecordingWallStartMs] = useState<number | null>(
    null,
  )

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const recordingStartedAtRef = useRef<number | null>(null)
  const mimeTypeRef = useRef<string>("audio/webm")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingBlobRef = useRef<Blob | null>(null)
  const lastUpdateMtimeRef = useRef<number | null>(null)

  const startRecording = useCallback(async () => {
    try {
      chunksRef.current = []
      recordingBlobRef.current = null
      setRecordingHint(null)

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      await audioContext.resume()

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.65

      const gain = audioContext.createGain()
      gain.gain.value = 0

      source.connect(analyser)
      analyser.connect(gain)
      gain.connect(audioContext.destination)

      analyserRef.current = analyser

      const mimeType = pickMimeType()
      mimeTypeRef.current = mimeType
      let mediaRecorder: MediaRecorder
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType })
      } catch {
        mediaRecorder = new MediaRecorder(stream)
      }
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      // Blob is finalized in stopRecording via onstop — do not set onstop here
      // or addEventListener("stop"), which can resolve before chunks are merged.

      const wall = Date.now()
      mediaRecorder.start()
      recordingStartedAtRef.current = wall
      setRecordingWallStartMs(wall)

      setState({
        isRecording: true,
        recordingTime: 0,
        analyser,
      })

      timerRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }))
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }, [])

  const stopRecording = useCallback(async () => {
    const started = recordingStartedAtRef.current
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording" &&
      started
    ) {
      const elapsed = Date.now() - started
      if (elapsed < MIN_RECORDING_MS) {
        const left = Math.ceil((MIN_RECORDING_MS - elapsed) / 1000)
        setRecordingHint(
          `Keep going — need at least ${MIN_RECORDING_MS / 1000}s (${left}s left)`,
        )
        window.setTimeout(() => setRecordingHint(null), 4000)
        return
      }
    }

    setRecordingHint(null)
    const durationSec = started ? (Date.now() - started) / 1000 : 0

    const mr = mediaRecorderRef.current
    await new Promise<void>((resolve) => {
      if (!mr || mr.state === "inactive") {
        resolve()
        return
      }
      mr.onstop = () => {
        const type =
          mr.mimeType || mimeTypeRef.current || "audio/webm"
        const blob = new Blob(chunksRef.current, { type })
        recordingBlobRef.current = blob.size > 0 ? blob : null
        resolve()
      }
      try {
        if (mr.state === "recording") {
          try {
            mr.requestData()
          } catch {
            /* requestData optional on some UAs */
          }
        }
        mr.stop()
      } catch {
        mr.onstop = null
        resolve()
      }
    })

    mediaRecorderRef.current = null

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close()
      } catch {
        /* ignore */
      }
      audioContextRef.current = null
    }
    analyserRef.current = null
    recordingStartedAtRef.current = null
    setRecordingWallStartMs(null)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setState({
      isRecording: false,
      recordingTime: 0,
      analyser: null,
    })

    setIsAnalyzing(true)

    const blob = recordingBlobRef.current
    if (blob) {
      const formData = new FormData()
      formData.append('voiceBlob', blob, 'recording.webm')
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        })
        if (response.ok) {
           const data = await response.json();
           setResult({
              emotion: data.emotion,
              confidence: data.confidence,
              distribution: buildEmotionDistributionFromFeatures(data.emotion, data.confidence, { rms: 0.05, spectralHighRatio: 0.5, timeVariance: 0.05 }),
              pitchVariation: "normal",
              speechEnergy: "normal",
              rhythmStability: "normal",
              mel: data.mel,
              _t: data._t || Date.now()
           });
        } else {
           const text = await response.text().catch(() => '')
           console.error('Analyze failed:', response.status, text)
        }
      } catch (err) {
         console.error('Analysis failed', err)
      }
    }
    setIsAnalyzing(false)
  }, [])

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      void stopRecording()
    } else {
      void startRecording()
    }
  }, [state.isRecording, startRecording, stopRecording])

  const peekRecordingBlob = useCallback((): Blob | null => {
    const b = recordingBlobRef.current
    return b && b.size > 0 ? b : null
  }, [])

  const clearRecordingBlob = useCallback(() => {
    recordingBlobRef.current = null
  }, [])

  return {
    ...state,
    isAnalyzing,
    result,
    recordingWallStartMs,
    recordingHint,
    toggleRecording,
    startRecording,
    stopRecording,
    peekRecordingBlob,
    clearRecordingBlob,
  }
}
