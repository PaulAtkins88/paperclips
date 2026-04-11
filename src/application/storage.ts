import { GAME_VERSION, createInitialGameState, type GameState } from '../domain/game'

const STORAGE_KEY = 'paperclips-remake.save.v10'

function isGameStateVersion(value: unknown): value is GameState['version'] {
  return value === GAME_VERSION
}

function hydrateGameState(raw: Partial<GameState>): GameState {
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

export function loadGame(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as Partial<GameState>
    if (!isGameStateVersion(parsed.version)) {
      return null
    }

    return hydrateGameState(parsed)
  } catch {
    return null
  }
}

export function saveGame(state: GameState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage failures and keep the game playable.
  }
}

export function exportGame(state: GameState): string {
  return JSON.stringify(state)
}

export function importGame(raw: string): GameState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<GameState>
    if (!isGameStateVersion(parsed.version)) {
      return null
    }

    return hydrateGameState(parsed)
  } catch {
    return null
  }
}
