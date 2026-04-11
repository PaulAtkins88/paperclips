import { runEarthTick } from '../earth/earth'
import type { GameState, SpaceBattle } from '../game'

export const SPACE_TICK_MS = 100

const PROBE_EXPLORATION_BASE_RATE = 1.75 * Math.pow(10, 18)
const PROBE_REPLICATION_BASE_RATE = 0.00005
const PROBE_FACTORY_BASE_RATE = 0.000001
const PROBE_HARVESTER_BASE_RATE = 0.000002
const PROBE_WIRE_DRONE_BASE_RATE = 0.000002
const PROBE_HAZARD_BASE_RATE = 0.01
const PROBE_DRIFT_BASE_RATE = 0.000001
const PROBE_COMBAT_BASE_RATE = 0.15
const DRIFTER_COMBAT = 1.75
const MAX_PROBE_COUNT = 999999999999999999999999999999999999999999999999
const WAR_TRIGGER = 1_000_000
const MAX_BATTLES = 1
const BATTLE_DEATH_THRESHOLD = 0.5
const BATTLE_LOW_SHIP_THRESHOLD = 4
const BATTLE_LOW_SHIP_TIMEOUT = 2_000
const BATTLE_MASTER_TIMEOUT = 8_000
const BATTLE_SHIP_SCALE = 1_000_000
const BATTLE_SHIP_CAP = 200
const SPACE_FACTORY_COST = 100_000_000
const SPACE_DRONE_COST = 2_000_000

type ProbeTrustTarget = 'speed' | 'nav' | 'rep' | 'haz' | 'fac' | 'harv' | 'wire' | 'combat'

export interface SpaceStatus {
  explorationRate: number
  exploredPercent: number
  availableProbeTrust: number
  replicationRate: number
  factorySpawnRate: number
  harvesterSpawnRate: number
  wireDroneSpawnRate: number
  hazardLossRate: number
  driftLossRate: number
  battleActive: boolean
  battleTurns: number
}

export function runSpaceExplorationTick(state: GameState, deltaMs: number): GameState {
  if (state.paused || !state.earth.spaceFlag) {
    return state
  }

  const ticks = Math.max(1, Math.floor(deltaMs / SPACE_TICK_MS))
  let next = state

  for (let index = 0; index < ticks; index += 1) {
    next = exploreUniverse(next)
  }

  return next
}

export function runSpaceColonizationTick(state: GameState, deltaMs: number): GameState {
  if (state.paused || !state.earth.spaceFlag) {
    return state
  }

  const ticks = Math.max(1, Math.floor(deltaMs / SPACE_TICK_MS))
  let next = state

  for (let index = 0; index < ticks; index += 1) {
    next = encounterHazards(next)
    next = spawnFactories(next)
    next = spawnHarvesters(next)
    next = spawnWireDrones(next)
    next = spawnProbes(next)
    next = drift(next)
    next = war(next, Math.random)
  }

  return next
}

export function runSpaceTick(state: GameState, deltaMs: number): GameState {
  return runSpaceColonizationTick(runEarthTick(runSpaceExplorationTick(state, deltaMs), deltaMs), deltaMs)
}

export function launchProbe(state: GameState): GameState {
  if (!state.earth.spaceFlag || state.production.unusedClips <= state.space.probeCost) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - state.space.probeCost,
    },
    space: {
      ...state.space,
      probeCount: state.space.probeCount + 1,
      probeLaunchLevel: state.space.probeLaunchLevel + 1,
    },
    lastAction: 'Launched a von Neumann probe',
  }
}

export function increaseProbeTrust(state: GameState): GameState {
  if (!state.earth.spaceFlag || state.strategy.yomi < state.space.probeTrustCost || state.space.probeTrust >= state.space.maxTrust) {
    return state
  }

  const nextTrust = state.space.probeTrust + 1

  return {
    ...state,
    strategy: {
      ...state.strategy,
      yomi: state.strategy.yomi - state.space.probeTrustCost,
    },
    space: {
      ...state.space,
      probeTrust: nextTrust,
      probeTrustCost: getProbeTrustCost(nextTrust),
    },
    lastAction: 'Expanded probe trust',
  }
}

export function increaseMaxTrust(state: GameState): GameState {
  if (!state.projects.project121 || state.space.honor < state.space.maxTrustCost) {
    return state
  }

  return {
    ...state,
    space: {
      ...state.space,
      honor: state.space.honor - state.space.maxTrustCost,
      maxTrust: state.space.maxTrust + 10,
    },
    lastAction: 'Expanded probe trust capacity',
  }
}

