import { formatNumber, type GameState } from '../../domain/game'

interface TrustThresholdMeterProps {
  state: GameState
}

export function TrustThresholdMeter({ state }: TrustThresholdMeterProps) {
  const trustProgress = Math.min(100, (state.production.clips / state.compute.nextTrust) * 100)

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
      <div className="flex items-baseline justify-between gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
        <span>Trust threshold</span>
        <span>
          {formatNumber(state.production.clips)} / {formatNumber(state.compute.nextTrust)}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-cyan-400 transition-[width] duration-300" style={{ width: `${trustProgress}%` }} />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        Current trust: {formatNumber(state.compute.trust)}. Reach the next threshold to earn another point.
      </p>
    </div>
  )
}
