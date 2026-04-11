import type { GameState } from '../game'
import { calculateCreativity, canUnlockCreativity } from './creativity'
import { calculateOperations, spendOperations } from './operations'
import { calculateTrust, canAllocateTrust, shouldUnlockCompute } from './trust'

export const COMPUTE_TICK_MS = 10

export function syncComputeState(state: GameState): GameState {
  const unlocked = shouldUnlockCompute(state)

  if (unlocked === state.compute.unlocked) {
    return state
  }

  return {
    ...state,
    compute: {
      ...state.compute,
      unlocked,
    },
  }
}

export function runComputeTick(state: GameState, deltaMs: number): GameState {
  let next = syncComputeState(state)

  if (!next.compute.unlocked) {
    return next
  }

  const fastTicks = Math.max(1, Math.floor(deltaMs / COMPUTE_TICK_MS))

  for (let tick = 0; tick < fastTicks; tick += 1) {
    next = calculateOperations(next)
    next = calculateTrust(next)
    next = calculateCreativity(next)
  }

  return syncComputeState(next)
}

export function addProcessor(state: GameState): GameState {
  if (!state.compute.unlocked || !canAllocateTrust(state)) {
    return state
  }

  const processors = state.compute.processors + 1
  const creativitySpeed = Math.log10(processors) * Math.pow(processors, 1.1) + processors - 1

  return {
    ...state,
    compute: {
      ...state.compute,
      processors,
      creativitySpeed,
    },
    lastAction: state.compute.creativityOn
      ? 'Processor added, operations (or creativity) per sec increased'
      : 'Processor added, operations per sec increased',
  }
}

export function addMemory(state: GameState): GameState {
  if (!state.compute.unlocked || !canAllocateTrust(state)) {
    return state
  }

  return {
    ...state,
    compute: {
      ...state.compute,
      memory: state.compute.memory + 1,
    },
    lastAction: 'Memory added, max operations increased',
  }
}

export function unlockCreativity(state: GameState): GameState {
  if (!state.compute.unlocked || !canUnlockCreativity(state)) {
    return state
  }

  const spent = spendOperations(state, 1_000)

  return {
    ...state,
    ...spent,
    compute: {
      ...spent.compute,
      creativityOn: true,
    },
    lastAction: 'Unlocked creativity',
  }
}
