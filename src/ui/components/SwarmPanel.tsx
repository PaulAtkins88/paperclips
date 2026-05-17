import { SectionCard } from '../system'
import { formatNumber } from '../../domain/game'

interface SwarmPanelProps {
  droneCount: number
  droneStatus: 'Active' | 'Disorganized' | 'Bored'
  timeUntilSwarmGift: string | null
  swarmSliderPosition: number
  onDrag: (workThinkBalance: number) => void
}

export function SwarmPanel({
  droneCount,
  droneStatus,
  timeUntilSwarmGift,
  swarmSliderPosition,
  onDrag,
}: SwarmPanelProps) {
  return (
    <SectionCard title="Swarm Computing" tooltip="Swarm Computing">
      <p className="text-sm leading-6 text-slate-300">Set the swarm computing parameters.</p>
      <div className="mt-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-baseline justify-between gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
            <span>Drone totals</span>
            <span>{formatNumber(droneCount)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
            <span>Swarm status</span>
            <span>{droneStatus}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
            <span>Time until next gift</span>
            <span>{timeUntilSwarmGift}</span>
          </div>
          <input type="range" className="accent-cyan-400 w-full" value={swarmSliderPosition} max={100} onChange={e => { onDrag(e.target.valueAsNumber) }} />
        </div>
      </div>
    </SectionCard>
  )
}
