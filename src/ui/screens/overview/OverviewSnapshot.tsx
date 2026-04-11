import type { GameState } from '../../../domain/game'
import { selectWatchWindowViewModel } from '../../../application/game/selectors'
import { ClipScene } from '../../components/ClipScene'
import { LiveMeter } from '../../components/LiveMeter'
import { InfoRow, PanelCard, SectionCard, StatChip } from '../../system'

interface OverviewSnapshotProps {
  state: GameState
}

export function OverviewSnapshot({ state }: OverviewSnapshotProps) {
  const viewModel = selectWatchWindowViewModel(state)

  return (
    <PanelCard className="p-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Factory snapshot</p>
          <h3 className="font-display mt-2 text-lg font-semibold text-white sm:text-xl">Current state.</h3>
        </div>
        <div className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-slate-300">
          Decision view
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(14rem,0.7fr)_minmax(18rem,1fr)_minmax(14rem,0.7fr)_minmax(18rem,1.1fr)]">
        <div className="grid gap-4">
          <SectionCard title="Business" tooltip="Funds, clips, demand, and wire stock." className="bg-slate-950/60">
            {viewModel.businessRows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </SectionCard>
        </div>

        <div className="grid gap-4">
          <SectionCard title="Current focus" tooltip="Phase, pause state, project progress, and strategy." className="bg-slate-950/60">
            <div className="grid grid-cols-2 gap-2">
              {viewModel.focusChips.map((chip) => (
                <StatChip key={chip.label} label={chip.label} value={chip.value} />
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-4">
          <SectionCard title="Live throughput" tooltip="What happened on the latest tick." className="bg-slate-950/60">
            <div className="grid gap-2">
              <LiveMeter label="Clip output" value={state.lastTickProduction} accent="cyanish" tooltip="Clips produced during the latest tick." />
              <LiveMeter label="Sales velocity" value={state.lastTickSales} accent="violet" tooltip="Clips sold during the latest tick." />
              <LiveMeter label="Revenue" value={state.lastTickRevenue} prefix="$" suffix="/ tick" accent="emerald" tooltip="Revenue earned during the latest tick." />
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-4">
          <SectionCard title="Live artifact" tooltip="A small clip scene for visual feedback." className="bg-slate-950/60">
            <div className="h-44 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
              <ClipScene state={state} />
            </div>
          </SectionCard>
        </div>
      </div>
    </PanelCard>
  )
}
