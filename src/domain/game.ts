/**
 * Game logic, mathematical constants, and project definitions are derived from
 * the original Universal Paperclips (© Frank Lantz). This implementation is an
 * unofficial, non-commercial reconstruction.
 */

import { computeAutoClipperCost, computeMegaClipperCost, DEFAULT_CLIPPER_BOOST, DEFAULT_MEGA_CLIPPER_BOOST } from './economy/clippers'
import {
  addMemory,
  addProcessor,
  runComputeTick,
  syncComputeState,
  unlockCreativity,
} from './compute/compute'
import {
  INITIAL_CREATIVITY_SPEED,
  INITIAL_FIB1,
  INITIAL_FIB2,
  INITIAL_MEMORY,
  INITIAL_NEXT_TRUST,
  INITIAL_PROCESSORS,
  INITIAL_TRUST,
} from './compute/trust'
import { getMaxOperations, OP_FADE_DELAY } from './compute/operations'
import { applyManualClipProduction, applyWirePurchaseToEconomy, runEarlyEconomyTick, syncEarlyEconomyState } from './economy/earlyEconomy'
import {
  cycleInvestmentRiskMode,
  INITIAL_INVEST_UPGRADE_COST,
  INITIAL_MAX_PORTFOLIO_SIZE,
  INITIAL_STOCK_GAIN_THRESHOLD,
  investDeposit,
  investUpgrade,
  investWithdraw,
  runInvestmentTick,
  type InvestmentRiskMode,
  type StockPosition,
} from './investments/investments'
import { computeDemand as computeDemandRule, normalizeClipPrice } from './economy/pricing'
import { buyBattery, buyFactory, buyFarm, buyHarvester, buyWireDrone, runEarthTick } from './earth/earth'
import {
  assignProbeTrust,
  increaseMaxTrust,
  increaseProbeTrust,
  launchProbe,
  runSpaceColonizationTick,
  runSpaceExplorationTick,
} from './space/space'
import { createInitialWireMarket } from './economy/wireMarket'
import { activateProject, canActivateProject, countCompletedProjects, countTotalProjects, getVisibleProjects } from './projects/projectRegistry'
import {
  canRunTournament,
  cycleStrategySelection,
  formatStrategyLabel,
  runStrategyTick,
  runTournament,
  toggleAutoTourney,
  type StrategyId,
  type StrategySelection,
  type TournamentPayoffMatrix,
  type TournamentResult,
} from './strategy/tournaments'
import type { ProjectCost, ProjectId, VisibleProject } from './projects/projectTypes'
import { setSwarmComputingBalance, entertainSwarm, GIFT_PERIOD, INITIAL_ENTERTAIN_COST, SYNCHRONIZATION_COST, synchronizeSwarm, type SwarmStatus } from './compute/swarm'

export type GamePhase = 'boot' | 'industry' | 'compute' | 'expansion'
export type GameEarthPhase = 'human' | 'postHuman'

export interface GameEconomy {
  clipPrice: number
  wirePrice: number
  wireCost: number
  wireBasePrice: number
  wirePriceCounter: number
  wirePriceTimer: number
  demand: number
  marketingEffectiveness: number
  demandBoost: number
  clipperBoost: number
  megaClipperBoost: number
  wireSupply: number
  adCost: number
}

export interface GameProduction {
  clips: number
  unsoldClips: number
  unusedClips: number
  wire: number
  funds: number
  autoClippers: number
  autoClipperCost: number
  marketingLevel: number
  megaClippers: number
  megaClipperCost: number
}

export interface GameCompute {
  unlocked: boolean
  processors: number
  memory: number
  operations: number
  standardOps: number
  tempOps: number
  trust: number
  nextTrust: number
  fib1: number
  fib2: number
  creativity: number
  creativityOn: boolean
  creativitySpeed: number
  creativityCounter: number
  opFade: number
  opFadeTimer: number
  opFadeDelay: number
  swarmFlag: boolean
  giftBits: number
  giftPeriod: number
  swarmGifts: number
  boredomLevel: number
  entertainCost: number
  boredomFlag: boolean
  disorgFlag: boolean
  disorgCounter: number
  synchCost: number
  swarmComputingBalance: number
}

export interface GamePrestige {
  universe: number
  within: number
}

