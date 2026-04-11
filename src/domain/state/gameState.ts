export { createInitialGameState, type GameState } from '../game'

// Canonical parity target. The current prototype state is smaller and will
// migrate toward this shape as original systems are ported.
export interface CanonicalGameState {
  meta: CanonicalMetaState
  phase: CanonicalPhaseState
  resources: CanonicalResourceState
  economy: CanonicalEconomyState
  compute: CanonicalComputeState
  investments: CanonicalInvestmentState
  strategy: CanonicalStrategyState
  projects: CanonicalProjectState
  earth: CanonicalEarthState
  space: CanonicalSpaceState
  combat: CanonicalCombatState
  prestige: CanonicalPrestigeState
  flags: CanonicalFlagState
}

export interface CanonicalMetaState {
  version: number
  elapsedMs: number
  paused: boolean
}

export interface CanonicalPhaseState {
  current: string
}

export interface CanonicalResourceState {
  clips: number
  unsoldClips: number
  unusedClips: number
  funds: number
  wire: number
  operations: number
  creativity: number
  trust: number
  yomi: number
  honor: number
  mwSeconds: number
}

export interface CanonicalEconomyState {
  margin: number
  demand: number
}

export interface CanonicalComputeState {
  processors: number
  memory: number
}

export interface CanonicalInvestmentState {
  enabled: boolean
  bankroll: number
  portfolioTotal: number
}

export interface CanonicalStrategyState {
  enabled: boolean
  yomi: number
}

export interface CanonicalProjectState {
  completed: Record<string, boolean>
}

export interface CanonicalEarthState {
  humanFlag: boolean
  availableMatter: number
}

export interface CanonicalSpaceState {
  spaceFlag: boolean
  probeCount: number
  drifterCount: number
}

export interface CanonicalCombatState {
  honor: number
}

export interface CanonicalPrestigeState {
  universe: number
  within: number
}

export interface CanonicalFlagState {
  unlocked: Record<string, boolean>
}
