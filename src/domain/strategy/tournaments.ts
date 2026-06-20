import { spendStandardOperations } from '../compute/operations'
import type { GameState } from '../game'

export type StrategyId = 'RANDOM' | 'A100' | 'B100' | 'GREEDY' | 'GENEROUS' | 'MINIMAX' | 'TIT_FOR_TAT' | 'BEAT_LAST'
export type StrategySelection = StrategyId | 'NONE'

export interface TournamentPayoffMatrix {
  AA: number
  AB: number
  BA: number
  BB: number
}

export interface TournamentResult {
  id: StrategyId
  score: number
}

const STRATEGY_TICK_MS = 10

export const ALL_STRATEGIES: StrategyId[] = ['RANDOM', 'A100', 'B100', 'GREEDY', 'GENEROUS', 'MINIMAX', 'TIT_FOR_TAT', 'BEAT_LAST']

export function runStrategyTick(state: GameState, deltaMs: number, random: () => number): GameState {
  if (state.paused || !state.strategy.unlocked || !state.strategy.autoTourneyEnabled || state.strategy.lastResults.length === 0) {
    return state
  }

  let next = state
  let resultsTimer = next.strategy.resultsTimer
  const ticks = Math.max(1, Math.floor(deltaMs / STRATEGY_TICK_MS))

  for (let index = 0; index < ticks; index += 1) {
    resultsTimer += 1

    if (resultsTimer >= 300 && next.compute.operations >= next.strategy.tourneyCost) {
      next = runTournament({
        ...next,
        strategy: {
          ...next.strategy,
          resultsTimer: 0,
        },
      }, random)

      resultsTimer = next.strategy.resultsTimer
    }
  }

  return {
    ...next,
    strategy: {
      ...next.strategy,
      resultsTimer,
    },
  }
}

export function canRunTournament(state: GameState): boolean {
  return state.strategy.unlocked && state.compute.operations >= state.strategy.tourneyCost
}

export function runTournament(state: GameState, random: () => number): GameState {
  if (!canRunTournament(state)) {
    return state
  }

  const spent = spendStandardOperations(state, state.strategy.tourneyCost)
  const matrix = generatePayoffMatrix(random)
  const strategyIds = spent.strategy.strategies
  const scores = new Map<StrategyId, number>(strategyIds.map((id) => [id, 0]))
  let hMovePrev = spent.strategy.hMovePrev
  let vMovePrev = spent.strategy.vMovePrev

  for (const rowId of strategyIds) {
    for (const colId of strategyIds) {
      for (let round = 0; round < 10; round += 1) {
        const rowMove = pickMove(rowId, matrix, hMovePrev, vMovePrev, random, true)
        const colMove = pickMove(colId, matrix, hMovePrev, vMovePrev, random, false)

        const payoff = getPayoff(matrix, rowMove, colMove)
        scores.set(rowId, (scores.get(rowId) ?? 0) + payoff.row)
        scores.set(colId, (scores.get(colId) ?? 0) + payoff.col)

        hMovePrev = rowMove
        vMovePrev = colMove
      }
    }
  }

  const results = strategyIds
    .map((id) => ({ id, score: scores.get(id) ?? 0 }))
    .sort((left, right) => right.score - left.score)

  let yomi = spent.strategy.yomi

  if (spent.strategy.selectedStrategy !== 'NONE') {
    const rankIndex = results.findIndex((result) => result.id === spent.strategy.selectedStrategy)

    if (rankIndex >= 0) {
      const selectedScore = results[rankIndex].score
      const beatBoost = Math.max(1, results.length - rankIndex - 1)
      yomi += selectedScore * spent.strategy.yomiBoost * beatBoost

      if (spent.strategy.strategicAttachmentFlag) {
        const winScore = results[0]?.score ?? -1
        const placeScore = results.find((r) => r.score < winScore)?.score ?? -1
        const showScore = results.find((r) => r.score < placeScore)?.score ?? -1

        if (selectedScore === winScore) yomi += 50_000
        else if (placeScore >= 0 && selectedScore === placeScore) yomi += 30_000
        else if (showScore >= 0 && selectedScore === showScore) yomi += 20_000
      }
    }
  }

  return {
    ...spent,
    strategy: {
      ...spent.strategy,
      yomi,
      tourneyLevel: spent.strategy.tourneyLevel + 1,
      lastResults: results,
      lastPayoffMatrix: matrix,
      hMovePrev,
      vMovePrev,
      resultsTimer: 0,
    },
    lastAction: 'Ran a tournament',
  }
}

