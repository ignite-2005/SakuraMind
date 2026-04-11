"use client"

import { useEffect, useRef } from "react"

interface WaveformProps {
  isRecording: boolean
  analyser: AnalyserNode | null
}

export function Waveform({ isRecording, analyser }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas resolution for sharp rendering
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const draw = () => {
      const width = rect.width
      const height = rect.height

      // Clear with sakura-tinted dark background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
      bgGradient.addColorStop(0, "rgba(30, 15, 25, 0.3)")
      bgGradient.addColorStop(1, "rgba(15, 8, 15, 0.5)")
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      if (isRecording && analyser) {
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteTimeDomainData(dataArray)

        // Draw glow effect - sakura pink
        ctx.shadowBlur = 15
        ctx.shadowColor = "oklch(0.75 0.14 350)"

        // Create sakura gradient for the waveform
        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, "oklch(0.75 0.14 350)")
        gradient.addColorStop(0.5, "oklch(0.85 0.1 20)")
        gradient.addColorStop(1, "oklch(0.75 0.14 350)")

        ctx.lineWidth = 3
        ctx.strokeStyle = gradient
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()

        const sliceWidth = width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * height) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
          x += sliceWidth
        }

        ctx.stroke()
        ctx.shadowBlur = 0

        // Add bars visualization overlay - sakura colors
        const barCount = 64
        const barWidth = width / barCount - 2
        analyser.getByteFrequencyData(dataArray)

        for (let i = 0; i < barCount; i++) {
          const barIndex = Math.floor(i * (bufferLength / barCount))
          const barHeight = (dataArray[barIndex] / 255) * (height * 0.4)
          const x = i * (barWidth + 2)
          const hue = 350 + (i / barCount) * 30 // Sakura pink to peach range

          ctx.fillStyle = `oklch(0.65 0.12 ${hue > 360 ? hue - 360 : hue} / 0.3)`
          ctx.fillRect(x, height - barHeight, barWidth, barHeight)
        }
      } else {
        // Draw idle wave animation - sakura style
        const time = Date.now() / 1000
        
        ctx.shadowBlur = 10
        ctx.shadowColor = "oklch(0.75 0.14 350 / 0.5)"

        ctx.lineWidth = 2
        ctx.strokeStyle = "oklch(0.65 0.1 350 / 0.4)"
        ctx.lineCap = "round"
        ctx.beginPath()

        for (let x = 0; x < width; x++) {
          const y =
            height / 2 +
            Math.sin(x * 0.02 + time * 2) * 8 +
            Math.sin(x * 0.01 + time * 1.5) * 4 +
            Math.sin(x * 0.03 + time * 3) * 2
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [isRecording, analyser])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-28 rounded-lg"
      style={{ width: '100%', height: '112px' }}
    />
  )
}
