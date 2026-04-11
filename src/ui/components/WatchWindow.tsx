import type { GameState } from '../../domain/game'
import { selectWatchWindowViewModel } from '../../application/game/selectors'
import { CardGrid, InfoRow, SectionCard, StatChip, Surface } from '../system'
import { LiveMeter } from './LiveMeter'
import { ClipScene } from './ClipScene'

interface WatchWindowProps {
  state: GameState
}

export function WatchWindow({ state }: WatchWindowProps) {
  const viewModel = selectWatchWindowViewModel(state)

  return (
    <Surface className="overflow-hidden p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Overview dashboard</p>
          <h3 className="font-display mt-1 text-base font-semibold text-white">Readable factory state, with a compact live artifact.</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            The overview stays focused on decisions first, but keeps a small animated clip artifact as a visual pulse for the current run.
          </p>
        </div>
        <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
          Decision view
        </div>
      </div>
      <div className="mt-3 grid gap-4">
        <CardGrid className="xl:grid-cols-3">
          <SectionCard title="Business" tooltip="Revenue, clip output, and production efficiency." className="bg-slate-950/70">
            <div className="mt-2 grid gap-1.5 text-sm text-slate-300">
              {viewModel.businessRows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Current focus" tooltip="The active decision set and what it is prioritizing right now." className="bg-slate-950/70">
            <div className="mt-2 grid grid-cols-2 gap-2">
              {viewModel.focusChips.map((chip) => (
                <StatChip key={chip.label} label={chip.label} value={chip.value} />
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Live artifact" tooltip="A compact visual pulse from the current factory state." className="bg-slate-950/70">
            <div className="mt-2 h-40 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
              <ClipScene state={state} />
            </div>
          </SectionCard>
        </CardGrid>

        <CardGrid className={viewModel.showCompute || viewModel.showPostHuman || viewModel.showSpace ? 'xl:grid-cols-2' : 'md:grid-cols-2'}>
          {viewModel.showCompute ? (
            <SectionCard title="Compute" tooltip="Processors, memory, and operations storage." className="bg-slate-950/70">
              <div className="mt-2 grid gap-1.5 text-sm text-slate-300">
                {viewModel.computeRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </SectionCard>
          ) : null}
          {viewModel.showPostHuman ? (
            <SectionCard title="Earth" tooltip="Earth automation and post-human production state." className="bg-slate-950/70">
              <div className="mt-2 grid gap-1.5 text-sm text-slate-300">
                {viewModel.earthRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </SectionCard>
          ) : null}
          {viewModel.showSpace ? (
            <SectionCard title="Space" tooltip="Probe operations, exploration, and interstellar production." className="bg-slate-950/70 xl:col-span-2">
              <div className="mt-2 grid gap-1.5 text-sm text-slate-300 md:grid-cols-2">
                {viewModel.spaceRows.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </SectionCard>
          ) : null}
        </CardGrid>

        <CardGrid className="xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <SectionCard title="Live throughput" tooltip="The latest tick’s production, sales, and revenue." className="bg-slate-950/70">
            <div className="mt-2 grid gap-2">
              <LiveMeter label="Clip output" value={state.lastTickProduction} accent="cyanish" tooltip="Clips produced during the latest tick." />
              <LiveMeter label="Sales velocity" value={state.lastTickSales} accent="violet" tooltip="Clips sold during the latest tick." />
              <LiveMeter label="Revenue" value={state.lastTickRevenue} prefix="$" suffix="/ tick" accent="emerald" tooltip="Revenue earned during the latest tick." />
            </div>
          </SectionCard>
        </CardGrid>
      </div>
    </Surface>
  )
}