export function assignProbeTrust(state: GameState, target: ProbeTrustTarget): GameState {
  if (!state.earth.spaceFlag || state.space.probeUsedTrust >= state.space.probeTrust) {
    return state
  }

  switch (target) {
    case 'speed':
      return applyProbeTrustAllocation(state, { probeSpeed: state.space.probeSpeed + 1 }, 'Allocated probe trust to Speed')
    case 'nav':
      return applyProbeTrustAllocation(state, { probeNav: state.space.probeNav + 1 }, 'Allocated probe trust to Exploration')
    case 'rep':
      return applyProbeTrustAllocation(state, { probeRep: state.space.probeRep + 1 }, 'Allocated probe trust to Self-Replication')
    case 'haz':
      return applyProbeTrustAllocation(state, { probeHaz: state.space.probeHaz + 1 }, 'Allocated probe trust to Hazard Remediation')
    case 'fac':
      return applyProbeTrustAllocation(state, { probeFac: state.space.probeFac + 1 }, 'Allocated probe trust to Factory Production')
    case 'harv':
      return applyProbeTrustAllocation(state, { probeHarv: state.space.probeHarv + 1 }, 'Allocated probe trust to Harvester Production')
    case 'wire':
      return applyProbeTrustAllocation(state, { probeWire: state.space.probeWire + 1 }, 'Allocated probe trust to Wire Drone Production')
    case 'combat':
      if (!state.projects.project131) {
        return state
      }
      return applyProbeTrustAllocation(state, { probeCombat: state.space.probeCombat + 1 }, 'Allocated probe trust to Combat')
    default:
      return state
  }
}

export function getSpaceStatus(state: GameState): SpaceStatus {
  return {
    explorationRate: getExplorationRate(state),
    exploredPercent: state.space.totalMatter > 0 ? (state.space.foundMatter / state.space.totalMatter) * 100 : 0,
    availableProbeTrust: Math.max(0, state.space.probeTrust - state.space.probeUsedTrust),
    replicationRate: getProbeReplicationRate(state),
    factorySpawnRate: getProbeFactorySpawnRate(state),
    harvesterSpawnRate: getProbeHarvesterSpawnRate(state),
    wireDroneSpawnRate: getProbeWireDroneSpawnRate(state),
    hazardLossRate: getHazardLossRate(state),
    driftLossRate: getDriftLossRate(state),
    battleActive: state.space.activeBattle !== null,
    battleTurns: state.space.activeBattle?.masterBattleClock ?? 0,
  }
}

function war(state: GameState, random: () => number): GameState {
  const withBattle = checkForBattles(state, random)
  return resolveBattle(withBattle, random)
}

function exploreUniverse(state: GameState): GameState {
  if (state.space.probeCount < 1) {
    return state
  }

  const explorationRate = getExplorationRate(state)
  const remainingMatter = Math.max(0, state.space.totalMatter - state.space.foundMatter)
  const discoveredMatter = Math.min(explorationRate, remainingMatter)

  if (discoveredMatter <= 0) {
    return state
  }

  return {
    ...state,
    earth: {
      ...state.earth,
      availableMatter: state.earth.availableMatter + discoveredMatter,
    },
    space: {
      ...state.space,
      foundMatter: state.space.foundMatter + discoveredMatter,
    },
    lastAction: `Space probes discovered ${formatSpaceNumber(discoveredMatter)} matter`,
  }
}

function spawnFactories(state: GameState): GameState {
  const requested = getProbeFactorySpawnRate(state)
  const amount = capClipFundedSpawn(requested, SPACE_FACTORY_COST, state.production.unusedClips)

  if (amount <= 0) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - (amount * SPACE_FACTORY_COST),
    },
    earth: {
      ...state.earth,
      factoryLevel: state.earth.factoryLevel + amount,
    },
    lastAction: `Space probes assembled ${formatSpaceNumber(amount)} factories`,
  }
}

