# Universal Paperclips Parity Rebuild Plan

## Goal

Rebuild the current prototype into a rules-parity implementation of the original Universal Paperclips game while keeping the codebase maintainable, testable, and ready for multiple frontends.

Primary constraints:

- Original gameplay rules and progression are the source of truth.
- UX improvements are allowed when they do not change core rules.
- Save compatibility with the current prototype is not required.
- Verification should rely on golden parity tests.
- View code must stay separate from domain rules.

## Current Status

The current app is a polished prototype with a small reducer-based domain and React UI shell. It is not close to original parity. The main gaps are:

- deterministic sales instead of probabilistic sales
- simplified demand, wire, and pricing formulas
- only four projects instead of the original unlock graph
- missing trust, processors, memory, operations, creativity, yomi, investment, prestige
- missing post-human Earth automation and power systems
- missing space, probes, combat, honor, and endgame systems

## Architecture Target

Keep the application in a three-layer shape:

1. `domain/`
   Pure game rules, formulas, state transitions, and simulation logic.
2. `application/`
   Commands, ticking, persistence coordination, selectors, and adapters.
3. `ui/`
   React components and screen composition only.

The domain must not import React or reference DOM concerns.

## Proposed Module Boundaries

```text
src/
  app/
    App.tsx
    bootstrap.ts
    providers/
      GameProvider.tsx

  application/
    game/
      engine.ts
      reducer.ts
      commands.ts
      selectors.ts
      snapshot.ts
      tickScheduler.ts
      ports.ts
    save/
      storage.ts
      serialization.ts
      hydration.ts

  domain/
    state/
      gameState.ts
      resources.ts
      phases.ts
      flags.ts
      ids.ts
    simulation/
      rng.ts
      time.ts
      math.ts
      tick.ts
    economy/
      manualClips.ts
      sales.ts
      pricing.ts
      wireMarket.ts
      clippers.ts
      megaClippers.ts
      marketing.ts
    compute/
      trust.ts
      processors.ts
      memory.ts
      operations.ts
      creativity.ts
    investments/
      investments.ts
      stockMarket.ts
    strategy/
      tournaments.ts
      yomi.ts
      strategies.ts
    projects/
      projectTypes.ts
      projectRegistry.ts
      projectVisibility.ts
      projectCosts.ts
      projectEffects.ts
    earth/
      hypno.ts
      matter.ts
      drones.ts
      factories.ts
      power.ts
      swarm.ts
    space/
      probes.ts
      probeTrust.ts
      exploration.ts
      hazards.ts
      drift.ts
      probeProduction.ts
    combat/
      battleTypes.ts
      battleSimulation.ts
      war.ts
      honor.ts
    prestige/
      prestige.ts
      endgame.ts
    rules/
      progression.ts
      invariants.ts
      stall.ts

  ui/
    layout/
      AppShell.tsx
      Header.tsx
      Sidebar.tsx
      TabBar.tsx
    screens/
      overview/
        OverviewScreen.tsx
      economy/
        EconomyScreen.tsx
      compute/
        ComputeScreen.tsx
      projects/
        ProjectsScreen.tsx
      earth/
        EarthScreen.tsx
      space/
        SpaceScreen.tsx
      combat/
        CombatScreen.tsx
    components/
      ActionPanel.tsx
      ProjectCard.tsx
      MetricCard.tsx
      LiveMeter.tsx
      WatchWindow.tsx
      ClipScene.tsx
    view-models/
      overviewVm.ts
      economyVm.ts
      projectsVm.ts
      spaceVm.ts
```

## Canonical Domain Shape

Use one root game state with subsystem slices.

```ts
interface GameState {
  meta: MetaState
  phase: PhaseState
  resources: ResourceState
  economy: EconomyState
  compute: ComputeState
  investments: InvestmentState
  strategy: StrategyState
  projects: ProjectState
  earth: EarthState
  space: SpaceState
  combat: CombatState
  prestige: PrestigeState
  flags: FlagState
}
```

Important resource distinctions that must be preserved:

