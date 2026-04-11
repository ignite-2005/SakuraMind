"use client"

import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react"

export interface SpectrogramHandle {
  /** JPEG data URL scaled for storage, or null if nothing captured */
  getSnapshot: () => string | null
}

interface SpectrogramProps {
  analyser: AnalyserNode | null
  /** True while mic is on */
  isRecording: boolean
  /** True while this capture session should show the spectrogram (live, analyzing, or frozen until Stop) */
  sessionActive: boolean
}

function drawSpectrumFromHistory(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  history: Uint8Array[],
) {
  if (history.length === 0) return

  const bufferLength = history[0].length
  const maxHistory = history.length
  const columnWidth = width / maxHistory
  const rowHeight = height / (bufferLength * 0.5)

  const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
  bgGradient.addColorStop(0, "#120810")
  bgGradient.addColorStop(1, "#080508")
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)

  history.forEach((data, colIndex) => {
    for (let i = 0; i < bufferLength * 0.5; i++) {
      const value = data[i]
      if (value < 5) continue

      const freqRatio = i / (bufferLength * 0.5)
      const hue = 350 + freqRatio * 30
      const adjustedHue = hue > 360 ? hue - 360 : hue
      const lightness = 20 + (value / 255) * 50
      const saturation = 50 + (value / 255) * 50
      const alpha = 0.3 + (value / 255) * 0.7

      ctx.fillStyle = `oklch(${lightness / 100} ${saturation / 400} ${adjustedHue} / ${alpha})`
      ctx.fillRect(
        colIndex * columnWidth,
        height - (i + 1) * rowHeight,
        columnWidth + 1,
        rowHeight + 1,
      )
    }
  })

  ctx.globalCompositeOperation = "screen"
  history.forEach((data, colIndex) => {
    for (let i = 0; i < bufferLength * 0.3; i++) {
      const value = data[i]
      if (value > 180) {
        ctx.fillStyle = `oklch(0.75 0.14 350 / ${(value - 180) / 300})`
        ctx.fillRect(
          colIndex * columnWidth - 2,
          height - (i + 1) * rowHeight - 2,
          columnWidth + 4,
          rowHeight + 4,
        )
      }
    }
  })
  ctx.globalCompositeOperation = "source-over"
}

export const Spectrogram = forwardRef<SpectrogramHandle, SpectrogramProps>(
  function Spectrogram({ analyser, isRecording, sessionActive }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number>(0)
    const historyRef = useRef<Uint8Array[]>([])

    const liveMode = !!analyser && isRecording

    useImperativeHandle(ref, () => ({
      getSnapshot: () => {
        const canvas = canvasRef.current
        if (!canvas || historyRef.current.length === 0) return null
        const w = canvas.width
        const h = canvas.height
        if (w < 8 || h < 8) return null
        const maxW = 480
        const scale = Math.min(1, maxW / w)
        const tw = Math.max(1, Math.floor(w * scale))
        const th = Math.max(1, Math.floor(h * scale))
        const tmp = document.createElement("canvas")
        tmp.width = tw
        tmp.height = th
        const tctx = tmp.getContext("2d")
        if (!tctx) return null
        tctx.drawImage(canvas, 0, 0, w, h, 0, 0, tw, th)
        try {
          return tmp.toDataURL("image/jpeg", 0.82)
        } catch {
          return null
        }
      },
    }))

    useEffect(() => {
      if (isRecording) {
        historyRef.current = []
      }
    }, [isRecording])

    useEffect(() => {
      if (!sessionActive) {
        historyRef.current = []
      }
    }, [sessionActive])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const draw = () => {
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        const width = rect.width
        const height = rect.height

        if (width < 2 || height < 2) {
          animationRef.current = requestAnimationFrame(draw)
          return
        }

        if (
          canvas.width !== rect.width * dpr ||
          canvas.height !== rect.height * dpr
        ) {
          canvas.width = rect.width * dpr
          canvas.height = rect.height * dpr
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.scale(dpr, dpr)
        }

        const maxHistory = Math.max(8, Math.floor(width / 3))

        if (liveMode && analyser) {
          const bufferLength = analyser.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          analyser.getByteFrequencyData(dataArray)

          historyRef.current.push(new Uint8Array(dataArray))
          if (historyRef.current.length > maxHistory) {
            historyRef.current.shift()
          }

          drawSpectrumFromHistory(ctx, width, height, historyRef.current)
        } else if (sessionActive && historyRef.current.length > 0) {
          drawSpectrumFromHistory(ctx, width, height, historyRef.current)
        } else {
          ctx.fillStyle = "#120810"
          ctx.fillRect(0, 0, width, height)

          const time = Date.now() / 1000
          for (let x = 0; x < width; x += 4) {
            for (let y = 0; y < height; y += 4) {
              const noise =
                Math.sin(x * 0.03 + time * 0.8) *
                  Math.cos(y * 0.03 + time * 0.5) *
                  0.5 +
                0.5
              const value = noise * 40
              const hue = 350 + (y / height) * 20
              ctx.fillStyle = `oklch(0.18 0.06 ${hue > 360 ? hue - 360 : hue} / ${0.2 + value * 0.01})`
              ctx.fillRect(x, y, 4, 4)
            }
          }

          ctx.fillStyle = "oklch(0.55 0.1 350 / 0.6)"
          ctx.font = "14px system-ui"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText("Awaiting voice input...", width / 2, height / 2)
        }

        animationRef.current = requestAnimationFrame(draw)
      }

      draw()

      return () => {
        cancelAnimationFrame(animationRef.current)
      }
    }, [analyser, isRecording, liveMode, sessionActive])

    return (
      <canvas
        ref={canvasRef}
        className="h-52 w-full rounded-xl"
        style={{ width: "100%", height: "208px" }}
      />
    )
  },
)