export interface GameInvestment {
  unlocked: boolean
  bankroll: number
  stocks: StockPosition[]
  portfolioSize: number
  stockId: number
  secTotal: number
  portTotal: number
  sellDelay: number
  riskMode: InvestmentRiskMode
  riskiness: number
  maxPort: number
  investLevel: number
  investUpgradeCost: number
  stockGainThreshold: number
  ledger: number
  stockReportCounter: number
  portfolioTickMs: number
  stockShopTickMs: number
  stockMarketTickMs: number
}

export interface GameStrategy {
  unlocked: boolean
  strategies: StrategyId[]
  selectedStrategy: StrategySelection
  yomi: number
  yomiBoost: number
  tourneyCost: number
  tourneyLevel: number
  autoTourneyEnabled: boolean
  resultsTimer: number
  lastResults: TournamentResult[]
  lastPayoffMatrix: TournamentPayoffMatrix | null
  hMovePrev: 'A' | 'B'
  vMovePrev: 'A' | 'B'
}

export interface GameEarth {
  phase: GameEarthPhase
  humanFlag: boolean
  spaceFlag: boolean
  availableMatter: number
  acquiredMatter: number
  processedMatter: number
  nanoWire: number
  tothFlag: boolean
  powerGridFlag: boolean
  wireProductionFlag: boolean
  harvesterFlag: boolean
  wireDroneFlag: boolean
  factoryFlag: boolean
  powMod: number
  powerProductionRate: number
  powerConsumptionRate: number
  factoryPowerConsumptionRate: number
  dronePowerConsumptionRate: number
  storedPower: number
  farmLevel: number
  batteryLevel: number
  factoryLevel: number
  harvesterLevel: number
  wireDroneLevel: number
  farmCost: number
  batteryCost: number
  factoryCost: number
  harvesterCost: number
  wireDroneCost: number
  farmRate: number
  batterySize: number
  factoryPowerRate: number
  dronePowerRate: number
  factoryRate: number
  harvesterRate: number
  wireDroneRate: number
  momentum: number
}

export interface GameSpace {
  totalMatter: number
  foundMatter: number
  partialProbeSpawn: number
  partialProbeHaz: number
  battleFlag: boolean
  battleNameFlag: boolean
  attackSpeedFlag: boolean
  battleEndTimer: number
  activeBattle: SpaceBattle | null
  probeCount: number
  probeLaunchLevel: number
  probeDescendents: number
  drifterCount: number
  probesLostHaz: number
  probesLostDrift: number
  probesLostCombat: number
  probeCost: number
  probeTrust: number
  probeUsedTrust: number
  probeTrustCost: number
  maxTrust: number
  probeSpeed: number
  probeNav: number
  probeCombat: number
  probeRep: number
  probeHaz: number
  probeFac: number
  probeHarv: number
  probeWire: number
  honor: number
  bonusHonor: number
  honorReward: number
  maxTrustCost: number
  threnodyCost: number
  threnodyTitle: string
}

export interface SpaceBattle {
  id: number
  name: string
  clipProbes: number
  drifterProbes: number
  territory: number
  unitSize: number
  startingLeftShips: number
  startingRightShips: number
  leftShips: number
  rightShips: number
  battleClock: number
  masterBattleClock: number
  battleEndDelay: boolean
  battleEndTimer: number
}

export interface GameState {
  version: 10
  elapsedMs: number
  paused: boolean
  production: GameProduction
  economy: GameEconomy
  compute: GameCompute
  prestige: GamePrestige
  investment: GameInvestment
  strategy: GameStrategy
  earth: GameEarth
  space: GameSpace
  wirePurchased: number
  lastTickProduction: number
  lastTickSales: number
  lastTickRevenue: number
  lastAction: string
  projects: Record<ProjectId, boolean>
  phase: GamePhase
}

export const GAME_VERSION = 10
export const WIRE_UNIT_LABEL = 'inches'
export const WIRE_BATCH_UNIT = 1_000
export const WIRE_PER_CLIP = 1
export const INITIAL_WIRE = 1_000
export const INITIAL_FUNDS = 0
export const INITIAL_CLIP_PRICE = 0.25

