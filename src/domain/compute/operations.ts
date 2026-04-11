import type { GameState } from '../game'

export const OP_FADE_DELAY = 800
export const OP_FADE_ACCELERATION = Math.pow(3, 3.5) / 1_000
export const OPERATIONS_PER_MEMORY = 1_000

export function getMaxOperations(memory: number): number {
  return memory * OPERATIONS_PER_MEMORY
}

export function calculateOperations(state: GameState): GameState {
  let tempOps = state.compute.tempOps
  let standardOps = state.compute.standardOps
  let opFade = state.compute.opFade
  let opFadeTimer = state.compute.opFadeTimer

  if (tempOps > 0) {
    opFadeTimer += 1
  }

  if (opFadeTimer > OP_FADE_DELAY && tempOps > 0) {
    opFade += OP_FADE_ACCELERATION
  }

  if (tempOps > 0) {
    tempOps = Math.round(tempOps - opFade)
  } else {
    tempOps = 0
  }

  const maxOperations = getMaxOperations(state.compute.memory)

  if (tempOps + standardOps < maxOperations) {
    standardOps += tempOps
    tempOps = 0
  }

  const operations = Math.floor(standardOps + Math.floor(tempOps))

  if (operations < maxOperations) {
    let opCycle = state.compute.processors / 10
    const opBuffer = maxOperations - operations

    if (opCycle > opBuffer) {
      opCycle = opBuffer
    }

    standardOps += opCycle
  }

  if (standardOps > maxOperations) {
    standardOps = maxOperations
  }

  return {
    ...state,
    compute: {
      ...state.compute,
      operations,
      standardOps,
      tempOps,
      opFade,
      opFadeTimer,
    },
  }
}

export function spendOperations(state: GameState, amount: number): GameState {
  if (amount <= 0 || state.compute.operations < amount) {
    return state
  }

  let remaining = amount
  let standardOps = state.compute.standardOps
  let tempOps = state.compute.tempOps

  if (standardOps >= remaining) {
    standardOps -= remaining
    remaining = 0
  } else {
    remaining -= standardOps
    standardOps = 0
  }

  if (remaining > 0) {
    tempOps = Math.max(0, tempOps - remaining)
  }

  return {
    ...state,
    compute: {
      ...state.compute,
      standardOps,
      tempOps,
      operations: Math.floor(standardOps + Math.floor(tempOps)),
    },
  }
}

export function spendStandardOperations(state: GameState, amount: number): GameState {
  if (amount <= 0 || state.compute.operations < amount) {
    return state
  }

  const standardOps = state.compute.standardOps - amount

  return {
    ...state,
    compute: {
      ...state.compute,
      standardOps,
      operations: Math.floor(standardOps + Math.floor(state.compute.tempOps)),
    },
  }
}
