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

    const factoryBoost = next.earth.factoryBoost > 1 ? next.earth.factoryBoost * next.earth.factoryLevel : 1
    const requestedFactoryOutput = next.earth.powMod * factoryBoost * Math.floor(next.earth.factoryLevel) * next.earth.factoryRate
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

export function buyFarm(state: GameState): GameState {
  if (state.earth.humanFlag || !state.earth.powerGridFlag || state.production.unusedClips < state.earth.farmCost) {
    return state
  }

  const nextLevel = state.earth.farmLevel + 1

  return syncEarthPower({
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - state.earth.farmCost,
    },
    earth: {
      ...state.earth,
      farmLevel: nextLevel,
      farmCost: Math.pow(nextLevel + 1, 2.78) * 10_000_000,
      farmBill: state.earth.farmBill + state.earth.farmCost,
    },
    lastAction: 'Built a solar farm',
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

export function buyBattery(state: GameState): GameState {
  if (state.earth.humanFlag || !state.earth.powerGridFlag || state.production.unusedClips < state.earth.batteryCost) {
    return state
  }

  const nextLevel = state.earth.batteryLevel + 1

  return syncEarthPower({
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - state.earth.batteryCost,
    },
    earth: {
      ...state.earth,
      batteryLevel: nextLevel,
      batteryCost: Math.pow(nextLevel + 1, 2.54) * 1_000_000,
      batteryBill: state.earth.batteryBill + state.earth.batteryCost,
    },
    lastAction: 'Built a battery tower',
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

export function buyHarvester(state: GameState): GameState {
  if (state.earth.humanFlag || !state.earth.harvesterFlag || state.production.unusedClips < state.earth.harvesterCost) {
    return state
  }

  const nextLevel = state.earth.harvesterLevel + 1

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - state.earth.harvesterCost,
    },
    earth: {
      ...state.earth,
      harvesterLevel: nextLevel,
      powMod: Math.max(1, state.earth.powMod),
      harvesterCost: Math.pow(nextLevel + 1, 2.25) * 1_000_000,
      harvesterBill: state.earth.harvesterBill + state.earth.harvesterCost,
    },
    lastAction: 'Built a harvester drone',
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

export function buyWireDrone(state: GameState): GameState {
  if (state.earth.humanFlag || !state.earth.wireDroneFlag || state.production.unusedClips < state.earth.wireDroneCost) {
    return state
  }

  const nextLevel = state.earth.wireDroneLevel + 1

  return {
    ...state,
    production: {
      ...state.production,
      unusedClips: state.production.unusedClips - state.earth.wireDroneCost,
    },
    earth: {
      ...state.earth,
      wireDroneLevel: nextLevel,
      powMod: Math.max(1, state.earth.powMod),
      wireDroneCost: Math.pow(nextLevel + 1, 2.25) * 1_000_000,
      wireDroneBill: state.earth.wireDroneBill + state.earth.wireDroneCost,
    },
    lastAction: 'Built a wire drone',
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

function acquireMatter(state: GameState): GameState {
  if (!state.earth.harvesterFlag || state.earth.harvesterLevel < 1 || state.earth.availableMatter <= 0) {
    return state
  }

  const swarmEfficiency = getSwarmEfficiency(state)
  const harvesterBoost = state.earth.droneBoost > 1 ? state.earth.droneBoost * Math.floor(state.earth.harvesterLevel) : 1
  const requested = state.earth.powMod * swarmEfficiency * harvesterBoost * Math.floor(state.earth.harvesterLevel) * state.earth.harvesterRate
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
  const wireDroneBoost = state.earth.droneBoost > 1 ? state.earth.droneBoost * Math.floor(state.earth.wireDroneLevel) : 1
  const requested = state.earth.powMod * swarmEfficiency * wireDroneBoost * Math.floor(state.earth.wireDroneLevel) * state.earth.wireDroneRate
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
