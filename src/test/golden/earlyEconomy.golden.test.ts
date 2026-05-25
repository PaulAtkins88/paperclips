import { describe, expect, it } from 'vitest'
import { addMemory, addProcessor, runComputeTick, unlockCreativity } from '../../domain/compute/compute'
import { calculateCreativity } from '../../domain/compute/creativity'
import { OP_FADE_ACCELERATION } from '../../domain/compute/operations'
import { canAllocateTrust, shouldUnlockCompute } from '../../domain/compute/trust'
import { computeAutoClipperCost, computeMegaClipperCost } from '../../domain/economy/clippers'
import { applyManualClipProduction, applyWirePurchaseToEconomy, runEarlyEconomyTick, syncEarlyEconomyState } from '../../domain/economy/earlyEconomy'
import { cycleInvestmentRiskMode, investDeposit, investUpgrade, investWithdraw, runInvestmentTick } from '../../domain/investments/investments'
import { buyBattery, buyFactory, buyFarm, buyHarvester, buyWireDrone, EARTH_TICK_MS, getEarthPowerStatus, rebootBatteries, rebootFactories, rebootFarms, rebootHarvesters, rebootWireDrones, runEarthTick } from '../../domain/earth/earth'
import { computeDemand, normalizeClipPrice } from '../../domain/economy/pricing'
import { computeSaleQuantity, shouldSell, truncateCurrency } from '../../domain/economy/sales'
import { createInitialGameState, INITIAL_BATTERY_COST, INITIAL_FACTORY_COST, INITIAL_FARM_COST, INITIAL_HARVESTER_COST, INITIAL_WIRE_DRONE_COST } from '../../domain/game'
import { activateProject, canActivateProject, getVisibleProjects } from '../../domain/projects/projectRegistry'
import {
  assignProbeTrust,
  getSpaceStatus,
  increaseMaxTrust,
  increaseProbeTrust,
  launchProbe,
  runSpaceColonizationTick,
  runSpaceExplorationTick,
  runSpaceTick,
} from '../../domain/space/space'
import { cycleStrategySelection, runTournament } from '../../domain/strategy/tournaments'
import { createSeededRng } from '../fixtures/seeded-rng'
import { calculateSwarmComputingGifts, entertainSwarm, synchronizeSwarm } from '../../domain/compute/swarm'