- `clips`
- `unsoldClips`
- `unusedClips`
- `funds`
- `wire`
- `operations`
- `creativity`
- `trust`
- `yomi`
- `honor`
- `mwSeconds`

## Simulation Rules

The new simulation engine should mirror the original two-cadence model:

- fast loop at `10ms`
- slow loop at `100ms`

Use an injected RNG interface so probabilistic systems can be reproduced in tests.

```ts
interface Rng {
  next(): number
}
```

Probabilistic behavior that must remain domain-controlled:

- sales checks
- wire price oscillation updates
- tournament and yomi generation where needed
- hazards
- drift
- combat rolls

## Project System

Projects should become data-driven definitions with typed rule hooks.

```ts
interface ProjectDefinition<TId extends string = string> {
  id: TId
  title: string
  description: string
  isVisible(state: GameState): boolean
  canActivate(state: GameState): boolean
  getCost(state: GameState): ResourceCost[]
  apply(state: GameState): GameState
  repeatable?: boolean
}
```

Implementation guidance:

- keep project definitions out of React
- split visibility, cost, and effect helpers into separate files
- allow repeatable projects such as wire begging or memorial-style actions
- prefer small helpers over a giant monolithic registry file

## Application Layer Responsibilities

The application layer should own:

- player commands
- tick scheduling
- save/load orchestration
- screen selectors and view models

Likely command set:

- `makeClip`
- `raisePrice`
- `lowerPrice`
- `buyWire`
- `buyClipper`
- `buyMegaClipper`
- `addProcessor`
- `addMemory`
- `activateProject`
- `runTournament`
- `makeFactory`
- `makeHarvester`
- `makeWireDrone`
- `launchProbe`
- `increaseProbeTrust`

## UI Guidance

The current visual system can be reused, but the view layer should gradually move into screen modules:

- overview
- economy
- compute
- projects
- Earth automation
- space
- combat

UI components should consume selectors or view models rather than encode formulas.

## Verification Strategy

Golden tests are required before broad UI migration.

High-priority parity tests:

1. Early economy
   - clip production
   - price stepping
   - demand formula
   - sales probability and quantity
   - wire price evolution
2. Compute systems
   - trust thresholds
   - ops accumulation
   - creativity generation only at op cap
3. Projects
   - visibility
   - affordability
   - one-shot and repeatable behavior
4. Earth automation
   - matter acquisition
   - wire conversion
   - factory production
   - power modifier behavior
5. Space
   - probe reproduction
   - exploration
   - hazards
   - drift
6. Combat
   - battle creation
   - seeded combat outcomes
   - honor effects

## Delivery Phases

### Phase 1

- create durable architecture scaffolding
- preserve current gameplay behavior
- move entrypoints to new folders

### Phase 2

- introduce canonical game state and simulation engine
- add deterministic plus seeded RNG test support

### Phase 3

- port human economy rules to parity
- add golden tests for early game

### Phase 4

- port trust, memory, processors, operations, creativity
- port project registry and unlock visibility

### Phase 5

- port investment, strategy, yomi, and trust-heavy project chains

### Phase 6

- port post-human Earth systems
- add power, matter, drones, factories, swarm behavior

### Phase 7

- port space, probes, hazards, drift, combat, honor, prestige

### Phase 8

- migrate UI screens fully onto selectors/view models
- remove obsolete prototype-only code

## Migration Notes

- The existing `src/domain/game.ts` should be treated as temporary scaffold code.
- The existing `src/application/storage.ts` concept is useful, but its schema is disposable.
- The existing `src/ui/system.tsx` and `src/ui/classes.ts` are good reusable view primitives.
- The current `App.tsx` should be broken apart gradually rather than rewritten in one unsafe jump.

## Immediate Next Build Steps

1. Add `app/` entry structure and re-home the current app shell without changing behavior.
2. Move storage into `application/save/` with a compatibility re-export.
3. Introduce stub files for the new `application/game/` and `domain/state/` boundaries.
4. Begin replacing the current reducer with a dedicated engine and command surface.
