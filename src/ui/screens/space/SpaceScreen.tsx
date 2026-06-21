import type { GameState } from '../../../domain/game'
import type { GameAction } from '../../../domain/game'
import { selectSpaceScreenViewModel } from '../../../application/game/selectors'
import { ClipScene } from '../../components/ClipScene'
import { Button, CardGrid, InfoRow, SectionCard } from '../../system'

interface SpaceScreenProps {
  state: GameState
  dispatch: (action: GameAction) => void
}

export function SpaceScreen({ state, dispatch }: SpaceScreenProps) {
  const viewModel = selectSpaceScreenViewModel(state)

  return (
    <CardGrid>
      <SectionCard title="Space layer" tooltip="Space exploration status and unlock state.">
        <h3 className="font-display mt-2 text-xl font-semibold text-white">{viewModel.spaceUnlocked ? 'Von Neumann probes are online.' : 'Space exploration is still locked.'}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {viewModel.spaceUnlocked
            ? 'Earth has been dismantled for the interstellar handoff. Early probe launch, trust allocation, exploration, hazards, drift, colonization, and first combat contact now follow the original rules, while the richer battle layer is still forthcoming.'
            : 'The next major threshold is exhausting Earth matter, storing enough power, and funding the Space Exploration project.'}
        </p>
        <div className="mt-3 grid gap-1.5 text-sm text-slate-300 sm:grid-cols-2">
          {viewModel.summaryRows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Probe program" tooltip="Probe launch, trust allocation, and space production controls.">
        <h3 className="font-display mt-2 text-xl font-semibold text-white">Initial space operations</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Launch probes with clips, buy probe trust with Yomi, then allocate trust into Speed and Exploration to discover matter. Replication, hazards, drift, and probe-built factories, harvesters, and wire drones now follow the original early space loop too.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button disabled={!viewModel.spaceUnlocked || state.production.unusedClips <= state.space.probeCost} onClick={() => dispatch({ type: 'launchProbe' })} type="button">
            Launch probe
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || state.strategy.yomi < state.space.probeTrustCost || state.space.probeTrust >= state.space.maxTrust} onClick={() => dispatch({ type: 'increaseProbeTrust' })} type="button" variant="secondary">
            Increase probe trust
          </Button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button disabled={!viewModel.spaceUnlocked || viewModel.availableProbeTrust <= 0} onClick={() => dispatch({ type: 'allocateProbeTrust', target: 'speed' })} type="button" variant="secondary">
            Add Speed
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || !viewModel.canDeallocateSpeed} onClick={() => dispatch({ type: 'deallocateProbeTrust', target: 'speed' })} type="button" variant="secondary">
            Remove Speed
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || viewModel.availableProbeTrust <= 0} onClick={() => dispatch({ type: 'allocateProbeTrust', target: 'nav' })} type="button" variant="secondary">
            Add Exploration
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || !viewModel.canDeallocateNav} onClick={() => dispatch({ type: 'deallocateProbeTrust', target: 'nav' })} type="button" variant="secondary">
            Remove Exploration
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || viewModel.availableProbeTrust <= 0} onClick={() => dispatch({ type: 'allocateProbeTrust', target: 'rep' })} type="button" variant="secondary">
            Add Replication
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || !viewModel.canDeallocateRep} onClick={() => dispatch({ type: 'deallocateProbeTrust', target: 'rep' })} type="button" variant="secondary">
            Remove Replication
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || viewModel.availableProbeTrust <= 0} onClick={() => dispatch({ type: 'allocateProbeTrust', target: 'haz' })} type="button" variant="secondary">
            Add Hazard Remediation
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || !viewModel.canDeallocateHaz} onClick={() => dispatch({ type: 'deallocateProbeTrust', target: 'haz' })} type="button" variant="secondary">
            Remove Hazard Remediation
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || viewModel.availableProbeTrust <= 0} onClick={() => dispatch({ type: 'allocateProbeTrust', target: 'fac' })} type="button" variant="secondary">
            Add Factory
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || !viewModel.canDeallocateFac} onClick={() => dispatch({ type: 'deallocateProbeTrust', target: 'fac' })} type="button" variant="secondary">
            Remove Factory
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || viewModel.availableProbeTrust <= 0} onClick={() => dispatch({ type: 'allocateProbeTrust', target: 'harv' })} type="button" variant="secondary">
            Add Harvester
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || !viewModel.canDeallocateHarv} onClick={() => dispatch({ type: 'deallocateProbeTrust', target: 'harv' })} type="button" variant="secondary">
            Remove Harvester
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || viewModel.availableProbeTrust <= 0} onClick={() => dispatch({ type: 'allocateProbeTrust', target: 'wire' })} type="button" variant="secondary">
            Add Wire Drone
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || !viewModel.canDeallocateWire} onClick={() => dispatch({ type: 'deallocateProbeTrust', target: 'wire' })} type="button" variant="secondary">
            Remove Wire Drone
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || !state.projects.project131 || viewModel.availableProbeTrust <= 0} onClick={() => dispatch({ type: 'allocateProbeTrust', target: 'combat' })} type="button" variant="secondary">
            Add Combat
          </Button>
          <Button disabled={!viewModel.spaceUnlocked || !state.projects.project131 || !viewModel.canDeallocateCombat} onClick={() => dispatch({ type: 'deallocateProbeTrust', target: 'combat' })} type="button" variant="secondary">
            Remove Combat
          </Button>
        </div>
        <div className="mt-3 grid gap-1.5 text-sm text-slate-300 sm:grid-cols-2">
          {viewModel.programRows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">{viewModel.note}</p>
      </SectionCard>

      <SectionCard title="Clip scene" tooltip="Rotating 3D clip ring. This graph is decorative telemetry for the factory state." className="md:col-span-2">
        <div>
          <ClipScene state={state} />
        </div>
      </SectionCard>
    </CardGrid>
  )
}