const INITIAL_MARKETING_LEVEL = 1
const INITIAL_AD_COST = 100
const INITIAL_WIRE_SUPPLY = 1_000
const INITIAL_AVAILABLE_MATTER = Math.pow(10, 24) * 6_000
const INITIAL_TOTAL_MATTER = 3 * Math.pow(10, 55)
const INITIAL_FACTORY_COST = 100_000_000
const INITIAL_HARVESTER_COST = 1_000_000
const INITIAL_WIRE_DRONE_COST = 1_000_000
const INITIAL_FARM_COST = 10_000_000
const INITIAL_BATTERY_COST = 1_000_000
const INITIAL_FARM_RATE = 50
const INITIAL_BATTERY_SIZE = 10_000
const INITIAL_FACTORY_POWER_RATE = 200
const INITIAL_DRONE_POWER_RATE = 1
const INITIAL_FACTORY_RATE = 1_000_000_000
const INITIAL_HARVESTER_RATE = 26_180_337
const INITIAL_WIRE_DRONE_RATE = 16_180_339
const INITIAL_PROBE_COST = Math.pow(10, 17)
const INITIAL_PROBE_TRUST_COST = 500
const INITIAL_MAX_PROBE_TRUST = 20
const INITIAL_MAX_TRUST_COST = 91_117.99
const INITIAL_THRENODY_COST = 50_000

export function formatCurrency(value: number): string {
  return `$${formatNumber(value, 2)}`
}

export function formatWireAmount(value: number): string {
  return `${formatNumber(value)} ${WIRE_UNIT_LABEL}`
}

export function getWireBatchCost(state: GameState, amount: number): number {
  const spools = Math.max(1, Math.floor(amount))
  return spools * state.economy.wireCost
}

export function getWirePurchaseAmount(state: GameState, amount: number): number {
  const spools = Math.max(1, Math.floor(amount))
  return spools * state.economy.wireSupply
}

export type GameAction =
  | { type: 'tick'; deltaMs: number }
  | { type: 'makeClip' }
  | { type: 'buyWire'; amount: number }
  | { type: 'buyFactory' }
  | { type: 'buyHarvester' }
  | { type: 'buyWireDrone' }
  | { type: 'buyFarm' }
  | { type: 'buyBattery' }
  | { type: 'setSwarmComputingBalance'; workThinkBalance: number }
  | { type: 'entertainSwarm' }
  | { type: 'synchronizeSwarm' }
  | { type: 'launchProbe' }
  | { type: 'increaseProbeTrust' }
  | { type: 'increaseMaxTrust' }
  | { type: 'assignProbeTrust'; target: 'speed' | 'nav' | 'rep' | 'haz' | 'fac' | 'harv' | 'wire' | 'combat' }
  | { type: 'buyMarketing' }
  | { type: 'buyAutoClipper' }
  | { type: 'buyMegaClipper' }
  | { type: 'investDeposit' }
  | { type: 'investWithdraw' }
  | { type: 'investUpgrade' }
  | { type: 'cycleInvestmentRisk' }
  | { type: 'runTournament' }
  | { type: 'cycleStrategySelection' }
  | { type: 'toggleAutoTourney' }
  | { type: 'addProcessor' }
  | { type: 'addMemory' }
  | { type: 'unlockCreativity' }
  | { type: 'setPrice'; price: number }
  | { type: 'completeProject'; projectId: ProjectId }
  | { type: 'togglePause' }
  | { type: 'reset' }

