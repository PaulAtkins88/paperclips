import type { GameAction, GameState } from '../../../domain/game'
import { selectCombatScreenViewModel } from '../../../application/game/selectors'
import { ClipScene } from '../../components/ClipScene'
import { Button, CardGrid, InfoRow, SectionCard } from '../../system'

interface CombatScreenProps {
  state: GameState
  dispatch: (action: GameAction) => void
}

export function CombatScreen({ state, dispatch }: CombatScreenProps) {
  const viewModel = selectCombatScreenViewModel(state)

  return (
    <CardGrid>
      <SectionCard title="Combat layer" tooltip="Combat state and unlock status." >
        <h3 className="font-display mt-2 text-xl font-semibold text-white">
          {viewModel.combatUnlocked ? 'Combat systems are online.' : 'Combat has not been unlocked yet.'}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {viewModel.combatUnlocked
            ? 'Battles can now be monitored on their own screen. Probe combat trust feeds the same battle resolution already running in the domain, and the late combat chain now carries OODA and honor progression.'
            : 'Take the first combat losses in space, then complete the Combat project to unlock this surface.'}
        </p>
        <div className="mt-3 grid gap-1.5 text-sm text-slate-300 sm:grid-cols-2">
          {viewModel.statusRows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Battle telemetry" tooltip="Current battle state and available actions.">
        <h3 className="font-display mt-2 text-xl font-semibold text-white">Current engagement</h3>
        <div className="mt-3 grid gap-1.5 text-sm text-slate-300 sm:grid-cols-2">
          {viewModel.telemetryRows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            disabled={!viewModel.combatUnlocked || viewModel.availableProbeTrust <= 0}
            onClick={() => dispatch({ type: 'assignProbeTrust', target: 'combat' })}
            type="button"
            variant="secondary"
          >
            Add Combat
          </Button>
          <Button
            disabled={!viewModel.honorUnlocked || state.space.honor < state.space.maxTrustCost}
            onClick={() => dispatch({ type: 'increaseMaxTrust' })}
            type="button"
            variant="secondary"
        >
          Increase Max Trust
        </Button>
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{viewModel.note}</p>
      </SectionCard>

      <SectionCard title="Clip scene" tooltip="Decorative telemetry retained while the dedicated combat presentation remains in progress." className="md:col-span-2">
        <div>
          <ClipScene state={state} />
        </div>
      </SectionCard>
    </CardGrid>
  )
}
