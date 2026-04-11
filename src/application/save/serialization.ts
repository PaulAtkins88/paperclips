import type { GameState } from '../../domain/game'

export function serializeGameState(state: GameState): string {
  return JSON.stringify(state)
}

export function deserializeGameState(raw: string): Partial<GameState> {
  return JSON.parse(raw) as Partial<GameState>
}