export function createInitialGameState(): GameState {
  const wireMarket = createInitialWireMarket()

  return {
    version: GAME_VERSION,
    elapsedMs: 0,
    paused: false,
    production: {
      clips: 0,
      unsoldClips: 0,
      unusedClips: 0,
      wire: INITIAL_WIRE,
      funds: INITIAL_FUNDS,
      autoClippers: 0,
      autoClipperCost: computeAutoClipperCost(0),
      marketingLevel: INITIAL_MARKETING_LEVEL,
      megaClippers: 0,
      megaClipperCost: computeMegaClipperCost(0),
    },
    economy: {
      clipPrice: INITIAL_CLIP_PRICE,
      wirePrice: wireMarket.wireCost / WIRE_BATCH_UNIT,
      wireCost: wireMarket.wireCost,
      wireBasePrice: wireMarket.wireBasePrice,
      wirePriceCounter: wireMarket.wirePriceCounter,
      wirePriceTimer: wireMarket.wirePriceTimer,
      demand: computeDemandRule({
        clipPrice: INITIAL_CLIP_PRICE,
        marketingLevel: INITIAL_MARKETING_LEVEL,
        marketingEffectiveness: 1,
        demandBoost: 1,
      }),
      marketingEffectiveness: 1,
      demandBoost: 1,
      clipperBoost: DEFAULT_CLIPPER_BOOST,
      megaClipperBoost: DEFAULT_MEGA_CLIPPER_BOOST,
      wireSupply: INITIAL_WIRE_SUPPLY,
      adCost: INITIAL_AD_COST,
    },
    compute: {
      unlocked: false,
      processors: INITIAL_PROCESSORS,
      memory: INITIAL_MEMORY,
      operations: 0,
      standardOps: 0,
      tempOps: 0,
      trust: INITIAL_TRUST,
      nextTrust: INITIAL_NEXT_TRUST,
      fib1: INITIAL_FIB1,
      fib2: INITIAL_FIB2,
      creativity: 0,
      creativityOn: false,
      creativitySpeed: INITIAL_CREATIVITY_SPEED,
      creativityCounter: 0,
      opFade: 0,
      opFadeTimer: 0,
      opFadeDelay: OP_FADE_DELAY,
      swarmFlag: false,
      giftBits: 0,
      giftPeriod: GIFT_PERIOD,
      swarmGifts: 0,
      boredomLevel: 0,
      boredomFlag: false,
      entertainCost: INITIAL_ENTERTAIN_COST,
      disorgFlag: false,
      disorgCounter: 0,
      synchCost: SYNCHRONIZATION_COST,
      swarmComputingBalance: 0,
    },
    prestige: {
      universe: 0,
      within: 0,
    },
    investment: {
      unlocked: false,
      bankroll: 0,
      stocks: [],
      portfolioSize: 0,
      stockId: 0,
      secTotal: 0,
      portTotal: 0,
      sellDelay: 0,
      riskMode: 'med',
      riskiness: 5,
      maxPort: INITIAL_MAX_PORTFOLIO_SIZE,
      investLevel: 0,
      investUpgradeCost: INITIAL_INVEST_UPGRADE_COST,
      stockGainThreshold: INITIAL_STOCK_GAIN_THRESHOLD,
      ledger: 0,
      stockReportCounter: 0,
      portfolioTickMs: 0,
      stockShopTickMs: 0,
      stockMarketTickMs: 0,
    },
    strategy: {
      unlocked: false,
      strategies: ['RANDOM'],
      selectedStrategy: 'NONE',
      yomi: 0,
      yomiBoost: 1,
      tourneyCost: 1_000,
      tourneyLevel: 1,
      autoTourneyEnabled: false,
      resultsTimer: 0,
      lastResults: [],
      lastPayoffMatrix: null,
      hMovePrev: 'A',
      vMovePrev: 'A',
    },
    earth: {
      phase: 'human',
      humanFlag: true,
      spaceFlag: false,
      availableMatter: INITIAL_AVAILABLE_MATTER,
      acquiredMatter: 0,
      processedMatter: 0,
      nanoWire: 0,
      tothFlag: false,
      powerGridFlag: false,
      wireProductionFlag: false,
      harvesterFlag: false,
      wireDroneFlag: false,
      factoryFlag: false,
      powMod: 0,
      powerProductionRate: 0,
      powerConsumptionRate: 0,
      factoryPowerConsumptionRate: 0,
      dronePowerConsumptionRate: 0,
      storedPower: 0,
      farmLevel: 0,
      batteryLevel: 0,
      factoryLevel: 0,
      harvesterLevel: 0,
      wireDroneLevel: 0,
      farmCost: INITIAL_FARM_COST,
      batteryCost: INITIAL_BATTERY_COST,
      factoryCost: INITIAL_FACTORY_COST,
      harvesterCost: INITIAL_HARVESTER_COST,
      wireDroneCost: INITIAL_WIRE_DRONE_COST,
      farmRate: INITIAL_FARM_RATE,
      batterySize: INITIAL_BATTERY_SIZE,
      factoryPowerRate: INITIAL_FACTORY_POWER_RATE,
      dronePowerRate: INITIAL_DRONE_POWER_RATE,
      factoryRate: INITIAL_FACTORY_RATE,
      harvesterRate: INITIAL_HARVESTER_RATE,
      wireDroneRate: INITIAL_WIRE_DRONE_RATE,
      momentum: 0,
    },
    space: {
      totalMatter: INITIAL_TOTAL_MATTER,
      foundMatter: INITIAL_AVAILABLE_MATTER,
      partialProbeSpawn: 0,
      partialProbeHaz: 0,
      battleFlag: false,
      battleNameFlag: false,
      attackSpeedFlag: false,
      battleEndTimer: 100,
      activeBattle: null,
      probeCount: 0,
      probeLaunchLevel: 0,
      probeDescendents: 0,
      drifterCount: 0,
      probesLostHaz: 0,
      probesLostDrift: 0,
      probesLostCombat: 0,
      probeCost: INITIAL_PROBE_COST,
      probeTrust: 0,
      probeUsedTrust: 0,
      probeTrustCost: INITIAL_PROBE_TRUST_COST,
      maxTrust: INITIAL_MAX_PROBE_TRUST,
      probeSpeed: 0,
      probeNav: 0,
      probeCombat: 0,
      probeRep: 0,
      probeHaz: 0,
      probeFac: 0,
      probeHarv: 0,
      probeWire: 0,
      honor: 0,
      bonusHonor: 0,
      honorReward: 0,
      maxTrustCost: INITIAL_MAX_TRUST_COST,
      threnodyCost: INITIAL_THRENODY_COST,
      threnodyTitle: 'the Driftwar Fallen',
    },
    wirePurchased: 0,
    lastTickProduction: 0,
    lastTickSales: 0,
    lastTickRevenue: 0,
    lastAction: 'Factory booted',
    projects: createInitialProjectFlags(),
    phase: 'boot',
  }
}