describe('early economy parity', () => {
  it('matches original demand formula', () => {
    const demand = computeDemand({
      clipPrice: 0.25,
      marketingLevel: 1,
      marketingEffectiveness: 1,
      demandBoost: 1,
    })

    expect(demand).toBeCloseTo(3.2, 10)
  })

  it('normalizes price to cent increments with 0.01 floor', () => {
    expect(normalizeClipPrice(0.254)).toBe(0.25)
    expect(normalizeClipPrice(0.255)).toBe(0.26)
    expect(normalizeClipPrice(0)).toBe(0.01)
  })

  it('uses original auto clipper and mega clipper cost curves', () => {
    expect(computeAutoClipperCost(0)).toBeCloseTo(6, 10)
    expect(computeAutoClipperCost(10)).toBeCloseTo((1.1 ** 10) + 5, 10)
    expect(computeMegaClipperCost(0)).toBeCloseTo(1000, 10)
    expect(computeMegaClipperCost(5)).toBeCloseTo((1.07 ** 5) * 1000, 10)
  })

  it('produces clips manually into clips, unsold clips, and unused clips', () => {
    const state = createInitialGameState()
    const next = applyManualClipProduction(state, 1)

    expect(next.production.clips).toBe(1)
    expect(next.production.unsoldClips).toBe(1)
    expect(next.production.unusedClips).toBe(1)
    expect(next.production.wire).toBe(999)
  })

  it('uses original sale quantity curve and purchase threshold', () => {
    expect(computeSaleQuantity(3.2)).toBe(Math.floor(0.7 * (3.2 ** 1.15)))
    expect(shouldSell(3.2, 0.01)).toBe(true)
    expect(shouldSell(3.2, 0.04)).toBe(false)
  })

  it('truncates revenue to thousandths like the original', () => {
    expect(truncateCurrency(1.2349)).toBe(1.234)
    expect(truncateCurrency(0.9999)).toBe(0.999)
  })

  it('sells only from unsold inventory during tick processing', () => {
    const state = syncEarlyEconomyState({
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        clips: 10,
        unsoldClips: 10,
        unusedClips: 10,
        wire: 1000,
      },
    })

    const next = runEarlyEconomyTick(state, 100, () => 0)

    expect(next.production.unsoldClips).toBeLessThan(10)
    expect(next.production.clips).toBe(10)
    expect(next.lastTickSales).toBeGreaterThan(0)
    expect(next.production.funds).toBeGreaterThan(0)
  })

  it('updates wire base price and resets timer when wire is purchased', () => {
    const state = syncEarlyEconomyState({
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        funds: 100,
      },
    })

    const next = applyWirePurchaseToEconomy(state, 1)

    expect(next.production.wire).toBe(2000)
    expect(next.wirePurchased).toBe(1)
    expect(next.economy.wireBasePrice).toBeCloseTo(state.economy.wireBasePrice + 0.05, 10)
    expect(next.economy.wirePriceTimer).toBe(0)
  })

  it('unlocks compute at 2000 clips and increases trust on fibonacci thresholds', () => {
    const unlockedState = runComputeTick({
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        clips: 2_000,
      },
    }, 10)

    const trustState = runComputeTick({
      ...unlockedState,
      production: {
        ...unlockedState.production,
        clips: 3_000,
      },
    }, 10)

    expect(shouldUnlockCompute(unlockedState)).toBe(true)
    expect(unlockedState.compute.unlocked).toBe(true)
    expect(trustState.compute.trust).toBe(3)
    expect(trustState.compute.nextTrust).toBe(5_000)
    expect(trustState.compute.fib1).toBe(3)
    expect(trustState.compute.fib2).toBe(5)
  })

  it('matches original processor and memory allocation gating', () => {
    const unlocked = runComputeTick({
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        clips: 3_000,
      },
    }, 10)

    const base = runComputeTick(unlocked, 10)

    expect(canAllocateTrust(base)).toBe(true)

    const withProcessor = addProcessor(base)
    expect(withProcessor.compute.processors).toBe(2)
    expect(withProcessor.compute.creativitySpeed).toBeCloseTo(Math.log10(2) * Math.pow(2, 1.1) + 1, 10)

    const full = addMemory(withProcessor)
    expect(full.compute.memory).toBe(1)
    expect(canAllocateTrust(withProcessor)).toBe(false)
  })

  it('generates operations at processors divided by ten per 10ms tick', () => {
    const initial = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        clips: 2_000,
      },
    }

    const unlocked = runComputeTick(initial, 10)
    const next = runComputeTick(unlocked, 10)

    expect(next.compute.operations).toBe(0)
    expect(next.compute.standardOps).toBeCloseTo(0.2, 10)
  })

  it('starts temp ops fade only after the original delay and acceleration constant', () => {
    const state = {
      ...createInitialGameState(),
      compute: {
        ...createInitialGameState().compute,
        unlocked: true,
        tempOps: 10,
        opFade: 0.01,
        opFadeTimer: 800,
      },
    }

    const next = runComputeTick(state, 10)

    expect(next.compute.opFade).toBeCloseTo(0.01 + OP_FADE_ACCELERATION, 10)
    expect(next.compute.opFadeTimer).toBe(801)
  })

  it('only accrues creativity while operations are full', () => {
    const base = {
      ...createInitialGameState(),
      compute: {
        ...createInitialGameState().compute,
        unlocked: true,
        creativityOn: true,
        processors: 2,
        creativitySpeed: Math.log10(2) * Math.pow(2, 1.1) + 1,
        memory: 1,
        operations: 1_000,
        standardOps: 1_000,
      },
    }

    const next = calculateCreativity(base)

    expect(next.compute.creativityCounter).toBe(1)
    expect(next.compute.creativity).toBe(0)

    const notFull = calculateCreativity({
      ...base,
      compute: {
        ...base.compute,
        operations: 999,
        standardOps: 999,
      },
    })

    expect(notFull.compute.creativityCounter).toBe(0)
    expect(notFull.compute.creativity).toBe(0)
  })

  it('spends 1000 ops to unlock creativity', () => {
    const state = {
      ...createInitialGameState(),
      compute: {
        ...createInitialGameState().compute,
        unlocked: true,
        operations: 1_000,
        standardOps: 1_000,
      },
    }

    const next = unlockCreativity(state)

    expect(next.compute.creativityOn).toBe(true)
    expect(next.compute.operations).toBe(0)
    expect(next.compute.standardOps).toBe(0)
  })

  it('shows and activates improved autoclippers when the original trigger is met', () => {
    const state = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        autoClippers: 1,
      },
      compute: {
        ...createInitialGameState().compute,
        unlocked: true,
        operations: 750,
        standardOps: 750,
      },
    }

    const visible = getVisibleProjects(state)
    expect(visible.some((project) => project.id === 'project1')).toBe(true)
    expect(canActivateProject(state, 'project1')).toBe(true)

    const next = activateProject(state, 'project1')

    expect(next.projects.project1).toBe(true)
    expect(next.economy.clipperBoost).toBeCloseTo(1.25, 10)
    expect(next.compute.standardOps).toBe(0)
  })

  it('unlocks creativity through the project registry and spends standard ops', () => {
    const state = {
      ...createInitialGameState(),
      compute: {
        ...createInitialGameState().compute,
        unlocked: true,
        operations: 1_000,
        standardOps: 1_000,
      },
    }

    expect(canActivateProject(state, 'project3')).toBe(true)

    const next = activateProject(state, 'project3')

    expect(next.projects.project3).toBe(true)
    expect(next.compute.creativityOn).toBe(true)
    expect(next.compute.standardOps).toBe(0)
  })

  it('treats beg for more wire as a repeatable project', () => {
    const state = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        wire: 0,
        unsoldClips: 0,
      },
      compute: {
        ...createInitialGameState().compute,
        trust: 2,
      },
    }

    const next = activateProject(state, 'project2')

    expect(next.projects.project2).toBe(true)
    expect(next.production.wire).toBe(next.economy.wireSupply)
    expect(next.compute.trust).toBe(1)
  })

  it('unlocks algorithmic trading at trust 8 and enables investment actions', () => {
    const state = {
      ...createInitialGameState(),
      compute: {
        ...createInitialGameState().compute,
        trust: 8,
        operations: 10_000,
        standardOps: 10_000,
      },
    }

    expect(canActivateProject(state, 'project21')).toBe(true)

    const unlocked = activateProject(state, 'project21')
    const deposited = investDeposit({
      ...unlocked,
      production: {
        ...unlocked.production,
        funds: 250,
      },
    })

    expect(unlocked.investment.unlocked).toBe(true)
    expect(deposited.production.funds).toBe(0)
    expect(deposited.investment.bankroll).toBe(250)
  })

  it('supports investment withdraw, risk cycling, and yomi-funded upgrades', () => {
    const state = {
      ...createInitialGameState(),
      investment: {
        ...createInitialGameState().investment,
        unlocked: true,
        bankroll: 500,
      },
      strategy: {
        ...createInitialGameState().strategy,
        yomi: 150,
      },
    }

    const withdrawn = investWithdraw(state)
    const riskShifted = cycleInvestmentRiskMode(withdrawn)
    const upgraded = investUpgrade(riskShifted)

    expect(withdrawn.production.funds).toBe(500)
    expect(withdrawn.investment.bankroll).toBe(0)
    expect(riskShifted.investment.riskMode).toBe('hi')
    expect(upgraded.investment.investLevel).toBe(1)
    expect(upgraded.strategy.yomi).toBe(50)
    expect(upgraded.investment.stockGainThreshold).toBeCloseTo(0.51, 10)
  })

  it('runs the investment stock shop with deterministic rng', () => {
    const rng = createSeededRng([0.1, 0.2, 0.3, 0.4, 0.5, 0.6])
    const state = {
      ...createInitialGameState(),
      investment: {
        ...createInitialGameState().investment,
        unlocked: true,
        bankroll: 500,
        portTotal: 500,
      },
    }

    const next = runInvestmentTick(state, 1_000, rng)

    expect(next.investment.stocks.length).toBeGreaterThan(0)
    expect(next.investment.bankroll).toBeLessThan(500)
  })

  it('unlocks strategic modeling and generates yomi from tournaments', () => {
    const rng = createSeededRng([0.1, 0.2, 0.3, 0.4, 0.49, 0.51, 0.25, 0.75, 0.5, 0.5, 0.5, 0.5])
    const state = {
      ...createInitialGameState(),
      projects: {
        ...createInitialGameState().projects,
        project19: true,
      },
      compute: {
        ...createInitialGameState().compute,
        operations: 13_000,
        standardOps: 13_000,
      },
    }

    const strategyUnlocked = activateProject(state, 'project20')
    const selected = cycleStrategySelection(strategyUnlocked)
    const next = runTournament(selected, rng)

    expect(strategyUnlocked.strategy.unlocked).toBe(true)
    expect(strategyUnlocked.compute.standardOps).toBe(1_000)
    expect(next.strategy.yomi).toBeGreaterThan(0)
    expect(next.compute.standardOps).toBe(0)
    expect(next.strategy.lastResults.length).toBe(1)
  })

  it('unlocks additional strategies through the project registry', () => {
    const state = {
      ...createInitialGameState(),
      projects: {
        ...createInitialGameState().projects,
        project20: true,
      },
      strategy: {
        ...createInitialGameState().strategy,
        unlocked: true,
      },
      compute: {
        ...createInitialGameState().compute,
        operations: 15_000,
        standardOps: 15_000,
      },
    }

    const next = activateProject(state, 'project60')

    expect(next.projects.project60).toBe(true)
    expect(next.strategy.strategies).toContain('A100')
    expect(next.strategy.tourneyCost).toBe(2_000)
  })

  it('releases the hypnodrones and ends the human economy', () => {
    const state = {
      ...createInitialGameState(),
      projects: {
        ...createInitialGameState().projects,
        project70: true,
      },
      production: {
        ...createInitialGameState().production,
        wire: 500,
        autoClippers: 12,
        megaClippers: 3,
      },
      compute: {
        ...createInitialGameState().compute,
        trust: 100,
      },
      investment: {
        ...createInitialGameState().investment,
        unlocked: true,
      },
    }

    const next = activateProject(state, 'project35')

    expect(next.projects.project35).toBe(true)
    expect(next.earth.humanFlag).toBe(false)
    expect(next.earth.phase).toBe('postHuman')
    expect(next.compute.trust).toBe(0)
    expect(next.production.autoClippers).toBe(0)
    expect(next.production.megaClippers).toBe(0)
    expect(next.earth.nanoWire).toBe(500)
    expect(next.investment.unlocked).toBe(false)
  })

  it('unlocks the early Earth automation chain after the hypnodrone transition', () => {
    const state = {
      ...createInitialGameState(),
      projects: {
        ...createInitialGameState().projects,
        project17: true,
        project35: true,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
      },
      compute: {
        ...createInitialGameState().compute,
        operations: 205_000,
        standardOps: 205_000,
      },
    }

    const toth = activateProject(state, 'project18')
    const grid = activateProject(toth, 'project127')
    const wire = activateProject(grid, 'project41')
    const harvester = activateProject(wire, 'project43')
    const drone = activateProject(harvester, 'project44')
    const factory = activateProject(drone, 'project45')

    expect(toth.earth.tothFlag).toBe(true)
    expect(grid.earth.powerGridFlag).toBe(true)
    expect(wire.earth.wireProductionFlag).toBe(true)
    expect(harvester.earth.harvesterFlag).toBe(true)
    expect(drone.earth.wireDroneFlag).toBe(true)
    expect(factory.earth.factoryFlag).toBe(true)
  })

  it('buys harvesters, wire drones, and factories with original Earth costs', () => {
    const base = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        unusedClips: 200_000_000,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        harvesterFlag: true,
        wireDroneFlag: true,
        factoryFlag: true,
      },
    }

    const withHarvester = buyHarvester(base)
    const withWireDrone = buyWireDrone(withHarvester)
    const withFactory = buyFactory(withWireDrone)

    expect(withHarvester.earth.harvesterLevel).toBe(1)
    expect(withHarvester.earth.harvesterCost).toBeCloseTo(Math.pow(2, 2.25) * 1_000_000, 10)
    expect(withHarvester.earth.harvesterBill).toBe(INITIAL_HARVESTER_COST)
    expect(withWireDrone.earth.wireDroneLevel).toBe(1)
    expect(withWireDrone.earth.wireDroneCost).toBeCloseTo(Math.pow(2, 2.25) * 1_000_000, 10)
    expect(withWireDrone.earth.wireDroneBill).toBe(INITIAL_WIRE_DRONE_COST)
    expect(withFactory.earth.factoryLevel).toBe(1)
    expect(withFactory.earth.factoryCost).toBe(1_000_000_000)
    expect(withFactory.earth.factoryBill).toBe(INITIAL_FACTORY_COST)
  })

  it('reboots harvesters, wire drones, and factories, zeroing levels and refunding clips', () => {
    const base = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        unusedClips: 200_000_000,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        harvesterFlag: true,
        wireDroneFlag: true,
        factoryFlag: true,
      },
    }

    const withHarvesters = buyHarvester(buyHarvester(buyHarvester(base)))
    const withDrones = buyWireDrone(buyWireDrone(withHarvesters))
    const withFactories = buyFactory(buyFactory(withDrones))

    const harvesterRefund = withHarvesters.earth.harvesterBill
    const droneRefund = withDrones.earth.wireDroneBill
    const factoryRefund = withFactories.earth.factoryBill

    const rebootedHarvesters = rebootHarvesters(withHarvesters)
    const rebootedDrones = rebootWireDrones(withDrones)
    const rebootedFactory = rebootFactories(withFactories)

    expect(rebootedHarvesters.earth.harvesterLevel).toBe(0)
    expect(rebootedHarvesters.earth.harvesterCost).toBe(INITIAL_HARVESTER_COST)
    expect(rebootedHarvesters.earth.harvesterBill).toBe(0)
    expect(rebootedHarvesters.production.unusedClips).toBe(withHarvesters.production.unusedClips + harvesterRefund)

    expect(rebootedDrones.earth.wireDroneLevel).toBe(0)
    expect(rebootedDrones.earth.wireDroneCost).toBe(INITIAL_WIRE_DRONE_COST)
    expect(rebootedDrones.earth.wireDroneBill).toBe(0)
    expect(rebootedDrones.production.unusedClips).toBe(withDrones.production.unusedClips + droneRefund)

    expect(rebootedFactory.earth.factoryLevel).toBe(0)
    expect(rebootedFactory.earth.factoryCost).toBe(INITIAL_FACTORY_COST)
    expect(rebootedFactory.earth.factoryBill).toBe(0)
    expect(rebootedFactory.production.unusedClips).toBe(withFactories.production.unusedClips + factoryRefund)
  })

  it('buys solar farms and battery towers with original Earth power costs', () => {
    const base = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        unusedClips: 200_000_000,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        powerGridFlag: true,
      },
    }

    const withFarm = buyFarm(base)
    const withBattery = buyBattery(withFarm)

    expect(withFarm.earth.farmLevel).toBe(1)
    expect(withFarm.earth.farmCost).toBeCloseTo(Math.pow(2, 2.78) * 10_000_000, 10)
    expect(withFarm.earth.farmBill).toBe(INITIAL_FARM_COST)
    expect(withBattery.earth.batteryLevel).toBe(1)
    expect(withBattery.earth.batteryCost).toBeCloseTo(Math.pow(2, 2.54) * 1_000_000, 10)
    expect(withBattery.earth.batteryBill).toBe(INITIAL_BATTERY_COST)
  })

  it('reboots farms and battery towers, zeroing levels and refunding clips', () => {
    const base = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        unusedClips: 10_000_000_000,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        powerGridFlag: true,
      },
    }

    const withFarm = buyFarm(buyFarm(base))
    const withBattery = buyBattery(buyBattery(withFarm))

    const farmRefund = withFarm.earth.farmBill
    const batteryRefund = withBattery.earth.batteryBill

    const rebootedFarm = rebootFarms(withFarm)
    const rebootedBattery = rebootBatteries(withBattery)

    expect(rebootedFarm.earth.farmLevel).toBe(0)
    expect(rebootedFarm.earth.farmCost).toBe(INITIAL_FARM_COST)
    expect(rebootedFarm.earth.farmBill).toBe(0)
    expect(rebootedFarm.production.unusedClips).toBe(withFarm.production.unusedClips + farmRefund)

    expect(rebootedBattery.earth.batteryLevel).toBe(0)
    expect(rebootedBattery.earth.batteryCost).toBe(INITIAL_BATTERY_COST)
    expect(rebootedBattery.earth.batteryBill).toBe(0)
    expect(rebootedBattery.earth.storedPower).toBe(0)
    expect(rebootedBattery.production.unusedClips).toBe(withBattery.production.unusedClips + batteryRefund)
  })

  it('runs Earth production from matter to wire to clips after post-human unlocks', () => {
    const state = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        wire: 0,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        wireProductionFlag: true,
        harvesterFlag: true,
        wireDroneFlag: true,
        factoryFlag: true,
        powMod: 1,
        availableMatter: 10_000_000_000,
        harvesterLevel: 1,
        wireDroneLevel: 1,
        factoryLevel: 1,
        harvesterRate: 10,
        wireDroneRate: 10,
        factoryRate: 5,
      },
    }

    const next = runEarthTick(state, 100)

    expect(next.earth.availableMatter).toBe(9_999_999_990)
    expect(next.earth.acquiredMatter).toBe(0)
    expect(next.earth.processedMatter).toBe(10)
    expect(next.earth.nanoWire).toBe(10)
    expect(next.production.wire).toBe(5)
    expect(next.production.clips).toBe(5)
    expect(next.production.unsoldClips).toBe(5)
    expect(next.production.unusedClips).toBe(5)
  })

  it('charges batteries from excess solar output and sustains full power through stored energy', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        powerGridFlag: true,
        batteryLevel: 1,
        farmLevel: 5,
        momentum: 0,
      },
    }

    const charged = runEarthTick(state, 100)
    const statusAfterCharge = getEarthPowerStatus(charged)

    expect(statusAfterCharge.powerProductionRate).toBe(250)
    expect(statusAfterCharge.powerConsumptionRate).toBe(0)
    expect(statusAfterCharge.storedPower).toBe(250)
    expect(statusAfterCharge.maxStoredPower).toBe(10_000)
    expect(statusAfterCharge.performancePercent).toBe(0)

    const loaded = {
      ...charged,
      earth: {
        ...charged.earth,
        harvesterFlag: true,
        wireDroneFlag: true,
        factoryFlag: true,
        harvesterLevel: 50,
        wireDroneLevel: 50,
        factoryLevel: 1,
      },
    }

    const supported = runEarthTick(loaded, 100)
    const statusAfterDischarge = getEarthPowerStatus(supported)

    expect(statusAfterDischarge.powerConsumptionRate).toBe(300)
    expect(statusAfterDischarge.storedPower).toBe(200)
    expect(statusAfterDischarge.performancePercent).toBe(100)
    expect(supported.earth.powMod).toBe(1)
  })

  it('generates swarm gifts at the original log rate and fires on threshold crossing', () => {
    const droneCount = 1_000_000
    const swarmComputingBalance = 50

    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        powMod: 1,
        harvesterLevel: droneCount / 2,
        wireDroneLevel: droneCount / 2,
      },
      compute: {
        ...createInitialGameState().compute,
        swarmFlag: true,
        swarmComputingBalance,
        giftBits: 0,
        swarmGifts: 0,
      },
    }

    const next = calculateSwarmComputingGifts(state)
    const expectedRate = Math.log(droneCount) * (swarmComputingBalance / 50)

    expect(next.compute.giftBits).toBeCloseTo(expectedRate, 10)
    expect(next.compute.swarmGifts).toBe(0)

    const nearThreshold = {
      ...state,
      compute: { ...state.compute, giftBits: state.compute.giftPeriod - 0.001 },
    }
    const fired = calculateSwarmComputingGifts(nearThreshold)
    expect(fired.compute.giftBits).toBe(0)
    expect(fired.compute.swarmGifts).toEqual(Math.round(Math.log10(droneCount) * (swarmComputingBalance / 50)))
  })

  it('reduces drone harvesting and wire processing rate when swarm slider is pushed toward Think', () => {
    const stateAtWork = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        harvesterFlag: true,
        wireProductionFlag: true,
        wireDroneFlag: true,
        powMod: 1,
        harvesterLevel: 100,
        wireDroneLevel: 100,
        harvesterRate: 1,
        wireDroneRate: 1,
        availableMatter: 1_000_000,
        acquiredMatter: 1_000_000,
      },
      compute: {
        ...createInitialGameState().compute,
        swarmFlag: true,
        swarmComputingBalance: 0,
      },
    }

    const stateAtThink = {
      ...stateAtWork,
      compute: {
        ...stateAtWork.compute,
        swarmComputingBalance: 100,
      },
    }

    const afterWork = runEarthTick(stateAtWork, EARTH_TICK_MS)
    const afterThink = runEarthTick(stateAtThink, EARTH_TICK_MS)

    const matterAcquiredAtWork = stateAtWork.earth.availableMatter - afterWork.earth.availableMatter
    const matterAcquiredAtThink = stateAtThink.earth.availableMatter - afterThink.earth.availableMatter

    expect(matterAcquiredAtThink).toBeLessThan(matterAcquiredAtWork)

    const wireProducedAtWork = afterWork.production.wire - stateAtWork.production.wire
    const wireProducedAtThink = afterThink.production.wire - stateAtThink.production.wire

    expect(wireProducedAtThink).toBeLessThan(wireProducedAtWork)
  })

  it('triggers boredom after 5 minutes of idle drones and clears with creativity cost', () => {
    const FIVE_MINUTES_OF_TICKS = (5 * 60 * 1000) / 10

    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        powMod: 1,
        harvesterLevel: 100,
        wireDroneLevel: 100,
        availableMatter: 0,
      },
      compute: {
        ...createInitialGameState().compute,
        creativity: 100_000,
        entertainCost: 10_000,
        swarmFlag: true,
        swarmComputingBalance: 50,
        boredomLevel: FIVE_MINUTES_OF_TICKS - 2,
      },
    }

    const notYet = calculateSwarmComputingGifts(state)
    expect(notYet.compute.boredomFlag).toBe(false)
    expect(notYet.compute.boredomLevel).toBe(FIVE_MINUTES_OF_TICKS - 1)

    const fired = calculateSwarmComputingGifts(notYet)
    expect(fired.compute.boredomFlag).toBe(true)
    expect(fired.compute.boredomLevel).toBe(0)

    const entertained = entertainSwarm(fired)
    expect(entertained.compute.boredomFlag).toBe(false)
    expect(entertained.compute.creativity).toBe(90_000)
    expect(entertained.compute.entertainCost).toBe(20_000)
  })

  it('triggers disorganization at the original harvester to wire drone ratio and clears with yomi', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        powMod: 1,
        harvesterLevel: 10_000,
        wireDroneLevel: 100,
      },
      compute: {
        ...createInitialGameState().compute,
        swarmFlag: true,
        swarmComputingBalance: 50,
        disorgCounter: 99.99,
      },
      strategy: {
        ...createInitialGameState().strategy,
        yomi: 10_000,
      },
    }

    const notYet = calculateSwarmComputingGifts(state)
    expect(notYet.compute.disorgFlag).toBe(false)

    const fired = calculateSwarmComputingGifts(notYet)
    expect(fired.compute.disorgFlag).toBe(true)

    const synced = synchronizeSwarm(fired)
    expect(synced.compute.disorgFlag).toBe(false)
    expect(synced.compute.disorgCounter).toBe(0)
    expect(synced.strategy.yomi).toBe(5_000)
  })

  it('reduces Earth performance when power supply and storage cannot meet demand', () => {
    const state = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        wire: 0,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        powerGridFlag: true,
        wireProductionFlag: true,
        harvesterFlag: true,
        wireDroneFlag: true,
        factoryFlag: true,
        farmLevel: 1,
        availableMatter: 10_000_000_000,
        harvesterLevel: 100,
        wireDroneLevel: 100,
        factoryLevel: 1,
        storedPower: 0,
        momentum: 0,
      },
    }

    const next = runEarthTick(state, 100)
    const power = getEarthPowerStatus(next)

    expect(power.powerProductionRate).toBe(50)
    expect(power.powerConsumptionRate).toBe(400)
    expect(power.performancePercent).toBe(13)
    expect(next.earth.powMod).toBeCloseTo(0.125, 10)
    expect(next.earth.availableMatter).toBeCloseTo(9_672_745_787.5, 5)
    expect(next.earth.processedMatter).toBeCloseTo(202_254_237.5, 5)
    expect(next.earth.nanoWire).toBeCloseTo(202_254_237.5, 5)
    expect(next.production.wire).toBeCloseTo(77_254_237.5, 5)
    expect(next.production.clips).toBeCloseTo(125_000_000, 5)
    expect(next.production.unsoldClips).toBeCloseTo(125_000_000, 5)
    expect(next.production.unusedClips).toBeCloseTo(125_000_000, 5)
  })

  it('unlocks Space Exploration when Earth matter is exhausted and reboots terrestrial industry', () => {
    const state = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        unusedClips: 6 * Math.pow(10, 27),
      },
      projects: {
        ...createInitialGameState().projects,
        project35: true,
        project41: true,
        project43: true,
        project44: true,
        project45: true,
      },
      compute: {
        ...createInitialGameState().compute,
        operations: 200_000,
        standardOps: 200_000,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        availableMatter: 0,
        storedPower: 12_000_000,
        farmLevel: 4,
        batteryLevel: 2,
        harvesterLevel: 3,
        wireDroneLevel: 5,
        factoryLevel: 2,
        powerGridFlag: true,
        wireProductionFlag: true,
        harvesterFlag: true,
        wireDroneFlag: true,
        factoryFlag: true,
      },
    }

    const next = activateProject(state, 'project46')

    expect(next.projects.project46).toBe(true)
    expect(next.earth.spaceFlag).toBe(true)
    expect(next.earth.farmLevel).toBe(1)
    expect(next.earth.batteryLevel).toBe(0)
    expect(next.earth.harvesterLevel).toBe(0)
    expect(next.earth.wireDroneLevel).toBe(0)
    expect(next.earth.factoryLevel).toBe(0)
    expect(next.earth.storedPower).toBe(0)
    expect(next.earth.powMod).toBe(1)
    expect(next.compute.operations).toBe(80_000)
    expect(next.lastAction).toBe('Von Neumann Probes online')
    expect(next.production.unusedClips).toBeGreaterThan(0)
  })

  it('halts terrestrial Earth automation after the space transition begins', () => {
    const state = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        wire: 0,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        spaceFlag: true,
        powerGridFlag: true,
        batteryLevel: 1,
        wireProductionFlag: true,
        harvesterFlag: true,
        wireDroneFlag: true,
        factoryFlag: true,
        powMod: 1,
        availableMatter: 10_000_000_000,
        storedPower: 1_000,
        harvesterLevel: 1,
        wireDroneLevel: 1,
        factoryLevel: 1,
        harvesterRate: 10,
        wireDroneRate: 10,
        factoryRate: 5,
      },
    }

    const next = runEarthTick(state, 100)

    expect(next.earth.availableMatter).toBe(9_999_999_990)
    expect(next.earth.processedMatter).toBe(10)
    expect(next.production.clips).toBe(5)
  })

  it('launches probes only above the fixed clip cost threshold', () => {
    const probeCost = Math.pow(10, 17)
    const fundedRemainder = 128

    const locked = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        spaceFlag: true,
      },
      production: {
        ...createInitialGameState().production,
        unusedClips: probeCost,
      },
    }

    const exactCost = launchProbe(locked)
    const funded = launchProbe({
      ...locked,
      production: {
        ...locked.production,
        unusedClips: probeCost + fundedRemainder,
      },
    })

    expect(exactCost).toBe(locked)
    expect(funded.space.probeCount).toBe(1)
    expect(funded.space.probeLaunchLevel).toBe(1)
    expect(funded.production.unusedClips).toBe(fundedRemainder)
  })

  it('buys probe trust with original yomi cost progression', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        spaceFlag: true,
      },
      strategy: {
        ...createInitialGameState().strategy,
        yomi: 5_000,
      },
    }

    const next = increaseProbeTrust(state)

    expect(next.space.probeTrust).toBe(1)
    expect(next.space.probeTrustCost).toBe(Math.floor(Math.pow(2, 1.47) * 500))
    expect(next.strategy.yomi).toBe(4_500)
  })

  it('requires both Speed and Exploration trust before probes discover matter', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        spaceFlag: true,
        availableMatter: 0,
      },
      strategy: {
        ...createInitialGameState().strategy,
        yomi: 10_000,
      },
      space: {
        ...createInitialGameState().space,
        probeCount: 1,
        probeLaunchLevel: 1,
      },
    }

    const noStats = runSpaceExplorationTick(state, 100)
    const withTrust = increaseProbeTrust(increaseProbeTrust(state))
    const speedOnly = runSpaceExplorationTick(assignProbeTrust(withTrust, 'speed'), 100)
    const fullyAllocated = assignProbeTrust(assignProbeTrust(withTrust, 'speed'), 'nav')
    const allocatedStatus = getSpaceStatus(fullyAllocated)
    const exploring = runSpaceExplorationTick(fullyAllocated, 100)

    expect(noStats.earth.availableMatter).toBe(0)
    expect(speedOnly.earth.availableMatter).toBe(0)
    expect(exploring.earth.availableMatter).toBe(1.75 * Math.pow(10, 18))
    expect(exploring.space.foundMatter).toBe(createInitialGameState().space.foundMatter + (1.75 * Math.pow(10, 18)))
    expect(allocatedStatus.explorationRate).toBe(1.75 * Math.pow(10, 18))
    expect(allocatedStatus.availableProbeTrust).toBe(0)
    expect(getSpaceStatus(exploring).explorationRate).toBe(1.75 * Math.pow(10, 18))
  })

  it('spawns probe-built factories, harvesters, and wire drones before self-replication each space tick', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      production: {
        ...createInitialGameState().production,
        unusedClips: (5 * Math.pow(10, 18)) + 200_000_000,
      },
      space: {
        ...createInitialGameState().space,
        probeCount: 1_000_000,
        probeHaz: 1_000,
        probeRep: 1,
        probeFac: 1,
        probeHarv: 1,
        probeWire: 1,
      },
    }

    const next = runSpaceColonizationTick(state, 100)

    expect(next.earth.factoryLevel).toBe(1)
    expect(next.earth.harvesterLevel).toBe(2)
    expect(next.earth.wireDroneLevel).toBe(2)
    expect(next.space.probeCount).toBe(1_000_050)
    expect(next.space.probeDescendents).toBe(50)
    expect(next.production.unusedClips).toBe(92_000_256)
  })

  it('accumulates fractional probe replication until a full descendent can be afforded and spawned', () => {
    const state = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        unusedClips: Math.pow(10, 18),
      },
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      space: {
        ...createInitialGameState().space,
        probeCount: 10_000,
        probeHaz: 1_000,
        probeRep: 1,
      },
    }

    const first = runSpaceColonizationTick(state, 100)
    const second = runSpaceColonizationTick(first, 100)

    expect(first.space.probeCount).toBe(10_000.5)
    expect(first.space.partialProbeSpawn).toBeCloseTo(0.5, 10)
    expect(second.space.probeCount).toBe(10_001.5)
    expect(second.space.probeDescendents).toBeCloseTo(1.5, 10)
    expect(second.space.partialProbeSpawn).toBe(0)
  })

  it('caps probe-built spawns by available clips', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      production: {
        ...createInitialGameState().production,
        unusedClips: 5_999_999,
      },
      space: {
        ...createInitialGameState().space,
        probeCount: 1_000_000_000,
        probeFac: 10,
        probeHarv: 10,
        probeWire: 10,
      },
    }

    const next = runSpaceColonizationTick(state, 100)

    expect(next.earth.factoryLevel).toBe(0)
    expect(next.earth.harvesterLevel).toBe(2)
    expect(next.earth.wireDroneLevel).toBe(0)
    expect(next.production.unusedClips).toBe(1_999_999)
  })

  it('explores before Earth automation so newly discovered matter can be harvested in the same tick', () => {
    const state = {
      ...createInitialGameState(),
      production: {
        ...createInitialGameState().production,
        wire: 0,
      },
      earth: {
        ...createInitialGameState().earth,
        phase: 'postHuman' as const,
        humanFlag: false,
        spaceFlag: true,
        powerGridFlag: true,
        wireProductionFlag: true,
        harvesterFlag: true,
        wireDroneFlag: true,
        factoryFlag: true,
        powMod: 1,
        availableMatter: 0,
        farmLevel: 100,
        harvesterLevel: 1,
        wireDroneLevel: 1,
        factoryLevel: 1,
        harvesterRate: 10,
        wireDroneRate: 10,
        factoryRate: 5,
      },
      space: {
        ...createInitialGameState().space,
        probeCount: 1,
        probeSpeed: 1,
        probeNav: 1,
      },
    }

    const next = runSpaceTick(state, 100)

    expect(next.space.foundMatter).toBe(createInitialGameState().space.foundMatter + (1.75 * Math.pow(10, 18)))
    expect(next.earth.availableMatter).toBe((1.75 * Math.pow(10, 18)) - 10)
    expect(next.earth.processedMatter).toBe(10)
    expect(next.production.clips).toBe(5)
    expect(next.production.wire).toBe(5)
  })

  it('accumulates sub-1 hazard losses until a full probe is destroyed', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      space: {
        ...createInitialGameState().space,
        probeCount: 50,
      },
    }

    const first = runSpaceColonizationTick(state, 100)
    const second = runSpaceColonizationTick(first, 100)

    expect(first.space.probeCount).toBe(50)
    expect(first.space.partialProbeHaz).toBeCloseTo(0.5, 10)
    expect(first.space.probesLostHaz).toBe(0)
    expect(second.space.probeCount).toBe(49)
    expect(second.space.partialProbeHaz).toBe(0)
    expect(second.space.probesLostHaz).toBe(1)
  })

  it('reduces hazard losses with probe hazard trust and Elliptic Hull Polytopes', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      space: {
        ...createInitialGameState().space,
        probeCount: 1_000,
        probeHaz: 2,
      },
    }

    const mitigated = runSpaceColonizationTick(state, 100)
    const upgraded = runSpaceColonizationTick({
      ...state,
      projects: {
        ...state.projects,
        project129: true,
      },
    }, 100)
    const status = getSpaceStatus(state)

    expect(status.hazardLossRate).toBeCloseTo(1000 * (0.01 / ((3 * Math.pow(2, 1.6)) + 1)), 10)
    expect(mitigated.space.probeCount).toBe(1_000)
    expect(mitigated.space.partialProbeHaz).toBeCloseTo(status.hazardLossRate, 10)
    expect(upgraded.space.probeCount).toBe(1_000)
    expect(upgraded.space.partialProbeHaz).toBeCloseTo(status.hazardLossRate * 0.5, 10)
  })

  it('applies drift after replication and tracks drifters with the original trust curve', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      production: {
        ...createInitialGameState().production,
        unusedClips: Math.pow(10, 19),
      },
      space: {
        ...createInitialGameState().space,
        probeCount: 1_000_000,
        probeHaz: 1_000,
        probeRep: 1,
        probeTrust: 4,
      },
    }

    const next = runSpaceColonizationTick(state, 100)
    const replicatedProbeCount = 1_000_000 + (1_000_000 * 0.00005)
    const expectedDrift = replicatedProbeCount * 0.000001 * Math.pow(4, 1.2)

    expect(next.space.probeCount).toBeCloseTo(replicatedProbeCount - expectedDrift, 10)
    expect(next.space.probeDescendents).toBe(50)
    expect(next.space.probesLostDrift).toBeCloseTo(expectedDrift, 10)
    expect(next.space.drifterCount).toBeCloseTo(expectedDrift, 10)
  })

  it('reveals Elliptic Hull Polytopes after enough probes are lost to hazards', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      compute: {
        ...createInitialGameState().compute,
        operations: 200_000,
        standardOps: 200_000,
      },
      space: {
        ...createInitialGameState().space,
        probesLostHaz: 100,
      },
    }

    const visible = getVisibleProjects(state)
    const hazardProject = visible.find((project) => project.id === 'project129')
    const next = activateProject(state, 'project129')

    expect(hazardProject?.canActivate).toBe(true)
    expect(next.projects.project129).toBe(true)
    expect(next.compute.operations).toBe(75_000)
  })

  it('spawns the first battle only after drift crosses the war trigger and the roll succeeds', () => {
    const originalRandom = Math.random
    Math.random = () => 0.99

    try {
      const state = {
        ...createInitialGameState(),
        earth: {
          ...createInitialGameState().earth,
          humanFlag: false,
          spaceFlag: true,
        },
        space: {
          ...createInitialGameState().space,
          probeCount: 2_000_000,
          drifterCount: 1_000_001,
          probeHaz: 1_000,
          activeBattle: null,
        },
      }

      const next = runSpaceColonizationTick(state, 100)

      expect(next.space.battleFlag).toBe(true)
      expect(next.space.activeBattle).not.toBeNull()
      expect(next.space.activeBattle?.unitSize).toBeCloseTo(1_000_001 / 100, 10)
      expect(next.space.activeBattle?.clipProbes).toBeGreaterThanOrEqual(1)
      expect(next.space.activeBattle?.drifterProbes).toBeGreaterThanOrEqual(1)
    } finally {
      Math.random = originalRandom
    }
  })

  it('applies one-sided early combat losses before Combat is unlocked', () => {
    const originalRandom = Math.random
    Math.random = () => 0.99

    try {
      const battleState = {
        ...createInitialGameState(),
        earth: {
          ...createInitialGameState().earth,
          humanFlag: false,
          spaceFlag: true,
        },
        space: {
          ...createInitialGameState().space,
          probeCount: 2_000_000,
          drifterCount: 1_500_000,
          probeHaz: 1_000,
          probeTrust: 0,
          probeCombat: 0,
        },
      }

      const next = runSpaceColonizationTick(battleState, 100)
      const expectedUnitSize = 1_500_000 / 100

      expect(next.space.probesLostCombat).toBeCloseTo(expectedUnitSize, 10)
      expect(next.space.probeCount).toBeCloseTo(2_000_000 - expectedUnitSize, 10)
      expect(next.space.drifterCount).toBe(1_500_000)
      expect(next.space.activeBattle).not.toBeNull()
    } finally {
      Math.random = originalRandom
    }
  })

  it('reveals Combat after the first combat casualty', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      compute: {
        ...createInitialGameState().compute,
        operations: 200_000,
        standardOps: 200_000,
      },
      space: {
        ...createInitialGameState().space,
        probesLostCombat: 1,
      },
    }

    const visible = getVisibleProjects(state)
    const combatProject = visible.find((project) => project.id === 'project131')
    const next = activateProject(state, 'project131')

    expect(combatProject?.canActivate).toBe(true)
    expect(next.projects.project131).toBe(true)
    expect(next.compute.operations).toBe(50_000)
  })

  it('only allows Combat trust allocation after project131 is complete', () => {
    const base = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      space: {
        ...createInitialGameState().space,
        probeTrust: 1,
      },
    }

    const locked = assignProbeTrust(base, 'combat')
    const unlocked = assignProbeTrust({
      ...base,
      projects: {
        ...base.projects,
        project131: true,
      },
    }, 'combat')

    expect(locked.space.probeCombat).toBe(0)
    expect(locked.space.probeUsedTrust).toBe(0)
    expect(unlocked.space.probeCombat).toBe(1)
    expect(unlocked.space.probeUsedTrust).toBe(1)
  })

  it('allows probes to destroy drifters once Combat trust is allocated', () => {
    const originalRandom = Math.random
    Math.random = () => 0.99

    try {
      const battleState = {
        ...createInitialGameState(),
        earth: {
          ...createInitialGameState().earth,
          humanFlag: false,
          spaceFlag: true,
        },
        projects: {
          ...createInitialGameState().projects,
          project131: true,
        },
        space: {
          ...createInitialGameState().space,
          probeCount: 2_000_000,
          drifterCount: 1_500_000,
          probeHaz: 1_000,
          probeCombat: 10,
        },
      }

      const next = runSpaceColonizationTick(battleState, 100)
      const expectedUnitSize = 1_500_000 / 100

      expect(next.space.drifterCount).toBeCloseTo(1_500_000 - expectedUnitSize, 10)
      expect(next.space.probesLostCombat).toBeCloseTo(expectedUnitSize, 10)
      expect(next.space.activeBattle).not.toBeNull()
    } finally {
      Math.random = originalRandom
    }
  })

  it('unlocks OODA and named battles at the original late combat thresholds', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      projects: {
        ...createInitialGameState().projects,
        project131: true,
      },
      compute: {
        ...createInitialGameState().compute,
        operations: 300_000,
        standardOps: 300_000,
        creativity: 300_000,
      },
      strategy: {
        ...createInitialGameState().strategy,
        yomi: 60_000,
      },
      space: {
        ...createInitialGameState().space,
        probesLostCombat: 10_000_000,
      },
    }

    const visible = getVisibleProjects(state)
    expect(visible.some((project) => project.id === 'project120' && project.canActivate)).toBe(true)
    expect(visible.some((project) => project.id === 'project121' && project.canActivate)).toBe(true)

    const withOoda = activateProject(state, 'project120')
    const withNames = activateProject(state, 'project121')

    expect(withOoda.projects.project120).toBe(true)
    expect(withOoda.strategy.yomi).toBe(15_000)
    expect(withOoda.compute.operations).toBe(125_000)
    expect(withOoda.space.attackSpeedFlag).toBe(true)

    expect(withNames.projects.project121).toBe(true)
    expect(withNames.compute.creativity).toBe(75_000)
    expect(withNames.space.battleNameFlag).toBe(true)
    expect(withNames.space.battleEndTimer).toBe(200)
  })

  it('supports repeatable threnody honor gains and fixed-cost max trust spending', () => {
    const state = {
      ...createInitialGameState(),
      earth: {
        ...createInitialGameState().earth,
        humanFlag: false,
        spaceFlag: true,
      },
      projects: {
        ...createInitialGameState().projects,
        project121: true,
      },
      compute: {
        ...createInitialGameState().compute,
        creativity: 200_000,
      },
      strategy: {
        ...createInitialGameState().strategy,
        yomi: 100_000,
      },
      space: {
        ...createInitialGameState().space,
        maxTrust: 5,
        probeTrust: 5,
        probeUsedTrust: 5,
        threnodyCost: 50_000,
      },
    }

    const firstThrenody = activateProject(state, 'project133')
    const secondThrenody = activateProject({
      ...firstThrenody,
      compute: {
        ...firstThrenody.compute,
        creativity: firstThrenody.compute.creativity + 60_000,
      },
      strategy: {
        ...firstThrenody.strategy,
        yomi: firstThrenody.strategy.yomi + 24_000,
      },
    }, 'project133')
    const trustRaised = increaseMaxTrust({
      ...secondThrenody,
      space: {
        ...secondThrenody.space,
        honor: 100_000,
      },
    })

    expect(firstThrenody.space.honor).toBe(10_000)
    expect(firstThrenody.space.threnodyCost).toBe(60_000)
    expect(secondThrenody.space.honor).toBe(20_000)
    expect(secondThrenody.space.threnodyCost).toBe(70_000)
    expect(trustRaised.space.maxTrust).toBe(15)
    expect(trustRaised.space.honor).toBeCloseTo(8_882.01, 2)
  })

  it('awards honor on victory and applies Glory streak bonuses once named battles are unlocked', () => {
    const originalRandom = Math.random
    Math.random = () => 0.99

    try {
      const battleState = {
        ...createInitialGameState(),
        earth: {
          ...createInitialGameState().earth,
          humanFlag: false,
          spaceFlag: true,
        },
        projects: {
          ...createInitialGameState().projects,
          project131: true,
          project121: true,
          project134: true,
        },
        space: {
          ...createInitialGameState().space,
          battleFlag: true,
          battleNameFlag: true,
          battleEndTimer: 200,
          probeCount: 2_000_000,
          drifterCount: 10_000,
          probeHaz: 1_000,
          probeCombat: 10,
          activeBattle: {
            id: 1,
            name: 'Battle of Tests',
            clipProbes: 2_000_000,
            drifterProbes: 10_000,
            territory: 1_000,
            unitSize: 10_000,
            startingLeftShips: 2,
            startingRightShips: 1,
            leftShips: 2,
            rightShips: 1,
            battleClock: 0,
            masterBattleClock: 0,
            battleEndDelay: false,
            battleEndTimer: 200,
          },
        },
      }

      const next = runSpaceColonizationTick(battleState, 100)

      expect(next.space.activeBattle).toBeNull()
      expect(next.space.honor).toBeGreaterThan(0)
      expect(next.space.honorReward).toBeGreaterThan(0)
      expect(next.space.bonusHonor).toBe(10)
    } finally {
      Math.random = originalRandom
    }
  })

  it('uses OODA to prevent probe deaths that would otherwise happen at the same combat roll', () => {
    const originalRandom = Math.random
    Math.random = () => 0.7

    try {
      const base = {
        ...createInitialGameState(),
        earth: {
          ...createInitialGameState().earth,
          humanFlag: false,
          spaceFlag: true,
        },
        projects: {
          ...createInitialGameState().projects,
          project131: true,
        },
        space: {
          ...createInitialGameState().space,
          probeCount: 2_000_000,
          drifterCount: 1_500_000,
          probeHaz: 1_000,
          probeCombat: 0,
          probeSpeed: 2,
        },
      }

      const withoutOoda = runSpaceColonizationTick(base, 100)
      const withOoda = runSpaceColonizationTick({
        ...base,
        projects: {
          ...base.projects,
          project120: true,
        },
        space: {
          ...base.space,
          attackSpeedFlag: true,
        },
      }, 100)

      expect(withoutOoda.space.probesLostCombat).toBeGreaterThan(0)
      expect(withOoda.space.probesLostCombat).toBe(0)
    } finally {
      Math.random = originalRandom
    }
  })
})
