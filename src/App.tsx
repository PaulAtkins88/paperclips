import { useEffect, useMemo, useRef, useState } from 'react'
import { exportGame, importGame, saveGame } from './application/save/storage'
import { useGameController } from './application/game/useGameController'
import {
  canFundProject,
  getActiveProjects,
  getProjectProgress,
  getStallState,
  getWireBatchCost,
  type ProjectId,
} from './domain/game'
import { AppHeader } from './ui/layout/AppHeader'
import { StatusSidebar } from './ui/layout/StatusSidebar'
import { OverviewScreen } from './ui/screens/overview/OverviewScreen'
import { IndustryScreen } from './ui/screens/industry/IndustryScreen'
import { ProjectsScreen } from './ui/screens/projects/ProjectsScreen'
import { SpaceScreen } from './ui/screens/space/SpaceScreen'
import { CombatScreen } from './ui/screens/combat/CombatScreen'
import { Button, Surface } from './ui/system'

type TabId = 'overview' | 'industry' | 'projects' | 'space' | 'combat'

const WIRE_SPOOL_BATCHES = [1, 5] as const

function App() {
  const { state, dispatch, tickMs } = useGameController()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [importValue, setImportValue] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const priceInputRef = useRef<HTMLInputElement>(null)

  const demand = useMemo(() => `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(state.economy.demand * 10)}%`, [state.economy.demand])
  const clipPrice = useMemo(() => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(state.economy.clipPrice), [state.economy.clipPrice])
  const progress = useMemo(() => getProjectProgress(state), [state])
  const stall = useMemo(() => getStallState(state), [state])
  const activeProjects = useMemo(() => getActiveProjects(state), [state])
  const visibleTabs = useMemo(() => {
    const tabs: Array<{ id: TabId; label: string }> = [{ id: 'overview', label: 'Overview' }]

    if (state.phase !== 'boot') {
      tabs.push({ id: 'industry', label: 'Industry' })
    }

    if (activeProjects.length > 0 || Object.values(state.projects).some(Boolean)) {
      tabs.push({ id: 'projects', label: 'Projects' })
    }

    if (state.earth.spaceFlag) {
      tabs.push({ id: 'space', label: 'Space' })
    }

    if (state.projects.project131) {
      tabs.push({ id: 'combat', label: 'Combat' })
    }

    return tabs
  }, [activeProjects.length, state.earth.spaceFlag, state.phase, state.projects])
  const wireBatchCosts = useMemo(
    () =>
      Object.fromEntries(
        WIRE_SPOOL_BATCHES.map((amount) => [amount, getWireBatchCost(state, amount)]),
      ) as Record<(typeof WIRE_SPOOL_BATCHES)[number], number>,
    [state],
  )

  const phaseLabel = {
    boot: 'Boot',
    industry: 'Industry',
    compute: 'Compute',
    expansion: 'Expansion',
  }[state.phase]

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab('overview')
    }
  }, [activeTab, visibleTabs])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppHeader state={state} demand={demand} phaseLabel={phaseLabel} tabs={visibleTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto grid max-w-[112rem] gap-4 px-4 py-4 sm:px-6 lg:min-h-[calc(100vh-8.5rem)] lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.55fr)] lg:px-8 lg:py-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(24rem,0.45fr)] 2xl:grid-cols-[minmax(0,1.62fr)_minmax(26rem,0.42fr)]">
        <section className="grid content-start gap-4">
          {stall.stalled ? (
            <Surface tone="warning" className="text-amber-100">
              <p className="text-sm uppercase tracking-[0.25em] text-amber-200/80">Game stalled</p>
              <h2 className="mt-2 text-xl font-semibold text-white">You have no viable moves left.</h2>
              <p className="mt-2 text-sm leading-6 text-amber-50/90">{stall.reason}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" className="bg-white text-slate-950 hover:bg-amber-50" onClick={() => dispatch({ type: 'reset' })} type="button">
                  Restart run
                </Button>
                <Button variant="danger" onClick={() => dispatch({ type: 'togglePause' })} type="button">
                  {state.paused ? 'Resume' : 'Pause'}
                </Button>
              </div>
            </Surface>
          ) : null}

          <Surface className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Core Loop</p>
                <h2 className="font-display mt-2 text-xl font-semibold text-white">Make clips, sell clips, scale production.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Business values are back in dollars, while inventory and raw material remain physical counts in the domain model.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[20rem]">
                <MetricSummary label="Price per Clip" value={clipPrice} />
                <MetricSummary label="AutoClippers" value={String(state.production.autoClippers)} />
                <MetricSummary label="Marketing" value={`Level ${state.production.marketingLevel}`} />
                <MetricSummary label="Wire Spool" value={String(state.economy.wireSupply)} />
                <MetricSummary label="Ops / Max" value={`${state.compute.operations}/${state.compute.memory * 1000}`} />
                <MetricSummary label="Yomi" value={String(state.strategy.yomi)} />
                <MetricSummary label="Projects" value={progress} />
              </div>
            </div>
          </Surface>

          <div className="grid gap-3">
            {activeTab === 'overview' ? (
              <OverviewScreen
                state={state}
                dispatch={dispatch}
                clipPrice={clipPrice}
                wireSpoolBatches={WIRE_SPOOL_BATCHES}
                wireBatchCosts={wireBatchCosts}
                priceInputRef={priceInputRef}
              />
            ) : null}

            {activeTab === 'industry' ? (
              <IndustryScreen
                state={state}
                dispatch={dispatch}
                demand={demand}
                priceInputRef={priceInputRef}
                onOpenProjects={() => setActiveTab('projects')}
              />
            ) : null}

            {activeTab === 'projects' ? (
              <ProjectsScreen
                activeProjects={activeProjects}
                canFundProject={(projectId: ProjectId) => canFundProject(state, projectId)}
                onCompleteProject={(projectId: ProjectId) => dispatch({ type: 'completeProject', projectId })}
              />
            ) : null}

            {activeTab === 'space' ? <SpaceScreen state={state} dispatch={dispatch} /> : null}

            {activeTab === 'combat' ? <CombatScreen state={state} dispatch={dispatch} /> : null}
          </div>
        </section>

        <StatusSidebar
          state={state}
          tickMs={tickMs}
          clipPrice={clipPrice}
          demand={demand}
          activeTab={activeTab}
          copyMessage={copyMessage}
          importValue={importValue}
          onImportValueChange={setImportValue}
          onExport={async () => {
            const payload = exportGame(state)
            await navigator.clipboard.writeText(payload)
            setCopyMessage('Export copied')
            window.setTimeout(() => setCopyMessage(''), 1800)
          }}
          onImport={() => {
            const imported = importGame(importValue)
            if (imported) {
              saveGame(imported)
              window.location.reload()
            }
          }}
        />
      </main>
    </div>
  )
}

function MetricSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-left">
      <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-white">{value}</div>
    </div>
  )
}

export default App