export function reduceGameState(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'tick':
      return tick(state, action.deltaMs)
    case 'makeClip':
      return makeClip(state)
    case 'buyWire':
      return buyWire(state, action.amount)
    case 'buyFactory':
      return buyFactory(state)
    case 'buyHarvester':
      return buyHarvester(state)
    case 'buyWireDrone':
      return buyWireDrone(state)
    case 'buyFarm':
      return buyFarm(state)
    case 'buyBattery':
      return buyBattery(state)
    case 'setSwarmComputingBalance':
      return setSwarmComputingBalance(state, action.workThinkBalance)
    case 'entertainSwarm':
      return entertainSwarm(state)
    case 'synchronizeSwarm':
      return synchronizeSwarm(state)
    case 'launchProbe':
      return launchProbe(state)
    case 'increaseProbeTrust':
      return increaseProbeTrust(state)
    case 'increaseMaxTrust':
      return increaseMaxTrust(state)
    case 'assignProbeTrust':
      return assignProbeTrust(state, action.target)
    case 'buyMarketing':
      return buyMarketing(state)
    case 'buyAutoClipper':
      return buyAutoClipper(state)
    case 'buyMegaClipper':
      return buyMegaClipper(state)
    case 'investDeposit':
      return investDeposit(state)
    case 'investWithdraw':
      return investWithdraw(state)
    case 'investUpgrade':
      return investUpgrade(state)
    case 'cycleInvestmentRisk':
      return cycleInvestmentRiskMode(state)
    case 'runTournament':
      return runTournament(state, Math.random)
    case 'cycleStrategySelection':
      return cycleStrategySelection(state)
    case 'toggleAutoTourney':
      return toggleAutoTourney(state)
    case 'addProcessor':
      return addProcessor(syncComputeState(state))
    case 'addMemory':
      return addMemory(syncComputeState(state))
    case 'unlockCreativity':
      return unlockCreativity(syncComputeState(state))
    case 'setPrice':
      return setPrice(state, action.price)
    case 'completeProject':
      return completeProject(state, action.projectId)
    case 'togglePause':
      return { ...state, paused: !state.paused, lastAction: !state.paused ? 'Simulation paused' : 'Simulation resumed' }
    case 'reset':
      return createInitialGameState()
    default:
      return state
  }
}

function tick(state: GameState, deltaMs: number): GameState {
  const economyTick = runEarlyEconomyTick(state, deltaMs, Math.random)
  const computeTick = runComputeTick(economyTick, deltaMs)
  const investmentTick = runInvestmentTick(computeTick, deltaMs, Math.random)
  const strategyTick = runStrategyTick(investmentTick, deltaMs, Math.random)
  const spaceExplorationTick = runSpaceExplorationTick(strategyTick, deltaMs)
  const earthTick = runEarthTick(spaceExplorationTick, deltaMs)
  const next = runSpaceColonizationTick(earthTick, deltaMs)

  return {
    ...next,
    phase: determinePhase(next),
  }
}

