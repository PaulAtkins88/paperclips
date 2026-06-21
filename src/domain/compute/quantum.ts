import type { GameState } from "../game";
import { getMaxOperations } from "./operations";

export const QCHIP_BASE_COST = 10_000

export interface QChip {
  waveSeed: number;
  value: number;
  active: boolean;
}

export function createInitialQChips(): QChip[] {
  return Array.from({ length: 10 }, (_, i) => ({
    waveSeed: parseFloat(((i + 1) * 0.1).toFixed(1)),
    value: 0,
    active: false,
  }))
}

export function calculateQuantumOps(state: GameState): GameState {
  if (!state.projects.project50) return state

  const qClock = state.compute.qClock + 0.01

  const qChips = state.compute.qChips.map(chip => ({
    ...chip,
    value: Math.sin(qClock * chip.waveSeed * (chip.active ? 1 : 0)),
  }))

  return {
    ...state,
    compute: {
      ...state.compute,
      qClock,
      qChips,
    },
  }
}

export function quantumCompute(state: GameState): GameState {
  if (!state.projects.project50 || !state.compute.qChips.some(c => c.active)) {
    return state
  }

  const q = state.compute.qChips.reduce((sum, chip) => sum + chip.value, 0)
  const qq = Math.ceil(q * 360)

  const maxOperations = getMaxOperations(state.compute.memory)
  const buffer = maxOperations - state.compute.standardOps
  const damper = (state.compute.tempOps / 100) + 5

  let standardOps = state.compute.standardOps
  let tempOps = state.compute.tempOps
  let opFade = state.compute.opFade
  let opFadeTimer = state.compute.opFadeTimer

  if (qq > buffer) {
    tempOps = tempOps + Math.ceil(qq / damper) - buffer
    standardOps = standardOps + buffer
    opFade = .01
    opFadeTimer = 0
  } else {
    standardOps = standardOps + qq
  }

  return {
    ...state,
    compute: {
      ...state.compute,
      standardOps,
      tempOps,
      opFade,
      opFadeTimer,
      qOps: qq,
    },
    lastAction: `Generated ${qq} qOps`,
  }
}