function encounterHazards(state: GameState): GameState {
  if (state.space.probeCount <= 0) {
    return state
  }

  let amount = getHazardLossRate(state)
  let partialProbeHaz = state.space.partialProbeHaz

  if (amount > 0 && amount < 1) {
    partialProbeHaz += amount
    if (partialProbeHaz >= 1) {
      amount = 1
      partialProbeHaz = 0
    } else {
      amount = 0
    }
  }

  amount = Math.min(amount, state.space.probeCount)

  if (amount <= 0 && partialProbeHaz === state.space.partialProbeHaz) {
    return state
  }

  return {
    ...state,
    space: {
      ...state.space,
      partialProbeHaz,
      probeCount: Math.max(0, state.space.probeCount - amount),
      probesLostHaz: state.space.probesLostHaz + amount,
    },
    lastAction: amount > 0 ? `Space probes lost ${formatSpaceNumber(amount)} units to hazards` : state.lastAction,
  }
}

function spawnHarvesters(state: GameState): GameState {
  const requested = getProbeHarvesterSpawnRate(state)
  const amount = capClipFundedSpawn(requested, SPACE_DRONE_COST, state.production.unusedClips)

  if (amount <= 0) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - (amount * SPACE_DRONE_COST),
    },
    earth: {
      ...state.earth,
      harvesterLevel: state.earth.harvesterLevel + amount,
    },
    lastAction: `Space probes assembled ${formatSpaceNumber(amount)} harvesters`,
  }
}

function spawnWireDrones(state: GameState): GameState {
  const requested = getProbeWireDroneSpawnRate(state)
  const amount = capClipFundedSpawn(requested, SPACE_DRONE_COST, state.production.unusedClips)

  if (amount <= 0) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - (amount * SPACE_DRONE_COST),
    },
    earth: {
      ...state.earth,
      wireDroneLevel: state.earth.wireDroneLevel + amount,
    },
    lastAction: `Space probes assembled ${formatSpaceNumber(amount)} wire drones`,
  }
}

function spawnProbes(state: GameState): GameState {
  if (state.space.probeCount >= MAX_PROBE_COUNT) {
    return state
  }

  let nextGen = getProbeReplicationRate(state)
  let partialProbeSpawn = state.space.partialProbeSpawn

  if (nextGen > 0 && nextGen < 1) {
    partialProbeSpawn += nextGen
    if (partialProbeSpawn >= 1) {
      nextGen = 1
      partialProbeSpawn = 0
    }
  }

  if ((nextGen * state.space.probeCost) > state.production.unusedClips) {
    nextGen = Math.floor(state.production.unusedClips / state.space.probeCost)
  }

  if (nextGen <= 0 && partialProbeSpawn === state.space.partialProbeSpawn) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - (nextGen * state.space.probeCost),
    },
    space: {
      ...state.space,
      partialProbeSpawn,
      probeCount: state.space.probeCount + nextGen,
      probeDescendents: state.space.probeDescendents + nextGen,
    },
    lastAction: nextGen > 0 ? `Space probes replicated ${formatSpaceNumber(nextGen)} descendents` : state.lastAction,
  }
}

function drift(state: GameState): GameState {
  const amount = Math.min(getDriftLossRate(state), state.space.probeCount)

  if (amount <= 0) {
    return state
  }

  return {
    ...state,
    space: {
      ...state.space,
      probeCount: state.space.probeCount - amount,
      drifterCount: state.space.drifterCount + amount,
      probesLostDrift: state.space.probesLostDrift + amount,
    },
    lastAction: `Space probes lost ${formatSpaceNumber(amount)} units to drift`,
  }
}

function checkForBattles(state: GameState, random: () => number): GameState {
  if (state.space.drifterCount <= WAR_TRIGGER || state.space.probeCount <= 0 || state.space.activeBattle !== null || MAX_BATTLES < 1) {
    return state
  }

  if ((random() * 100) < 50) {
    return state
  }

  const battle = createBattle(state, random)

  return {
    ...state,
    space: {
      ...state.space,
      battleFlag: true,
      activeBattle: battle,
    },
    lastAction: `Battle joined near ${formatSpaceNumber(battle.territory)} matter`,
  }
}

