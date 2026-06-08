import { Button, InfoRow, SectionCard } from '../system'
import { formatNumber } from '../../domain/game'
import type { SwarmStatus } from '../../domain/compute/swarm'

interface SwarmPanelProps {
  droneCount: number
  swarmStatus: SwarmStatus
  timeUntilSwarmGift: string | null
  canEntertain: boolean
  entertainCostNote: string
  onEntertainSwarm: () => void
  canSynchronize: boolean
  synchronizeCostNote: string
  onSynchronizeSwarm: () => void
  swarmSliderPosition: number
  onDrag: (workThinkBalance: number) => void
}

export function SwarmPanel({
  droneCount,
  swarmStatus,
  timeUntilSwarmGift,
  canEntertain,
  entertainCostNote,
  onEntertainSwarm,
  canSynchronize,
  synchronizeCostNote,
  onSynchronizeSwarm,
  swarmSliderPosition,
  onDrag,
}: SwarmPanelProps) {
  return (
    <SectionCard title="Swarm Computing" tooltip="This is visible once the Swarm Computing project is completed.">
      <p className="text-sm leading-6 text-slate-300">Harness the drone fleet to generate computational gifts. Slide toward Think to generate gifts faster, at the cost of harvesting efficiency.</p>
      <div className="mt-4">
        <div>
          <InfoRow label="Drone count" value={formatNumber(droneCount)} />
          <InfoRow label="Swarm status" value={swarmStatus} />
          {timeUntilSwarmGift && <InfoRow label="Time until next gift" value={timeUntilSwarmGift} />}
        </div>
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-baseline justify-between gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
            <span>Work</span>
            <span>Think</span>
          </div>
          <input type="range" className="accent-cyan-400 w-full" value={swarmSliderPosition} max={100} onChange={e => { onDrag(e.target.valueAsNumber) }} />
        </div>
      </div>
      {swarmStatus === 'Bored' && (
        <>
          <Button onClick={onEntertainSwarm} disabled={!canEntertain} type="button" className="mt-4" tooltip="Entertain the Swarm">
            Entertain the Swarm
          </Button>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{entertainCostNote}</p>
        </>
      )}
      {swarmStatus === 'Disorganized' && (
        <>
          <Button onClick={onSynchronizeSwarm} disabled={!canSynchronize} type="button" className="mt-4" tooltip="Synchronize the Swarm">
            Synchronize the Swarm
          </Button>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{synchronizeCostNote}</p>
        </>
      )}
    </SectionCard>
  )
}
