import type { ChangeEvent } from 'react'
import type { GameState } from '../../domain/game'
import { selectStatusSidebarViewModel } from '../../application/game/selectors'
import { InfoRow, Button, Surface, Textarea } from '../system'
import { LiveMeter } from '../components/LiveMeter'
import { TrustThresholdMeter } from '../components/TrustThresholdMeter'

interface StatusSidebarProps {
  state: GameState
  tickMs: number
  clipPrice: string
  demand: string
  activeTab: string
  copyMessage: string
  importValue: string
  onImportValueChange: (value: string) => void
  onExport: () => Promise<void> | void
  onImport: () => void
}

export function StatusSidebar({
  state,
  tickMs,
  clipPrice,
  demand,
  activeTab,
  copyMessage,
  importValue,
  onImportValueChange,
  onExport,
  onImport,
}: StatusSidebarProps) {
  const viewModel = selectStatusSidebarViewModel(state, tickMs, clipPrice, demand, activeTab)

  return (
    <aside className="grid min-w-0 gap-3 self-start lg:sticky lg:top-3 lg:max-h-[calc(100vh-5.75rem)] lg:overflow-y-auto lg:pr-1">
      <Surface className="p-3 sm:p-4">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Status</p>
        <div className="mt-2 grid gap-1.5 text-sm text-slate-300">
          {viewModel.statusRows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </Surface>

      <Surface className="p-3 sm:p-4">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Live systems</p>
        <div className="mt-2 grid gap-2">
          <LiveMeter label="Clip throughput" value={state.lastTickProduction} accent="cyanish" tooltip="Clips produced during the latest tick." />
          <LiveMeter label="Sales velocity" value={state.lastTickSales} accent="violet" tooltip="Clips sold during the latest tick." />
          <LiveMeter label="Cashflow" value={state.lastTickRevenue} prefix="$" suffix="/ tick" accent="emerald" tooltip="Revenue earned during the latest tick." />
        </div>
        <div className="mt-3">
          <TrustThresholdMeter state={state} />
        </div>
      </Surface>

      {viewModel.compactOverview ? null : (
        <Surface className="p-3 sm:p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Save tools</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" tooltip="Export the current save state to the clipboard." onClick={onExport} type="button">
              Export save
            </Button>
            <Button variant="secondary" tooltip="Import a save from the text box below." onClick={onImport} type="button">
              Import save
            </Button>
          </div>
          <Textarea
            className="mt-2 min-h-16"
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onImportValueChange(event.target.value)}
            placeholder="Paste exported save JSON here"
            value={importValue}
          />
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">{copyMessage || 'Local browser storage is enabled.'}</p>
        </Surface>
      )}

      {viewModel.compactOverview ? (
        <Surface className="p-3 sm:p-4">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Save tools</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" tooltip="Export the current save state to the clipboard." onClick={onExport} type="button">
              Export
            </Button>
            <Button variant="secondary" tooltip="Import a save from the text box below." onClick={onImport} type="button">
              Import
            </Button>
          </div>
          <Textarea
            className="mt-2 min-h-14"
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onImportValueChange(event.target.value)}
            placeholder="Paste save JSON"
            value={importValue}
          />
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">{copyMessage || 'Browser save active.'}</p>
        </Surface>
      ) : null}

    </aside>
  )
}
