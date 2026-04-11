import type { GameState } from '../../domain/game'
import { selectHeaderViewModel } from '../../application/game/selectors'
import { Button } from '../system'
import { HeaderStat } from '../components/HeaderStat'

interface AppHeaderProps<TTab extends string> {
  state: GameState
  demand: string
  phaseLabel: string
  tabs: Array<{ id: TTab; label: string }>
  activeTab: TTab
  onTabChange: (tabId: TTab) => void
}

export function AppHeader<TTab extends string>({ state, demand, phaseLabel, tabs, activeTab, onTabChange }: AppHeaderProps<TTab>) {
  const viewModel = selectHeaderViewModel(state, demand, phaseLabel)

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/92 backdrop-blur">
      <div className="mx-auto flex max-w-[112rem] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 lg:py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs uppercase tracking-[0.38em] text-cyan-300/80">Universal Paperclips</p>
            <div className="hidden h-4 w-px bg-slate-800 sm:block" />
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Parity rebuild</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-full xl:max-w-[72rem] xl:grid-cols-8">
            {viewModel.stats.map((stat) => (
              <HeaderStat key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 border-t border-slate-800/80 pt-3">
          {tabs.map((tab) => (
            <Button key={tab.id} variant={activeTab === tab.id ? 'primary' : 'secondary'} onClick={() => onTabChange(tab.id)} type="button">
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  )
}
