import { selectHeaderStats, selectStallState } from './selectors'
import type { GameState } from '../../domain/game'

export function createGameSnapshot(state: GameState) {
  return {
    header: selectHeaderStats(state),
    stall: selectStallState(state),
  }
}