export function cycleStrategySelection(state: GameState): GameState {
  const available: StrategySelection[] = ['NONE', ...state.strategy.strategies]
  const currentIndex = available.indexOf(state.strategy.selectedStrategy)
  const nextSelection = available[(currentIndex + 1) % available.length] ?? 'NONE'

  return {
    ...state,
    strategy: {
      ...state.strategy,
      selectedStrategy: nextSelection,
    },
    lastAction: `Selected strategy ${formatStrategyLabel(nextSelection)}`,
  }
}

export function toggleAutoTourney(state: GameState): GameState {
  if (!state.projects.project118) {
    return state
  }

  return {
    ...state,
    strategy: {
      ...state.strategy,
      autoTourneyEnabled: !state.strategy.autoTourneyEnabled,
    },
    lastAction: state.strategy.autoTourneyEnabled ? 'AutoTourney disabled' : 'AutoTourney enabled',
  }
}

export function unlockStrategy(state: GameState, strategyId: StrategyId): GameState {
  if (state.strategy.strategies.includes(strategyId)) {
    return state
  }

  return {
    ...state,
    strategy: {
      ...state.strategy,
      strategies: [...state.strategy.strategies, strategyId],
      tourneyCost: state.strategy.tourneyCost + 1_000,
    },
  }
}

export function formatStrategyLabel(strategyId: StrategySelection): string {
  switch (strategyId) {
    case 'NONE':
      return 'Pick a Strat'
    case 'TIT_FOR_TAT':
      return 'TIT FOR TAT'
    case 'BEAT_LAST':
      return 'BEAT LAST'
    default:
      return strategyId
  }
}

function generatePayoffMatrix(random: () => number): TournamentPayoffMatrix {
  return {
    AA: Math.ceil(random() * 10),
    AB: Math.ceil(random() * 10),
    BA: Math.ceil(random() * 10),
    BB: Math.ceil(random() * 10),
  }
}

function pickMove(
  strategyId: StrategyId,
  matrix: TournamentPayoffMatrix,
  hMovePrev: 'A' | 'B',
  vMovePrev: 'A' | 'B',
  random: () => number,
  isRowPlayer: boolean,
): 'A' | 'B' {
  switch (strategyId) {
    case 'RANDOM':
      return random() < 0.5 ? 'A' : 'B'
    case 'A100':
      return 'A'
    case 'B100':
      return 'B'
    case 'GREEDY': {
      const max = Math.max(matrix.AA, matrix.AB, matrix.BA, matrix.BB)
      return max === matrix.AA || max === matrix.AB ? 'A' : 'B'
    }
    case 'GENEROUS': {
      const opponentA = Math.max(matrix.AA, matrix.BA)
      const opponentB = Math.max(matrix.AB, matrix.BB)
      return opponentA >= opponentB ? 'A' : 'B'
    }
    case 'MINIMAX': {
      const opponentA = Math.max(matrix.AA, matrix.BA)
      const opponentB = Math.max(matrix.AB, matrix.BB)
      return opponentA > opponentB ? 'B' : 'A'
    }
    case 'TIT_FOR_TAT':
      return isRowPlayer ? vMovePrev : hMovePrev
    case 'BEAT_LAST': {
      const opponentLast = isRowPlayer ? vMovePrev : hMovePrev
      if (opponentLast === 'A') {
        return matrix.BA > matrix.AA ? 'B' : 'A'
      }

      return matrix.BB > matrix.AB ? 'B' : 'A'
    }
    default:
      return 'A'
  }
}

function getPayoff(matrix: TournamentPayoffMatrix, rowMove: 'A' | 'B', colMove: 'A' | 'B'): { row: number; col: number } {
  if (rowMove === 'A' && colMove === 'A') {
    return { row: matrix.AA, col: matrix.AA }
  }

  if (rowMove === 'A' && colMove === 'B') {
    return { row: matrix.AB, col: matrix.BA }
  }

  if (rowMove === 'B' && colMove === 'A') {
    return { row: matrix.BA, col: matrix.AB }
  }

  return { row: matrix.BB, col: matrix.BB }
}
