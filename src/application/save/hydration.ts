import { createInitialGameState, GAME_VERSION, type GameState } from '../../domain/game'

export function isGameStateVersion(value: unknown): value is GameState['version'] {
  return value === GAME_VERSION
}

export function hydrateGameState(raw: Partial<GameState>): GameState {
  const base = createInitialGameState()

  return {
    ...base,
    ...raw,
    version: GAME_VERSION,
    production: {
      ...base.production,
      ...raw.production,
    },
    economy: {
      ...base.economy,
      ...raw.economy,
    },
    compute: {
      ...base.compute,
      ...raw.compute,
    },
    prestige: {
      ...base.prestige,
      ...raw.prestige,
    },
    investment: {
      ...base.investment,
      ...raw.investment,
    },
    strategy: {
      ...base.strategy,
      ...raw.strategy,
    },
    earth: {
      ...base.earth,
      ...raw.earth,
    },
    space: {
      ...base.space,
      ...raw.space,
    },
    projects: {
      ...base.projects,
      ...raw.projects,
    },
  }
}
