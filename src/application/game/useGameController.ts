import { useEffect, useReducer } from 'react'
import { createGameState } from './engine'
import { reduceGameState } from './reducer'
import { loadGame, saveGame } from '../save/storage'
import { DEFAULT_TICK_MS, startTickLoop } from './tickScheduler'

export function useGameController() {
  const [state, dispatch] = useReducer(reduceGameState, undefined, () => loadGame() ?? createGameState())

  useEffect(() => startTickLoop(() => dispatch({ type: 'tick', deltaMs: DEFAULT_TICK_MS })), [])

  useEffect(() => {
    saveGame(state)
  }, [state])

  return {
    state,
    dispatch,
    tickMs: DEFAULT_TICK_MS,
  }
}
