import type { GameState } from '../game'

export function selectGameFlags(state: GameState) {
  return {
    paused: state.paused,
    computeUnlocked: state.compute.unlocked,
    creativityUnlocked: state.compute.creativityOn,
    investmentUnlocked: state.investment.unlocked,
    strategyUnlocked: state.strategy.unlocked,
    humanFlag: state.earth.humanFlag,
    earthAutomationUnlocked: !state.earth.humanFlag,
  }
}
