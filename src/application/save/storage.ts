import { GAME_VERSION, createInitialGameState, type GameProject, type GameState } from '../../domain/game'
import type { ProjectId } from '../../domain/projects/projectTypes'

// Deliberately still v10: the key is where existing players' saves already live, so
// changing it would orphan them and defeat the migration below. The `version` field
// inside the payload is what distinguishes the two shapes.
const STORAGE_KEY = 'paperclips-remake.save.v10'

// Saves written before project state became { triggered, completed } stored one plain
// boolean per project.
const LEGACY_PROJECT_FLAGS_VERSION = 10

function isSupportedVersion(value: unknown): boolean {
  return value === GAME_VERSION || value === LEGACY_PROJECT_FLAGS_VERSION
}

/**
 * Converts legacy `Record<ProjectId, boolean>` project flags to the current shape.
 *
 * A legacy `true` means the project was completed, which implies it was also triggered.
 * A legacy `false` carries no trigger information — the old shape never stored it — so it
 * migrates to `triggered: false` and `triggerProjects()` re-derives the real value from
 * game state on the next action. The one thing that cannot be recovered is a project that
 * was triggered but not completed and whose trigger condition has since lapsed; it will
 * stay hidden until the condition holds again. That data never existed in a v10 save.
 */
function migrateProjectFlags(raw: unknown): Partial<Record<ProjectId, GameProject>> {
  if (raw === null || typeof raw !== 'object') {
    return {}
  }

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([projectId, value]) => [
      projectId,
      typeof value === 'boolean' ? { triggered: value, completed: value } : value,
    ]),
  ) as Partial<Record<ProjectId, GameProject>>
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
      ...migrateProjectFlags(raw.projects),
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
    if (!isSupportedVersion(parsed.version)) {
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
    if (!isSupportedVersion(parsed.version)) {
      return null
    }

    return hydrateGameState(parsed)
  } catch {
    return null
  }
}