function createBattle(state: GameState, random: () => number): SpaceBattle {
  const unitSize = Math.max(1, Math.min(state.space.probeCount, state.space.drifterCount) / 100)
  const drifterProbes = Math.max(1, random() * state.space.drifterCount)
  const clipProbes = Math.max(1, random() * state.space.probeCount)
  const territory = random() * state.earth.availableMatter
  const leftShips = getBattleShipCount(clipProbes, random)
  const rightShips = getBattleShipCount(drifterProbes, random)

  return {
    id: Math.floor(state.elapsedMs / SPACE_TICK_MS) + 1,
    name: getBattleName(state),
    clipProbes,
    drifterProbes,
    territory,
    unitSize,
    startingLeftShips: leftShips,
    startingRightShips: rightShips,
    leftShips,
    rightShips,
    battleClock: 0,
    masterBattleClock: 0,
    battleEndDelay: false,
    battleEndTimer: state.space.battleEndTimer,
  }
}

function resolveBattle(state: GameState, random: () => number): GameState {
  const battle = state.space.activeBattle

  if (!battle) {
    return state
  }

  let nextBattle = {
    ...battle,
    masterBattleClock: battle.masterBattleClock + 1,
  }

  let nextState = state
  const leftShips = Math.max(1, nextBattle.leftShips)
  const rightShips = Math.max(1, nextBattle.rightShips)
  const deathThreshold = BATTLE_DEATH_THRESHOLD + (nextState.space.attackSpeedFlag ? (nextState.space.probeSpeed * 0.2) : 0)
  const probeAttackStrength = nextState.space.probeCombat * PROBE_COMBAT_BASE_RATE
  const drifterDeathRoll = ((random() * probeAttackStrength) + (nextState.space.probeCombat * 0.1)) * ((leftShips / rightShips) * 0.5)
  const probeDeathRoll = random() * DRIFTER_COMBAT * ((rightShips / leftShips) * 0.5)

  if (!nextBattle.battleEndDelay && drifterDeathRoll > BATTLE_DEATH_THRESHOLD) {
    const drifterLoss = Math.min(nextBattle.unitSize, nextState.space.drifterCount)

    if (drifterLoss > 0) {
      nextBattle = {
        ...nextBattle,
        rightShips: Math.max(0, nextBattle.rightShips - 1),
      }
      nextState = {
        ...nextState,
        space: {
          ...nextState.space,
          drifterCount: nextState.space.drifterCount - drifterLoss,
        },
        lastAction: `Space probes destroyed ${formatSpaceNumber(drifterLoss)} drifters in combat`,
      }
    }
  }

  if (!nextBattle.battleEndDelay && probeDeathRoll > deathThreshold) {
    const combatLoss = Math.min(nextBattle.unitSize, nextState.space.probeCount)

    if (combatLoss > 0) {
      nextBattle = {
        ...nextBattle,
        leftShips: Math.max(0, nextBattle.leftShips - 1),
      }
      nextState = {
        ...nextState,
        space: {
          ...nextState.space,
          probeCount: nextState.space.probeCount - combatLoss,
          probesLostCombat: nextState.space.probesLostCombat + combatLoss,
        },
        lastAction: `Space probes lost ${formatSpaceNumber(combatLoss)} units in combat`,
      }
    }
  }

  if (nextBattle.leftShips <= 0) {
    nextBattle = {
      ...nextBattle,
      battleEndDelay: true,
      battleEndTimer: nextBattle.battleEndTimer - 1,
    }
  } else if (nextBattle.leftShips <= BATTLE_LOW_SHIP_THRESHOLD && nextBattle.rightShips > BATTLE_LOW_SHIP_THRESHOLD) {
    nextBattle = {
      ...nextBattle,
      battleClock: nextBattle.battleClock + 1,
    }
  }

  const shouldEndBattle = (nextBattle.battleEndDelay && nextBattle.battleEndTimer <= 0)
    || nextBattle.rightShips <= 0
    || nextBattle.battleClock > BATTLE_LOW_SHIP_TIMEOUT
    || nextBattle.masterBattleClock >= BATTLE_MASTER_TIMEOUT

  if (shouldEndBattle) {
    return finalizeBattle(nextState, nextBattle)
  }

  return {
    ...nextState,
    space: {
      ...nextState.space,
      battleFlag: true,
      activeBattle: nextBattle,
    },
  }
}

