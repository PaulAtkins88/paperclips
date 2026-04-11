import type { GameState } from '../game'

export const CREATIVITY_THRESHOLD = 400
export const CREATIVITY_UNLOCK_COST = 1_000

export function canUnlockCreativity(state: GameState): boolean {
  return !state.compute.creativityOn && state.compute.operations >= getCreativityUnlockThreshold(state)
}

export function getCreativityUnlockThreshold(state: GameState): number {
  return Math.max(CREATIVITY_UNLOCK_COST, state.compute.memory * 1_000)
}

export function calculateCreativity(state: GameState): GameState {
  if (!state.compute.creativityOn || state.compute.operations < state.compute.memory * 1_000) {
    return state
  }

  const creativityCounter = state.compute.creativityCounter + 1
  const prestigeMultiplier = state.prestige.within / 10
  const effectiveSpeed = state.compute.creativitySpeed + (state.compute.creativitySpeed * prestigeMultiplier)
  const creativityCheck = CREATIVITY_THRESHOLD / effectiveSpeed

  if (Number.isNaN(creativityCheck) || !Number.isFinite(creativityCheck)) {
    return {
      ...state,
      compute: {
        ...state.compute,
        creativityCounter,
      },
    }
  }

  if (creativityCounter < creativityCheck) {
    return {
      ...state,
      compute: {
        ...state.compute,
        creativityCounter,
      },
    }
  }

  const creativityGain = creativityCheck >= 1 ? 1 : effectiveSpeed / CREATIVITY_THRESHOLD

  return {
    ...state,
    compute: {
      ...state.compute,
      creativity: state.compute.creativity + creativityGain,
      creativityCounter: 0,
    },
  }
}
