import { useEffect, useRef } from 'react'
import { COMPUTE_TICK_MS } from '../../domain/compute/constants'
import type { QChip } from '../../domain/compute/quantum'

interface QChipVisualizerProps {
  chips: QChip[]
  qClock: number
}

const WAVE_COLOR      = 'oklch(0.55 0.189 286.4 / 0.5)'
const COMPOSITE_COLOR = 'oklch(0.869 0.022 252.9 / 0.75)'
const DOT_COLOR       = 'oklch(0.765 0.177 163.2)'
const MARKER_COLOR    = 'oklch(0.755 0.118 164.9 / 0.25)'
const MIDLINE_COLOR   = 'oklch(0.79 0.158 211.6)'
const CLOCK_INCREMENT = 0.01

export function QChipVisualizer({ chips, qClock }: QChipVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chipsRef = useRef(chips)
  const clockRef = useRef(qClock)
  const lastTickTimestampRef = useRef(0)
  const animRef = useRef<number>(0)

  useEffect(() => {
    chipsRef.current = chips
  }, [chips])

  useEffect(() => {
    clockRef.current = qClock
    lastTickTimestampRef.current = performance.now()
  }, [qClock])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const W = canvas.width
      const H = canvas.height
      const mid = H / 2
      const chips = chipsRef.current
      const activeChips = chips.filter(c => c.active)

      const msElapsed = performance.now() - lastTickTimestampRef.current
      const clock = clockRef.current + (msElapsed / COMPUTE_TICK_MS) * CLOCK_INCREMENT

      ctx.clearRect(0, 0, W, H)

      // midline
      ctx.strokeStyle = MIDLINE_COLOR
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(0, mid)
      ctx.lineTo(W, mid)
      ctx.stroke()

      // individual chip waves — anchored at center so x=W/2 matches domain value
      for (const chip of activeChips) {
        ctx.beginPath()
        ctx.strokeStyle = WAVE_COLOR
        ctx.lineWidth = 1
        for (let x = 0; x < W; x++) {
          const t = ((x - W / 2) / W) * Math.PI * 8
          const y = mid - Math.sin(clock * chip.waveSeed + t * chip.waveSeed) * (mid * 0.7)
          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.stroke()
      }

      const q = activeChips.reduce((sum, chip) => sum + Math.sin(clock * chip.waveSeed), 0)
      const qNormalized = activeChips.length > 0 ? q / activeChips.length : 0
      const compositeAtCenter = mid - qNormalized * (mid * 0.85)

      // composite line
      ctx.beginPath()
      ctx.strokeStyle = COMPOSITE_COLOR
      ctx.lineWidth = 1.5
      for (let x = 0; x < W; x++) {
        const t = ((x - W / 2) / W) * Math.PI * 8
        let sum = 0
        for (const chip of activeChips) {
          sum += Math.sin(clock * chip.waveSeed + t * chip.waveSeed)
        }
        const y = mid - (activeChips.length > 0 ? sum / activeChips.length : 0) * (mid * 0.85)
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()

      // dashed vertical marker at center
      ctx.strokeStyle = MARKER_COLOR
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(W / 2, 0)
      ctx.lineTo(W / 2, H)
      ctx.stroke()
      ctx.setLineDash([])

      // dot pinned to extrapolated composite value
      ctx.fillStyle = DOT_COLOR
      ctx.beginPath()
      ctx.arc(W / 2, compositeAtCenter, 4, 0, Math.PI * 2)
      ctx.fill()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={100}
      className="w-full block"
      aria-label="Quantum chip wave superposition. Dot height at center marker indicates current qOps yield."
      role="img"
    />
  )
}