function makeClip(state: GameState): GameState {
  if (!state.earth.humanFlag) {
    return state
  }

  return applyManualClipProduction(state, 1)
}

function buyWire(state: GameState, amount: number): GameState {
  return syncEarlyEconomyState(applyWirePurchaseToEconomy(state, amount))
}

function buyAutoClipper(state: GameState): GameState {
  if (!state.earth.humanFlag) {
    return state
  }

  const synced = syncEarlyEconomyState(state)

  if (synced.production.funds < synced.production.autoClipperCost) {
    return state
  }

  const nextLevel = synced.production.autoClippers + 1

  return syncEarlyEconomyState({
    ...synced,
    production: {
      ...synced.production,
      funds: synced.production.funds - synced.production.autoClipperCost,
      autoClippers: nextLevel,
      autoClipperCost: computeAutoClipperCost(nextLevel),
    },
    lastAction: 'Purchased an auto-clipper',
  })
}

function buyMegaClipper(state: GameState): GameState {
  if (!state.earth.humanFlag) {
    return state
  }

  const synced = syncEarlyEconomyState(state)

  if (!synced.projects.project22 || synced.production.funds < synced.production.megaClipperCost) {
    return state
  }

  const nextLevel = synced.production.megaClippers + 1

  return syncEarlyEconomyState({
    ...synced,
    production: {
      ...synced.production,
      funds: synced.production.funds - synced.production.megaClipperCost,
      megaClippers: nextLevel,
      megaClipperCost: computeMegaClipperCost(nextLevel),
    },
    lastAction: 'Purchased a mega-clipper',
  })
}

function buyMarketing(state: GameState): GameState {
  if (!state.earth.humanFlag) {
    return state
  }

  const synced = syncEarlyEconomyState(state)

  if (synced.production.funds < synced.economy.adCost) {
    return state
  }

  return syncEarlyEconomyState({
    ...synced,
    production: {
      ...synced.production,
      funds: synced.production.funds - synced.economy.adCost,
      marketingLevel: synced.production.marketingLevel + 1,
    },
    economy: {
      ...synced.economy,
      adCost: synced.economy.adCost * 2,
    },
    lastAction: 'Bought marketing',
  })
}

function setPrice(state: GameState, price: number): GameState {
  if (!state.earth.humanFlag) {
    return state
  }

  const clipped = normalizeClipPrice(price)
  return syncEarlyEconomyState({
    ...state,
    economy: {
      ...state.economy,
      clipPrice: clipped,
    },
    lastAction: `Set clip price to ${formatCurrency(clipped)}`,
  })
}

function completeProject(state: GameState, projectId: ProjectId): GameState {
  const next = activateProject(state, projectId)

  if (next === state) {
    return state
  }

  return {
    ...next,
    phase: determinePhase(next),
  }
}