function finalizeBattle(state: GameState, battle: SpaceBattle): GameState {
  let nextState = state

  if (state.projects.project121) {
    if (battle.leftShips <= 0) {
      nextState = {
        ...nextState,
        space: {
          ...nextState.space,
          bonusHonor: 0,
          honor: nextState.space.honor - battle.startingLeftShips,
          threnodyTitle: battle.name,
        },
        lastAction: `Lost the battle of ${battle.name}`,
      }
    } else if (battle.rightShips <= 0) {
      const honorReward = battle.startingRightShips + nextState.space.bonusHonor
      nextState = {
        ...nextState,
        space: {
          ...nextState.space,
          honor: nextState.space.honor + honorReward,
          honorReward,
          bonusHonor: nextState.projects.project134 ? nextState.space.bonusHonor + 10 : nextState.space.bonusHonor,
        },
        lastAction: `Won the battle of ${battle.name}`,
      }
    }
  }

  return {
    ...nextState,
    space: {
      ...nextState.space,
      battleFlag: nextState.space.battleFlag,
      activeBattle: null,
    },
    lastAction: nextState.lastAction === state.lastAction ? 'Combat engagement concluded' : nextState.lastAction,
  }
}

function getExplorationRate(state: GameState): number {
  if (state.space.probeSpeed <= 0 || state.space.probeNav <= 0) {
    return 0
  }

  return Math.floor(state.space.probeCount) * PROBE_EXPLORATION_BASE_RATE * state.space.probeSpeed * state.space.probeNav
}

function getProbeReplicationRate(state: GameState): number {
  if (state.space.probeRep <= 0 || state.space.probeCount <= 0) {
    return 0
  }

  return state.space.probeCount * PROBE_REPLICATION_BASE_RATE * state.space.probeRep
}

function getProbeFactorySpawnRate(state: GameState): number {
  if (state.space.probeFac <= 0 || state.space.probeCount <= 0) {
    return 0
  }

  return state.space.probeCount * PROBE_FACTORY_BASE_RATE * state.space.probeFac
}

function getProbeHarvesterSpawnRate(state: GameState): number {
  if (state.space.probeHarv <= 0 || state.space.probeCount <= 0) {
    return 0
  }

  return state.space.probeCount * PROBE_HARVESTER_BASE_RATE * state.space.probeHarv
}

function getProbeWireDroneSpawnRate(state: GameState): number {
  if (state.space.probeWire <= 0 || state.space.probeCount <= 0) {
    return 0
  }

  return state.space.probeCount * PROBE_WIRE_DRONE_BASE_RATE * state.space.probeWire
}

function getHazardLossRate(state: GameState): number {
  if (state.space.probeCount <= 0) {
    return 0
  }

  const boost = Math.pow(state.space.probeHaz, 1.6)
  let amount = state.space.probeCount * (PROBE_HAZARD_BASE_RATE / ((3 * boost) + 1))

  if (state.projects.project129) {
    amount *= 0.5
  }

  return amount
}

function getDriftLossRate(state: GameState): number {
  if (state.space.probeCount <= 0 || state.space.probeTrust <= 0) {
    return 0
  }

  return state.space.probeCount * PROBE_DRIFT_BASE_RATE * Math.pow(state.space.probeTrust, 1.2)
}

function getBattleShipCount(probeForce: number, random: () => number): number {
  let ships = Math.ceil(probeForce / BATTLE_SHIP_SCALE)

  if (ships > BATTLE_SHIP_CAP) {
    ships = BATTLE_SHIP_CAP
    if (random() >= 0.5) {
      ships = Math.ceil(random() * 175)
    }
  }

  return ships
}

function getBattleName(state: GameState): string {
  const battleId = Math.floor(state.elapsedMs / SPACE_TICK_MS) + 1

  if (!state.space.battleNameFlag) {
    return `Drifter Attack ${battleId}`
  }

  return `Battle of ${formatSpaceNumber(state.earth.availableMatter)}`
}

function getProbeTrustCost(probeTrust: number): number {
  return Math.floor(Math.pow(probeTrust + 1, 1.47) * 500)
}

function capClipFundedSpawn(amount: number, unitCost: number, unusedClips: number): number {
  if (amount <= 0) {
    return 0
  }

  if ((amount * unitCost) > unusedClips) {
    return Math.floor(unusedClips / unitCost)
  }

  return amount
}

function applyProbeTrustAllocation(
  state: GameState,
  patch: Partial<GameState['space']>,
  lastAction: string,
): GameState {
  return {
    ...state,
    space: {
      ...state.space,
      ...patch,
      probeUsedTrust: state.space.probeUsedTrust + 1,
    },
    lastAction,
  }
}

function formatSpaceNumber(value: number): string {
  return value >= 100 ? `${Math.round(value)}` : `${Math.round(value * 100) / 100}`
}
