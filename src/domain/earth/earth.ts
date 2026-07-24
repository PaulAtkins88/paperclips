import { getSwarmEfficiency } from '../compute/swarm'
import { INITIAL_BATTERY_COST, INITIAL_FACTORY_COST, INITIAL_FARM_COST, INITIAL_HARVESTER_COST, INITIAL_WIRE_DRONE_COST, type GameState } from '../game'

export const EARTH_TICK_MS = 100

export interface EarthPowerStatus {
  performancePercent: number
  powerProductionRate: number
  powerConsumptionRate: number
  factoryPowerConsumptionRate: number
  dronePowerConsumptionRate: number
  storedPower: number
  maxStoredPower: number
}

export function runEarthTick(state: GameState, deltaMs: number): GameState {
  if (state.paused || state.earth.humanFlag) {
    return state
  }

  const ticks = Math.max(1, Math.floor(deltaMs / EARTH_TICK_MS))
  let next = state
  let producedClips = 0

  for (let index = 0; index < ticks; index += 1) {
    next = syncEarthPower(next)
    next = acquireMatter(next)
    next = processMatter(next)

    const requestedFactoryOutput = next.earth.powMod * Math.floor(next.earth.factoryLevel) * next.earth.factoryRate
    const actualFactoryOutput = Math.min(requestedFactoryOutput, next.production.wire)

    if (actualFactoryOutput > 0) {
      producedClips += actualFactoryOutput
      next = {
        ...next,
        production: {
          ...next.production,
          clips: next.production.clips + actualFactoryOutput,
          unsoldClips: next.production.unsoldClips + actualFactoryOutput,
          unusedClips: next.production.unusedClips + actualFactoryOutput,
          wire: next.production.wire - actualFactoryOutput,
        },
      }
    }
  }

  return {
    ...next,
    lastTickProduction: next.lastTickProduction + producedClips,
    lastAction: producedClips > 0 ? `Earth automation produced ${formatEarthNumber(producedClips)} clips` : next.lastAction,
  }
}

export function buyFactory(state: GameState): GameState {
  if (state.earth.humanFlag || !state.earth.factoryFlag || state.production.unusedClips < state.earth.factoryCost) {
    return state
  }

  const nextLevel = state.earth.factoryLevel + 1
  const multiplier = getFactoryCostMultiplier(nextLevel)

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - state.earth.factoryCost,
    },
    earth: {
      ...state.earth,
      factoryLevel: nextLevel,
      powMod: Math.max(1, state.earth.powMod),
      factoryCost: state.earth.factoryCost * multiplier,
      factoryBill: state.earth.factoryBill + state.earth.factoryCost,
    },
    lastAction: 'Built a clip factory',
  }
}

export function rebootFactories(state: GameState): GameState {
  if (state.earth.factoryLevel === 0) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips + state.earth.factoryBill,
    },
    earth: {
      ...state.earth,
      factoryLevel: 0,
      factoryCost: INITIAL_FACTORY_COST,
      factoryBill: 0,
    },
  }
}

export function buyFarm(state: GameState, quantity = 1): GameState {
  const farmCost = getFarmCost(state.earth.farmLevel, quantity)
  if (state.earth.humanFlag || !state.earth.powerGridFlag || state.production.unusedClips < farmCost) {
    return state
  }

  const nextLevel = state.earth.farmLevel + quantity

  return syncEarthPower({
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - farmCost,
    },
    earth: {
      ...state.earth,
      farmLevel: nextLevel,
      farmCost: getFarmCost(nextLevel, 1),
      farmBill: state.earth.farmBill + farmCost,
    },
    lastAction: (quantity === 1) ? 'Built a solar farm' : `Built ${quantity} solar farms`,
  })
}

export function rebootFarms(state: GameState): GameState {
  if (state.earth.farmLevel === 0) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips + state.earth.farmBill,
    },
    earth: {
      ...state.earth,
      farmLevel: 0,
      farmCost: INITIAL_FARM_COST,
      farmBill: 0,
    },
  }
}

export function buyBattery(state: GameState, quantity = 1): GameState {
  const batteryCost = getBatteryCost(state.earth.batteryLevel, quantity)
  if (state.earth.humanFlag || !state.earth.powerGridFlag || state.production.unusedClips < batteryCost) {
    return state
  }

  const nextLevel = state.earth.batteryLevel + quantity

  return syncEarthPower({
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - batteryCost,
    },
    earth: {
      ...state.earth,
      batteryLevel: nextLevel,
      batteryCost: getBatteryCost(nextLevel, 1),
      batteryBill: state.earth.batteryBill + batteryCost,
    },
    lastAction: (quantity === 1) ? 'Built a battery tower' : `Built ${quantity} battery towers`,
  })
}

