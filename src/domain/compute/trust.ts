import type { GameState } from '../game'

export const INITIAL_TRUST = 2
export const INITIAL_NEXT_TRUST = 3_000
export const INITIAL_FIB1 = 2
export const INITIAL_FIB2 = 3
export const INITIAL_PROCESSORS = 1
export const INITIAL_MEMORY = 1
export const INITIAL_CREATIVITY_SPEED = 1

export function calculateTrust(state: GameState): GameState {
  if (state.production.clips <= state.compute.nextTrust - 1) {
    return state
  }

  const fibNext = state.compute.fib1 + state.compute.fib2

  return {
    ...state,
    compute: {
      ...state.compute,
      trust: state.compute.trust + 1,
      nextTrust: fibNext * 1_000,
      fib1: state.compute.fib2,
      fib2: fibNext,
    },
  }
}

export function canAllocateTrust(state: GameState): boolean {
  return state.compute.trust > state.compute.processors + state.compute.memory || state.compute.swarmGifts > 0
}

export function shouldUnlockCompute(state: GameState): boolean {
  return state.compute.unlocked
    || state.production.clips >= 2_000
    || (state.production.unsoldClips < 1 && state.production.funds < state.economy.wireCost && state.production.wire < 1)
}
