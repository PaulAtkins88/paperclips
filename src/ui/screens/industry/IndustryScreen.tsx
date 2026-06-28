import type { RefObject } from 'react'
import { formatCurrency, formatNumber, type GameAction, type GameState } from '../../../domain/game'
import { selectIndustryScreenViewModel } from '../../../application/game/selectors'
import { ActionPanel } from '../../components/ActionPanel'
import { TrustThresholdMeter } from '../../components/TrustThresholdMeter'
import { Button, CardGrid, InfoRow, PanelCard } from '../../system'
import { SwarmPanel } from '../../components/SwarmPanel'
import { QChipVisualizer } from '../../components/QChipVisualizer'
import { useShowQOps } from '../../../application/game/useShowQOps'
import { canCreateTournament, canRunTournament, getTournamentRoundNumber, getTournamentTotalRounds } from '../../../domain/strategy/tournaments'

interface IndustryScreenProps {
  state: GameState
  dispatch: (action: GameAction) => void
  demand: string
  priceInputRef: RefObject<HTMLInputElement | null>
  onOpenProjects: () => void
}

export function IndustryScreen({ state, dispatch, demand, priceInputRef, onOpenProjects }: IndustryScreenProps) {
  const { showQOps, triggerShowQOps } = useShowQOps()
  const viewModel = selectIndustryScreenViewModel(state, demand, showQOps)

  return (
    <CardGrid>
      <ActionPanel
        title="Automation"
        description="Auto-clippers turn wire into clips every tick. MegaClippers unlock through the project system once you reach 75 AutoClippers."
        tooltip="Automation now follows the original structure: AutoClippers are buyable directly and MegaClippers unlock via projects."
        primaryLabel="Buy auto-clipper"
        primaryTooltip={`Costs ${formatCurrency(state.production.autoClipperCost)} and adds one clip per second.`}
        onPrimary={() => dispatch({ type: 'buyAutoClipper' })}
        disabled={!state.earth.humanFlag}
        note={viewModel.automationNote}
        secondaryLabel="Buy mega-clipper"
        secondaryTooltip={state.projects.project22 ? 'Buy one MegaClipper.' : 'Unlock MegaClippers via the project chain first.'}
        onSecondary={() => dispatch({ type: 'buyMegaClipper' })}
      />

      <ActionPanel
        title="Marketing"
        description="Marketing purchases increase the marketing level and double the next ad buy cost."
        tooltip="This follows the original ad-buy loop instead of treating marketing as a one-time project."
        primaryLabel="Buy ads"
        primaryTooltip={`Costs ${formatCurrency(state.economy.adCost)} and raises marketing to level ${formatNumber(state.production.marketingLevel + 1)}.`}
        onPrimary={() => dispatch({ type: 'buyMarketing' })}
        disabled={!state.earth.humanFlag}
        note={viewModel.marketingNote}
      />

      {viewModel.showPostHuman ? (
        <PanelCard className="p-3 sm:p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Post-human transition</p>
          <h3 className="font-display mt-1 text-sm font-semibold text-white sm:text-base">Earth automation status</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            The next tranche now covers the HypnoDrone release and the first Earth automation unlock chain.
          </p>
          <div className="mt-3 grid gap-1.5 text-sm text-slate-300">
            {viewModel.transitionRows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </PanelCard>
      ) : null}

      {viewModel.showEarthProduction ? (
        <PanelCard className="p-3 sm:p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Earth production</p>
          <h3 className="font-display mt-1 text-sm font-semibold text-white sm:text-base">Terrestrial automation</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Buy harvesters, wire drones, and factories with unused clips once the Earth automation chain is unlocked.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button disabled={state.earth.humanFlag || !state.earth.harvesterFlag || state.production.unusedClips < state.earth.harvesterCost} onClick={() => dispatch({ type: 'buyHarvester' })} type="button">
              Buy harvester
            </Button>
            <Button disabled={state.earth.humanFlag || !state.earth.harvesterFlag || state.earth.harvesterLevel === 0} onClick={() => dispatch({ type: 'rebootHarvesters' })} variant="secondary" tooltip={viewModel.harvesterDisassembleTooltip} type="button">
              Disassemble all harvesters
            </Button>
            <Button disabled={state.earth.humanFlag || !state.earth.wireDroneFlag || state.production.unusedClips < state.earth.wireDroneCost} onClick={() => dispatch({ type: 'buyWireDrone' })} type="button">
              Buy wire drone
            </Button>
            <Button disabled={state.earth.humanFlag || !state.earth.wireDroneFlag || state.earth.wireDroneLevel === 0} onClick={() => dispatch({ type: 'rebootWireDrones' })} variant="secondary" tooltip={viewModel.wireDroneDisassembleTooltip} type="button">
              Disassemble all wire drones
            </Button>
            <Button disabled={state.earth.humanFlag || !state.earth.factoryFlag || state.production.unusedClips < state.earth.factoryCost} onClick={() => dispatch({ type: 'buyFactory' })} type="button">
              Buy factory
            </Button>
            <Button disabled={state.earth.humanFlag || !state.earth.factoryFlag || state.earth.factoryLevel === 0} onClick={() => dispatch({ type: 'rebootFactories' })} variant="secondary" tooltip={viewModel.factoryDisassembleTooltip} type="button">
              Disassemble all factories
            </Button>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{viewModel.earthProductionNote}</p>
        </PanelCard>
      ) : null}

      {viewModel.showPowerGrid ? (
        <PanelCard className="p-3 sm:p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Power grid</p>
          <h3 className="font-display mt-1 text-sm font-semibold text-white sm:text-base">Earth power management</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Solar farms generate power, battery towers store excess output, and terrestrial production slows under power deficits.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button disabled={state.earth.humanFlag || !state.earth.powerGridFlag || state.production.unusedClips < state.earth.farmCost} onClick={() => dispatch({ type: 'buyFarm' })} type="button">
              Buy solar farm
            </Button>
            <Button disabled={state.earth.humanFlag || !state.earth.powerGridFlag || state.earth.farmLevel === 0} onClick={() => dispatch({ type: 'rebootFarms' })} variant="secondary" tooltip={viewModel.farmDisassembleTooltip} type="button">
              Disassemble all solar farms
            </Button>
            <Button disabled={state.earth.humanFlag || !state.earth.powerGridFlag || state.production.unusedClips < state.earth.batteryCost} onClick={() => dispatch({ type: 'buyBattery' })} type="button">
              Buy battery tower
            </Button>
            <Button disabled={state.earth.humanFlag || !state.earth.powerGridFlag || state.earth.batteryLevel === 0} onClick={() => dispatch({ type: 'rebootBatteries' })} variant="secondary" tooltip={viewModel.batteryDisassembleTooltip} type="button">
              Disassemble all battery towers
            </Button>
          </div>
          <div className="mt-3 grid gap-1.5 text-sm text-slate-300">
            {viewModel.powerRows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{viewModel.powerNote}</p>
        </PanelCard>
      ) : null}

      {viewModel.showCompute ? (
        <ActionPanel
          title="Compute"
          description="Processors generate ops. Memory raises max ops. Creativity only starts once ops storage is full."
          tooltip="This ports the original trust, processor, memory, and operations layer into the current shell."
          primaryLabel="Add processor"
          primaryTooltip="Spend one available trust slot on another processor."
          onPrimary={() => dispatch({ type: 'addProcessor' })}
          disabled={!state.compute.unlocked}
          note={viewModel.computeNote}
          secondaryLabel="Add memory"
          secondaryTooltip="Spend one available trust slot on more memory."
          onSecondary={() => dispatch({ type: 'addMemory' })}
          footer={<TrustThresholdMeter state={state} />}
        />
      ) : null}

      {viewModel.showSwarmComputing ? (
        <SwarmPanel
          droneCount={viewModel.droneCount}
          swarmStatus={viewModel.swarmStatus}
          timeUntilSwarmGift={viewModel.timeUntilSwarmGift}
          canEntertain={viewModel.canEntertain}
          entertainCostNote={viewModel.entertainCostNote}
          onEntertainSwarm={() => dispatch({ type: 'entertainSwarm' })}
          canSynchronize={viewModel.canSynchronize}
          synchronizeCostNote={viewModel.synchronizeCostNote}
          onSynchronizeSwarm={() => dispatch({ type: 'synchronizeSwarm' })}
          swarmSliderPosition={state.compute.swarmComputingBalance}
          onDrag={workThinkBalance => dispatch({ type: 'setSwarmComputingBalance', workThinkBalance })}
          />
        ) : null}

      {viewModel.showQuantumCompute ? (
        <ActionPanel
          title="Quantum Computing"
          description="Use probability amplitudes to generate bonus ops."
          tooltip="Harvest quantum operations by clicking Compute at peak wave amplitude."
          primaryLabel="Quantum Compute"
          onPrimary={() => {
            dispatch({ type: 'quantumCompute' })
            triggerShowQOps()
          }}
          note={viewModel.quantumNote}
          footer={<QChipVisualizer chips={state.compute.qChips} qClock={state.compute.qClock} />}
        />
      ) : null}

      <ActionPanel
        title="Pricing"
        description="Adjust sales price in dollars to influence demand."
        tooltip="Pricing is available from the beginning, like the original game."
        primaryLabel="Apply price"
        primaryTooltip="Apply the value from the price input."
        secondaryLabel="Lower by $0.01"
        secondaryTooltip="Reduce the current clip price by one cent."
        onPrimary={() => {
          const parsed = Number.parseFloat(priceInputRef.current?.value ?? '')
          if (!Number.isNaN(parsed)) {
            dispatch({ type: 'setPrice', price: parsed })
          }
        }}
        onSecondary={() => {
          const nextPrice = state.economy.clipPrice - 0.01
          dispatch({ type: 'setPrice', price: nextPrice })
          if (priceInputRef.current) {
            priceInputRef.current.value = nextPrice.toFixed(2)
          }
        }}
        note={viewModel.pricingNote}
      />

      {viewModel.showCompute ? (
        <ActionPanel
          title="Creativity"
          description="Creativity is now unlocked through the project system once operations storage is full, then it accrues only while ops stay capped."
          tooltip="The project tab now handles the original creativity unlock and follow-up trust projects."
          primaryLabel="Open projects"
          primaryTooltip="Switch to the active project list."
          onPrimary={onOpenProjects}
          note={viewModel.creativityNote}
        />
      ) : null}

      {viewModel.showInvestment ? (
        <PanelCard className="p-3 sm:p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Investment engine</p>
          <h3 className="font-display mt-1 text-sm font-semibold text-white sm:text-base">Algorithmic trading</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Deposit dollars into the portfolio, cycle risk appetite, and upgrade the trading model with Yomi.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button disabled={!state.investment.unlocked || state.production.funds <= 0} onClick={() => dispatch({ type: 'investDeposit' })} type="button">
              Deposit funds
            </Button>
            <Button disabled={!state.investment.unlocked || state.investment.bankroll <= 0} onClick={() => dispatch({ type: 'investWithdraw' })} type="button" variant="secondary">
              Withdraw funds
            </Button>
            <Button disabled={!state.investment.unlocked} onClick={() => dispatch({ type: 'cycleInvestmentRisk' })} type="button" variant="secondary">
              Risk: {state.investment.riskMode}
            </Button>
            <Button disabled={!state.investment.unlocked || state.strategy.yomi < state.investment.investUpgradeCost} onClick={() => dispatch({ type: 'investUpgrade' })} type="button">
              Upgrade model
            </Button>
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{viewModel.investmentNote}</p>
        </PanelCard>
      ) : null}

      {viewModel.showStrategy ? (
        <PanelCard className="p-3 sm:p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Tournament engine</p>
          <h3 className="font-display mt-1 text-sm font-semibold text-white sm:text-base">Strategic modeling</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Run tournaments to generate Yomi after Strategic Modeling unlocks, then expand the strategy set through projects.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button disabled={!canCreateTournament(state)} onClick={() => dispatch({ type: 'createNewTournament' })} type="button">
              Create tournament
            </Button>
            <Button disabled={!canRunTournament(state)} onClick={() => dispatch({ type: 'runTournament' })} type="button">
              Run tournament
            </Button>
            <Button disabled={!state.strategy.unlocked} onClick={() => dispatch({ type: 'cycleStrategySelection' })} type="button" variant="secondary">
              {viewModel.selectedStrategyLabel}
            </Button>
            <Button disabled={!state.projects.project118} onClick={() => dispatch({ type: 'toggleAutoTourney' })} type="button" variant="secondary">
              {state.strategy.autoTourneyEnabled ? 'Disable AutoTourney' : 'Enable AutoTourney'}
            </Button>
          </div>
          {state.strategy.tourneyStarted && (
            <p>Round {getTournamentRoundNumber(state)} / {getTournamentTotalRounds(state)}</p>
          )}
          {state.strategy.lastPayoffMatrix ? (
            <table className="mt-3 w-full text-sm text-slate-300">
              <thead>
                <tr>
                  <th />
                  <th className="text-center font-normal pb-1">Move A</th>
                  <th className="text-center font-normal pb-1">Move B</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-right pr-2">Move A</td>
                  <td className="text-center border border-slate-600 p-1">{state.strategy.lastPayoffMatrix.AA},{state.strategy.lastPayoffMatrix.AA}</td>
                  <td className="text-center border border-slate-600 p-1">{state.strategy.lastPayoffMatrix.AB},{state.strategy.lastPayoffMatrix.BA}</td>
                </tr>
                <tr>
                  <td className="text-right pr-2">Move B</td>
                  <td className="text-center border border-slate-600 p-1">{state.strategy.lastPayoffMatrix.BA},{state.strategy.lastPayoffMatrix.AB}</td>
                  <td className="text-center border border-slate-600 p-1">{state.strategy.lastPayoffMatrix.BB},{state.strategy.lastPayoffMatrix.BB}</td>
                </tr>
              </tbody>
            </table>
          ) : null}
          {state.strategy.lastResults.length > 0 ? (
            <ol className="mt-3 list-decimal list-inside columns-2 gap-x-6 text-sm text-slate-300">
              {state.strategy.lastResults.map(result => (
                <li key={result.id} className={result.id === state.strategy.selectedStrategy ? 'font-bold text-white' : undefined}>
                  <div className="inline-flex justify-between w-[calc(100%-1.5rem)]">
                    <span>{result.id}</span>
                    <span>{result.score}</span>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{viewModel.strategyNote}</p>
        </PanelCard>
      ) : null}
    </CardGrid>
  )
}