export function rebootBatteries(state: GameState): GameState {
  if (state.earth.batteryLevel === 0) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips + state.earth.batteryBill,
    },
    earth: {
      ...state.earth,
      batteryLevel: 0,
      batteryCost: INITIAL_BATTERY_COST,
      batteryBill: 0,
      storedPower: 0,
    },
  }
}

export function buyHarvester(state: GameState, quantity = 1): GameState {
  const harvesterCost = getDroneCost(state.earth.harvesterLevel, quantity)
  if (state.earth.humanFlag || !state.earth.harvesterFlag || state.production.unusedClips < harvesterCost) {
    return state
  }

  const nextLevel = state.earth.harvesterLevel + quantity

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - harvesterCost,
    },
    earth: {
      ...state.earth,
      harvesterLevel: nextLevel,
      powMod: Math.max(1, state.earth.powMod),
      harvesterCost: getDroneCost(nextLevel, 1),
      harvesterBill: state.earth.harvesterBill + harvesterCost,
    },
    lastAction: (quantity === 1) ? 'Built a harvester drone' : `Built ${quantity} harvester drones`,
  }
}

export function rebootHarvesters(state: GameState): GameState {
  if (state.earth.harvesterLevel === 0) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips + state.earth.harvesterBill,
    },
    earth: {
      ...state.earth,
      harvesterLevel: 0,
      harvesterCost: INITIAL_HARVESTER_COST,
      harvesterBill: 0,
    },
  }
}

export function buyWireDrone(state: GameState, quantity = 1): GameState {
  const wireDroneCost = getDroneCost(state.earth.wireDroneLevel, quantity)
  if (state.earth.humanFlag || !state.earth.wireDroneFlag || state.production.unusedClips < wireDroneCost) {
    return state
  }

  const nextLevel = state.earth.wireDroneLevel + quantity

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - wireDroneCost,
    },
    earth: {
      ...state.earth,
      wireDroneLevel: nextLevel,
      powMod: Math.max(1, state.earth.powMod),
      wireDroneCost: getDroneCost(nextLevel, 1),
      wireDroneBill: state.earth.wireDroneBill + wireDroneCost,
    },
    lastAction: (quantity === 1) ? 'Built a wire drone' : `Built ${quantity} wire drones`,
  }
}

export function rebootWireDrones(state: GameState): GameState {
  if (state.earth.wireDroneLevel === 0) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips + state.earth.wireDroneBill,
    },
    earth: {
      ...state.earth,
      wireDroneLevel: 0,
      wireDroneCost: INITIAL_WIRE_DRONE_COST,
      wireDroneBill: 0,
    },
  }
}

export function getDroneCost(level: number, quantity: number): number {
  let cost = 0
  for (let i = 0; i < quantity; i++) {
    cost += Math.pow(i + level + 1, 2.25) * 1_000_000
  }
  return cost
}

export function getFarmCost(level: number, quantity: number): number {
  let cost = 0
  for (let i = 0; i < quantity; i++) {
    cost += Math.pow(i + level + 1, 2.78) * 10_000_000
  }
  return cost
}

export function getBatteryCost(level: number, quantity: number): number {
  let cost = 0
  for (let i = 0; i < quantity; i++) {
    cost += Math.pow(i + level + 1, 2.54) * 1_000_000
  }
  return cost
}

function acquireMatter(state: GameState): GameState {
  if (!state.earth.harvesterFlag || state.earth.harvesterLevel < 1 || state.earth.availableMatter <= 0) {
    return state
  }

  const swarmEfficiency = getSwarmEfficiency(state)
  const requested = state.earth.powMod * swarmEfficiency * Math.floor(state.earth.harvesterLevel) * state.earth.harvesterRate
  const amount = Math.min(requested, state.earth.availableMatter)

  if (amount <= 0) {
    return state
  }

  return {
    ...state,
    earth: {
      ...state.earth,
      availableMatter: state.earth.availableMatter - amount,
      acquiredMatter: state.earth.acquiredMatter + amount,
    },
  }
}

