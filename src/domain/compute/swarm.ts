import type { GameState } from '../game'
import { COMPUTE_TICK_MS } from './constants'

export const GIFT_PERIOD = 125_000
export const SYNCHRONIZATION_COST = 5_000
export const INITIAL_ENTERTAIN_COST = 10_000
const BOREDOM_THRESHOLD = (5 * 60 * 1000) / COMPUTE_TICK_MS

export function setSwarmComputingBalance(state: GameState, workThinkBalance: number): GameState {
  if (!state.compute.swarmFlag || workThinkBalance < 0 || workThinkBalance > 100) {
    return state
  }

  return {
    ...state,
    compute: {
      ...state.compute,
      swarmComputingBalance: workThinkBalance,
    }
  }
}

export function getTotalDroneCount(state: GameState): number {
  return state.earth.harvesterLevel + state.earth.wireDroneLevel
}

function isSwarmActive(state: GameState): boolean {
  const { swarmFlag, boredomFlag, disorgFlag } = state.compute
  const droneCount = getTotalDroneCount(state)

  if (!swarmFlag) return false
  if (droneCount === 0) return false
  if (boredomFlag) return false
  if (disorgFlag) return false
  if (state.earth.powMod === 0) return false
  if (state.earth.spaceFlag && !state.projects.project130) return false

  return true
}

export function calculateSwarmComputingGifts(state: GameState): GameState {
  if (!state.compute.swarmFlag) return state

  let next = state
  next = updateBoredom(next)
  next = updateDisorg(next)

  if (!isSwarmActive(next)) return next

  const droneCount = getTotalDroneCount(next)
  const { swarmComputingBalance, giftBits, giftPeriod } = next.compute
  const rate = Math.log(droneCount) * (swarmComputingBalance / 50)
  const newGiftBits = giftBits + rate

  if (newGiftBits < giftPeriod) {
    return {
      ...next,
      compute: { ...next.compute, giftBits: newGiftBits },
    }
  }

  const nextGift = Math.max(1, Math.round(Math.log10(droneCount) * (swarmComputingBalance / 50)))
  return {
    ...next,
    compute: {
      ...next.compute,
      giftBits: 0,
      swarmGifts: next.compute.swarmGifts + nextGift,
    },
  }
}

function updateBoredom(state: GameState): GameState {
  const droneCount = getTotalDroneCount(state)
  if (droneCount === 0) return state

  const matterDepleted = state.earth.availableMatter === 0
  const delta = matterDepleted ? 1 : -1
  const newLevel = Math.max(0, state.compute.boredomLevel + delta)
  const fired = newLevel >= BOREDOM_THRESHOLD

  return {
    ...state,
    compute: {
      ...state.compute,
      boredomLevel: fired ? 0 : newLevel,
      boredomFlag: state.compute.boredomFlag || fired,
    },
  }
}

function updateDisorg(state: GameState): GameState {
  const { harvesterLevel, wireDroneLevel } = state.earth
  const ratio = Math.max(harvesterLevel + 1, wireDroneLevel + 1) /
                Math.min(harvesterLevel + 1, wireDroneLevel + 1)

  const delta = ratio < 1.5
    ? -0.01
    : Math.min(0.01, ratio / 10_000)

  const newCounter = Math.max(0, state.compute.disorgCounter + delta)
  const fired = newCounter >= 100

  return {
    ...state,
    compute: {
      ...state.compute,
      disorgCounter: newCounter,
      disorgFlag: state.compute.disorgFlag || fired,
    },
  }
}
export function timeUntilSwarmGift(state: GameState): string | null {
  if (!isSwarmActive(state)) return null

  const droneCount = getTotalDroneCount(state)
  const { swarmComputingBalance, giftBits, giftPeriod } = state.compute
  const bitsRemaining = giftPeriod - giftBits
  const giftBitGenerationRate = Math.log(droneCount) * (swarmComputingBalance / 50)

  const ticksRemaining = bitsRemaining / giftBitGenerationRate

  const totalSeconds = ticksRemaining / (1000 / COMPUTE_TICK_MS)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor(totalSeconds % 3600 / 60)
  const seconds = Math.floor(totalSeconds % 3600 % 60)

  const hDisplay = hours > 0 ? hours + (hours == 1 ? " hour " : " hours ") : ""
  const mDisplay = minutes > 0 ? minutes + (minutes == 1 ? " minute " : " minutes ") : ""
  const sDisplay = seconds > 0 ? seconds + (seconds == 1 ? " second" : " seconds") : ""

  return hDisplay + mDisplay + sDisplay;
}

export function entertainSwarm(state: GameState): GameState {
  if (!state.compute.boredomFlag || state.compute.creativity < state.compute.entertainCost) {
    return state
  }

  return {
    ...state,
    compute: {
      ...state.compute,
      creativity: state.compute.creativity - state.compute.entertainCost,
      entertainCost: state.compute.entertainCost + 10_000,
      boredomFlag: false,
    }
  }
}

export function synchronizeSwarm(state: GameState): GameState {
  if (!state.compute.disorgFlag || state.strategy.yomi < state.compute.synchCost) {
    return state
  }

  return {
    ...state,
    strategy: {
      ...state.strategy,
      yomi: state.strategy.yomi - state.compute.synchCost,
    },
    compute: {
      ...state.compute,
      disorgFlag: false,
      disorgCounter: 0,
    },
  }
}