export function getStallState(state: GameState): { stalled: boolean; reason: string | null } {
  const synced = syncEarlyEconomyState(state)
  const canBuyWire = synced.earth.humanFlag && synced.production.funds >= getWireBatchCost(synced, 1)
  const canBuyAutoClipper = synced.earth.humanFlag && synced.production.funds >= synced.production.autoClipperCost
  const canBuyMarketing = synced.earth.humanFlag && synced.production.funds >= synced.economy.adCost
  const canBuyMegaClipper = synced.earth.humanFlag && synced.projects.project22 && synced.production.funds >= synced.production.megaClipperCost
  const canInvest = synced.earth.humanFlag && synced.investment.unlocked && synced.production.funds > 0
  const canWithdrawInvestment = synced.earth.humanFlag && synced.investment.unlocked && synced.investment.bankroll > 0
  const canUpgradeInvestment = synced.earth.humanFlag && synced.investment.unlocked && synced.strategy.yomi >= synced.investment.investUpgradeCost
  const canRunManualTournament = canRunTournament(synced)
  const canManualProduce = synced.earth.humanFlag && synced.production.wire >= WIRE_PER_CLIP
  const canBuyFactory = !synced.earth.humanFlag && synced.earth.factoryFlag && synced.production.unusedClips >= synced.earth.factoryCost
  const canBuyHarvester = !synced.earth.humanFlag && synced.earth.harvesterFlag && synced.production.unusedClips >= synced.earth.harvesterCost
  const canBuyWireDrone = !synced.earth.humanFlag && synced.earth.wireDroneFlag && synced.production.unusedClips >= synced.earth.wireDroneCost
  const canBuyFarm = !synced.earth.humanFlag && synced.earth.powerGridFlag && synced.production.unusedClips >= synced.earth.farmCost
  const canBuyBattery = !synced.earth.humanFlag && synced.earth.powerGridFlag && synced.production.unusedClips >= synced.earth.batteryCost
  const canLaunchProbe = synced.earth.spaceFlag && synced.production.unusedClips > synced.space.probeCost
  const canBuyProbeTrust = synced.earth.spaceFlag && synced.strategy.yomi >= synced.space.probeTrustCost && synced.space.probeTrust < synced.space.maxTrust
  const canAllocateProbeTrust = synced.earth.spaceFlag && synced.space.probeUsedTrust < synced.space.probeTrust
  const canProgressProject = getVisibleProjects(synced).some((project) => project.canActivate)

  const stalled = synced.production.unsoldClips < 1
    && !canManualProduce
    && !canBuyWire
    && !canBuyAutoClipper
    && !canBuyMarketing
    && !canBuyMegaClipper
    && !canInvest
    && !canWithdrawInvestment
    && !canUpgradeInvestment
    && !canRunManualTournament
    && !canBuyFactory
    && !canBuyHarvester
    && !canBuyWireDrone
    && !canBuyFarm
    && !canBuyBattery
    && !canLaunchProbe
    && !canBuyProbeTrust
    && !canAllocateProbeTrust
    && !canProgressProject

  return {
    stalled,
    reason: stalled ? 'No wire, no cash, and no available action can advance the game.' : null,
  }
}

function determinePhase(state: GameState): GamePhase {
  if (!state.earth.humanFlag) {
    return 'expansion'
  }

  if (state.compute.unlocked) {
    return 'compute'
  }

  if (state.production.autoClippers > 0 || state.production.marketingLevel > 1 || state.wirePurchased > 0 || countCompletedProjects(state) > 0) {
    return 'industry'
  }

  return 'boot'
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value)
}

export function getMaxOps(state: GameState): number {
  return getMaxOperations(state.compute.memory)
}

export function getProjectProgress(state: GameState): string {
  return `${countCompletedProjects(state)}/${countTotalProjects()}`
}

export function getActiveProjects(state: GameState): VisibleProject[] {
  return getVisibleProjects(state)
}

export function canFundProject(state: GameState, projectId: ProjectId): boolean {
  return canActivateProject(state, projectId)
}

export function getSelectedStrategyLabel(state: GameState): string {
  return formatStrategyLabel(state.strategy.selectedStrategy)
}

export function createInitialProjectFlags(): Record<ProjectId, boolean> {
  return {
    project1: false,
    project2: false,
    project3: false,
    project16: false,
    project18: false,
    project20: false,
    project21: false,
    project27: false,
    project28: false,
    project29: false,
    project30: false,
    project31: false,
    project37: false,
    project38: false,
    project4: false,
    project5: false,
    project6: false,
    project60: false,
    project61: false,
    project62: false,
    project63: false,
    project64: false,
    project65: false,
    project66: false,
    project7: false,
    project8: false,
    project9: false,
    project10: false,
    project10b: false,
    project11: false,
    project12: false,
    project13: false,
    project14: false,
    project15: false,
    project17: false,
    project19: false,
    project35: false,
    project40: false,
    project41: false,
    project43: false,
    project44: false,
    project45: false,
    project46: false,
    project22: false,
    project23: false,
    project24: false,
    project25: false,
    project26: false,
    project70: false,
    project100: false,
    project101: false,
    project110: false,
    project111: false,
    project125: false,
    project118: false,
    project119: false,
    project120: false,
    project121: false,
    project126: false,
    project130: false,
    project129: false,
    project132: false,
    project133: false,
    project134: false,
    project131: false,
    project127: false,
    project219: false,
    project34: false,
  }
}

export type { ProjectCost, ProjectId, VisibleProject, SwarmStatus }
