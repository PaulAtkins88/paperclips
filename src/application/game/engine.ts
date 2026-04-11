import { createInitialGameState, reduceGameState, type GameAction, type GameState } from '../../domain/game'

export function createGameState(): GameState {
  return createInitialGameState()
}

export function applyGameAction(state: GameState, action: GameAction): GameState {
  return reduceGameState(state, action)
}