function processMatter(state: GameState): GameState {
  if (!state.earth.wireProductionFlag || !state.earth.wireDroneFlag || state.earth.wireDroneLevel < 1 || state.earth.acquiredMatter <= 0) {
    return state
  }

  const swarmEfficiency = getSwarmEfficiency(state)
  const requested = state.earth.powMod * swarmEfficiency * Math.floor(state.earth.wireDroneLevel) * state.earth.wireDroneRate
  const amount = Math.min(requested, state.earth.acquiredMatter)

  if (amount <= 0) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      wire: state.production.wire + amount,
    },
    earth: {
      ...state.earth,
      acquiredMatter: state.earth.acquiredMatter - amount,
      processedMatter: state.earth.processedMatter + amount,
      nanoWire: state.earth.nanoWire + amount,
    },
  }
}

function getFactoryCostMultiplier(level: number): number {
  if (level <= 7) {
    return 11 - level
  }

  if (level <= 12) {
    return 2
  }

  if (level <= 19) {
    return 1.5
  }

  if (level <= 38) {
    return 1.25
  }

  if (level <= 78) {
    return 1.15
  }

  return 1.1
}

export function getEarthPowerStatus(state: GameState): EarthPowerStatus {
  return {
    performancePercent: getEarthPerformancePercent(state),
    powerProductionRate: state.earth.powerProductionRate,
    powerConsumptionRate: state.earth.powerConsumptionRate,
    factoryPowerConsumptionRate: state.earth.factoryPowerConsumptionRate,
    dronePowerConsumptionRate: state.earth.dronePowerConsumptionRate,
    storedPower: state.earth.storedPower,
    maxStoredPower: getMaxStoredPower(state),
  }
}

function syncEarthPower(state: GameState): GameState {
  if (state.earth.humanFlag || state.earth.spaceFlag || !state.earth.powerGridFlag) {
    return state
  }

  const powerProductionRate = state.earth.farmLevel * state.earth.farmRate
  const dronePowerConsumptionRate = (state.earth.harvesterLevel + state.earth.wireDroneLevel) * state.earth.dronePowerRate
  const factoryPowerConsumptionRate = state.earth.factoryLevel * state.earth.factoryPowerRate
  const powerConsumptionRate = dronePowerConsumptionRate + factoryPowerConsumptionRate
  const maxStoredPower = getMaxStoredPower(state)
  const hasLoad = powerConsumptionRate > 0

  let storedPower = Math.min(state.earth.storedPower, maxStoredPower)
  let powMod = state.earth.powMod

  if (!hasLoad) {
    powMod = 0
    if (powerProductionRate > 0 && maxStoredPower > storedPower) {
      storedPower = Math.min(maxStoredPower, storedPower + powerProductionRate)
    }
  } else if (powerProductionRate >= powerConsumptionRate) {
    const extraSupply = powerProductionRate - powerConsumptionRate
    storedPower = Math.min(maxStoredPower, storedPower + extraSupply)
    powMod = applyMomentumBonus(1, state)
  } else {
    const deficit = powerConsumptionRate - powerProductionRate

    if (storedPower >= deficit) {
      storedPower -= deficit
      powMod = applyMomentumBonus(1, state)
    } else if (storedPower > 0) {
      const unmetDeficit = deficit - storedPower
      storedPower = 0
      const netSupply = powerProductionRate - unmetDeficit
      powMod = powerConsumptionRate > 0 ? netSupply / powerConsumptionRate : 0
    } else {
      powMod = powerConsumptionRate > 0 ? powerProductionRate / powerConsumptionRate : 0
    }
  }

  if (state.earth.powMod === powMod
    && state.earth.powerProductionRate === powerProductionRate
    && state.earth.powerConsumptionRate === powerConsumptionRate
    && state.earth.factoryPowerConsumptionRate === factoryPowerConsumptionRate
    && state.earth.dronePowerConsumptionRate === dronePowerConsumptionRate
    && state.earth.storedPower === storedPower) {
    return state
  }

  return {
    ...state,
    earth: {
      ...state.earth,
      powMod,
      powerProductionRate,
      powerConsumptionRate,
      factoryPowerConsumptionRate,
      dronePowerConsumptionRate,
      storedPower,
    },
  }
}

function getMaxStoredPower(state: GameState): number {
  return state.earth.batteryLevel * state.earth.batterySize
}

function getEarthPerformancePercent(state: GameState): number {
  const hasLoad = state.earth.factoryLevel > 0 || state.earth.harvesterLevel > 0 || state.earth.wireDroneLevel > 0
  return hasLoad ? Math.round(state.earth.powMod * 100) : 0
}

function applyMomentumBonus(powMod: number, state: GameState): number {
  if (powMod < 1) {
    return powMod
  }

  return state.earth.momentum === 1 ? powMod + 0.0005 : powMod
}

function formatEarthNumber(value: number): string {
  return value >= 100 ? `${Math.round(value)}` : `${Math.round(value * 100) / 100}`
}
