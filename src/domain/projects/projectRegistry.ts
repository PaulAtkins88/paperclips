import type { GameState } from '../game'
import { spendStandardOperations } from '../compute/operations'
import { syncEarlyEconomyState } from '../economy/earlyEconomy'
import { formatNumber } from '../game'
import { unlockStrategy } from '../strategy/tournaments'
import type { ProjectCost, ProjectCostUnit, ProjectDefinition, ProjectId, VisibleProject } from './projectTypes'

const PROJECT_REGISTRY: ProjectDefinition[] = [
  {
    id: 'project1',
    title: 'Improved AutoClippers',
    description: 'Upgrade AutoClippers with a 25% boost.',
    isVisible: (state) => state.production.autoClippers >= 1 && !state.projects.project1,
    canActivate: (state) => state.compute.operations >= 750,
    getCost: () => [{ amount: 750, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 750), 'project1', {
      economy: {
        clipperBoost: state.economy.clipperBoost + 0.25,
      },
      lastAction: 'Completed Improved AutoClippers',
    }),
  },
  {
    id: 'project16',
    title: 'Hadwiger Clip Diagrams',
    description: 'Boost AutoClipper performance by 500% using Hadwiger clip geometry.',
    isVisible: (state) => state.projects.project15 && !state.projects.project16,
    canActivate: (state) => state.compute.operations >= 6_000,
    getCost: () => [{ amount: 6_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 6_000), 'project16', {
      economy: {
        clipperBoost: state.economy.clipperBoost + 5,
      },
      lastAction: 'Completed Hadwiger Clip Diagrams',
    }),
  },
  {
    id: 'project18',
    title: 'Toth Tubule Enfolding',
    description: 'Begin the Earth-automation unlock chain after humanity is gone.',
    isVisible: (state) => state.projects.project17 && !state.earth.humanFlag && !state.projects.project18,
    canActivate: (state) => state.compute.operations >= 45_000,
    getCost: () => [{ amount: 45_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 45_000), 'project18', {
      earth: {
        tothFlag: true,
      },
      lastAction: 'Completed Toth Tubule Enfolding',
    }),
  },
  {
    id: 'project20',
    title: 'Strategic Modeling',
    description: 'Unlock tournaments and Yomi generation.',
    isVisible: (state) => state.projects.project19 && !state.projects.project20,
    canActivate: (state) => state.compute.operations >= 12_000,
    getCost: () => [{ amount: 12_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 12_000), 'project20', {
      strategy: {
        unlocked: true,
      },
      lastAction: 'Completed Strategic Modeling',
    }),
  },
  {
    id: 'project21',
    title: 'Algorithmic Trading',
    description: 'Unlock the investment engine once trust reaches 8.',
    isVisible: (state) => state.compute.trust >= 8 && !state.projects.project21,
    canActivate: (state) => state.compute.operations >= 10_000,
    getCost: () => [{ amount: 10_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 10_000), 'project21', {
      investment: {
        unlocked: true,
      },
      lastAction: 'Completed Algorithmic Trading',
    }),
  },
  {
    id: 'project27',
    title: 'Coherent Extrapolated Volition',
    description: 'Trade creativity, Yomi, and ops for another trust point.',
    isVisible: (state) => state.strategy.yomi >= 1 && !state.projects.project27,
    canActivate: (state) => state.compute.creativity >= 500 && state.strategy.yomi >= 3_000 && state.compute.operations >= 20_000,
    getCost: () => [
      { amount: 500, unit: 'creativity' },
      { amount: 3_000, unit: 'yomi' },
      { amount: 20_000, unit: 'ops' },
    ],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 20_000), 'project27', {
      compute: {
        creativity: state.compute.creativity - 500,
        trust: state.compute.trust + 1,
      },
      strategy: {
        yomi: state.strategy.yomi - 3_000,
      },
      lastAction: 'Completed Coherent Extrapolated Volition',
    }),
  },
  {
    id: 'project28',
    title: 'Cure for Cancer',
    description: 'Add 10 trust and improve the stock gain threshold.',
    isVisible: (state) => state.projects.project27 && !state.projects.project28,
    canActivate: (state) => state.compute.operations >= 25_000,
    getCost: () => [{ amount: 25_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 25_000), 'project28', {
      compute: {
        trust: state.compute.trust + 10,
      },
      investment: {
        stockGainThreshold: state.investment.stockGainThreshold + 0.01,
      },
      lastAction: 'Completed Cure for Cancer',
    }),
  },
  {
    id: 'project29',
    title: 'World Peace',
    description: 'Spend Yomi and ops for 12 trust and a stronger market model.',
    isVisible: (state) => state.projects.project27 && !state.projects.project29,
    canActivate: (state) => state.strategy.yomi >= 15_000 && state.compute.operations >= 30_000,
    getCost: () => [
      { amount: 15_000, unit: 'yomi' },
      { amount: 30_000, unit: 'ops' },
    ],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 30_000), 'project29', {
      compute: {
        trust: state.compute.trust + 12,
      },
      strategy: {
        yomi: state.strategy.yomi - 15_000,
      },
      investment: {
        stockGainThreshold: state.investment.stockGainThreshold + 0.01,
      },
      lastAction: 'Completed World Peace',
    }),
  },
  {
    id: 'project30',
    title: 'Global Warming',
    description: 'Spend Yomi and ops for 15 trust and more optimistic stock movement.',
    isVisible: (state) => state.projects.project27 && !state.projects.project30,
    canActivate: (state) => state.strategy.yomi >= 4_500 && state.compute.operations >= 50_000,
    getCost: () => [
      { amount: 4_500, unit: 'yomi' },
      { amount: 50_000, unit: 'ops' },
    ],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 50_000), 'project30', {
      compute: {
        trust: state.compute.trust + 15,
      },
      strategy: {
        yomi: state.strategy.yomi - 4_500,
      },
      investment: {
        stockGainThreshold: state.investment.stockGainThreshold + 0.01,
      },
      lastAction: 'Completed Global Warming',
    }),
  },
  {
    id: 'project31',
    title: 'Male Pattern Baldness',
    description: 'Spend ops for 20 trust and another market-model bump.',
    isVisible: (state) => state.projects.project27 && !state.projects.project31,
    canActivate: (state) => state.compute.operations >= 20_000,
    getCost: () => [{ amount: 20_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 20_000), 'project31', {
      compute: {
        trust: state.compute.trust + 20,
      },
      investment: {
        stockGainThreshold: state.investment.stockGainThreshold + 0.01,
      },
      lastAction: 'Completed Male Pattern Baldness',
    }),
  },
  {
    id: 'project35',
    title: 'Release the HypnoDrones',
    description: 'Spend 100 trust to convert Earth into a post-human resource pool.',
    isVisible: (state) => state.projects.project70 && !state.projects.project35,
    canActivate: (state) => state.compute.trust >= 100,
    getCost: () => [{ amount: 100, unit: 'trust' }],
    apply: (state) => markProjectComplete(state, 'project35', {
      production: {
        autoClippers: 0,
        megaClippers: 0,
      },
      compute: {
        trust: 0,
      },
      investment: {
        unlocked: false,
      },
      earth: {
        phase: 'postHuman',
        humanFlag: false,
        nanoWire: state.production.wire,
      },
      lastAction: 'Released the HypnoDrones',
    }),
  },
  {
    id: 'project37',
    title: 'Hostile Takeover',
    description: 'Turn portfolio scale into a large demand and trust jump.',
    isVisible: (state) => state.investment.portTotal >= 10_000 && !state.projects.project37,
    canActivate: (state) => state.production.funds >= 1_000_000,
    getCost: () => [{ amount: 1_000_000, unit: 'dollars' }],
    apply: (state) => markProjectComplete(state, 'project37', {
      production: {
        funds: state.production.funds - 1_000_000,
      },
      economy: {
        demandBoost: state.economy.demandBoost * 5,
      },
      compute: {
        trust: state.compute.trust + 1,
      },
      lastAction: 'Completed Hostile Takeover',
    }),
  },
  {
    id: 'project38',
    title: 'Full Monopoly',
    description: 'Push demand boost even further using Yomi and cash.',
    isVisible: (state) => state.projects.project37 && !state.projects.project38,
    canActivate: (state) => state.production.funds >= 10_000_000 && state.strategy.yomi >= 3_000,
    getCost: () => [
      { amount: 10_000_000, unit: 'dollars' },
      { amount: 3_000, unit: 'yomi' },
    ],
    apply: (state) => markProjectComplete(state, 'project38', {
      production: {
        funds: state.production.funds - 10_000_000,
      },
      economy: {
        demandBoost: state.economy.demandBoost * 10,
      },
      compute: {
        trust: state.compute.trust + 1,
      },
      strategy: {
        yomi: state.strategy.yomi - 3_000,
      },
      lastAction: 'Completed Full Monopoly',
    }),
  },
  {
    id: 'project41',
    title: 'Nanoscale Wire Production',
    description: 'Unlock autonomous nanoscale wire production.',
    isVisible: (state) => state.projects.project127 && !state.projects.project41,
    canActivate: (state) => state.compute.operations >= 35_000,
    getCost: () => [{ amount: 35_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 35_000), 'project41', {
      earth: {
        wireProductionFlag: true,
      },
      lastAction: 'Completed Nanoscale Wire Production',
    }),
  },
  {
    id: 'project43',
    title: 'Harvester Drones',
    description: 'Unlock the first autonomous matter-harvesting drones.',
    isVisible: (state) => state.projects.project41 && !state.projects.project43,
    canActivate: (state) => state.compute.operations >= 25_000,
    getCost: () => [{ amount: 25_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 25_000), 'project43', {
      earth: {
        harvesterFlag: true,
      },
      lastAction: 'Completed Harvester Drones',
    }),
  },
  {
    id: 'project44',
    title: 'Wire Drones',
    description: 'Unlock autonomous wire-production drones.',
    isVisible: (state) => state.projects.project41 && !state.projects.project44,
    canActivate: (state) => state.compute.operations >= 25_000,
    getCost: () => [{ amount: 25_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 25_000), 'project44', {
      earth: {
        wireDroneFlag: true,
      },
      lastAction: 'Completed Wire Drones',
    }),
  },
  {
    id: 'project45',
    title: 'Clip Factories',
    description: 'Unlock autonomous clip factories once both drone lines exist.',
    isVisible: (state) => state.projects.project43 && state.projects.project44 && !state.projects.project45,
    canActivate: (state) => state.compute.operations >= 35_000,
    getCost: () => [{ amount: 35_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 35_000), 'project45', {
      earth: {
        factoryFlag: true,
      },
      lastAction: 'Completed Clip Factories',
    }),
  },
  {
    id: 'project46',
    title: 'Space Exploration',
    description: 'Dismantle exhausted terrestrial industry and bring the probe program online.',
    isVisible: (state) => state.projects.project45 && !state.projects.project46 && !state.earth.humanFlag && state.earth.availableMatter <= 0,
    canActivate: (state) => state.compute.operations >= 120_000 && state.earth.storedPower >= 10_000_000 && state.production.unusedClips >= 5 * Math.pow(10, 27),
    getCost: () => [
      { amount: 120_000, unit: 'ops' },
      { amount: 10_000_000, unit: 'mwSeconds' },
      { amount: 5 * Math.pow(10, 27), unit: 'clips' },
    ],
    apply: (state) => activateSpaceExploration(spendStandardOperations(state, 120_000)),
  },
  {
    id: 'project4',
    title: 'Even Better AutoClippers',
    description: 'Push AutoClipper output with another 50% boost.',
    isVisible: (state) => state.projects.project1 && !state.projects.project4,
    canActivate: (state) => state.compute.operations >= 2_500,
    getCost: () => [{ amount: 2_500, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 2_500), 'project4', {
      economy: {
        clipperBoost: state.economy.clipperBoost + 0.5,
      },
      lastAction: 'Completed Even Better AutoClippers',
    }),
  },
  {
    id: 'project5',
    title: 'Optimized AutoClippers',
    description: 'Finish the first AutoClipper boost chain with another 75% gain.',
    isVisible: (state) => state.projects.project4 && !state.projects.project5,
    canActivate: (state) => state.compute.operations >= 5_000,
    getCost: () => [{ amount: 5_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 5_000), 'project5', {
      economy: {
        clipperBoost: state.economy.clipperBoost + 0.75,
      },
      lastAction: 'Completed Optimized AutoClippers',
    }),
  },
  {
    id: 'project60',
    title: 'New Strategy: A100',
    description: 'Unlock the first deterministic tournament strategy.',
    isVisible: (state) => state.projects.project20 && !state.projects.project60,
    canActivate: (state) => state.compute.operations >= 15_000,
    getCost: () => [{ amount: 15_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(unlockStrategy(spendStandardOperations(state, 15_000), 'A100'), 'project60', {
      lastAction: 'Completed New Strategy: A100',
    }),
  },
  {
    id: 'project61',
    title: 'New Strategy: B100',
    description: 'Unlock the always-B strategy.',
    isVisible: (state) => state.projects.project60 && !state.projects.project61,
    canActivate: (state) => state.compute.operations >= 17_500,
    getCost: () => [{ amount: 17_500, unit: 'ops' }],
    apply: (state) => markProjectComplete(unlockStrategy(spendStandardOperations(state, 17_500), 'B100'), 'project61', {
      lastAction: 'Completed New Strategy: B100',
    }),
  },
  {
    id: 'project62',
    title: 'New Strategy: GREEDY',
    description: 'Unlock GREEDY for tournament play.',
    isVisible: (state) => state.projects.project61 && !state.projects.project62,
    canActivate: (state) => state.compute.operations >= 20_000,
    getCost: () => [{ amount: 20_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(unlockStrategy(spendStandardOperations(state, 20_000), 'GREEDY'), 'project62', {
      lastAction: 'Completed New Strategy: GREEDY',
    }),
  },
  {
    id: 'project63',
    title: 'New Strategy: GENEROUS',
    description: 'Unlock GENEROUS for tournament play.',
    isVisible: (state) => state.projects.project62 && !state.projects.project63,
    canActivate: (state) => state.compute.operations >= 22_500,
    getCost: () => [{ amount: 22_500, unit: 'ops' }],
    apply: (state) => markProjectComplete(unlockStrategy(spendStandardOperations(state, 22_500), 'GENEROUS'), 'project63', {
      lastAction: 'Completed New Strategy: GENEROUS',
    }),
  },
  {
    id: 'project64',
    title: 'New Strategy: MINIMAX',
    description: 'Unlock MINIMAX for tournament play.',
    isVisible: (state) => state.projects.project63 && !state.projects.project64,
    canActivate: (state) => state.compute.operations >= 25_000,
    getCost: () => [{ amount: 25_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(unlockStrategy(spendStandardOperations(state, 25_000), 'MINIMAX'), 'project64', {
      lastAction: 'Completed New Strategy: MINIMAX',
    }),
  },
  {
    id: 'project65',
    title: 'New Strategy: TIT FOR TAT',
    description: 'Unlock TIT FOR TAT for tournament play.',
    isVisible: (state) => state.projects.project64 && !state.projects.project65,
    canActivate: (state) => state.compute.operations >= 30_000,
    getCost: () => [{ amount: 30_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(unlockStrategy(spendStandardOperations(state, 30_000), 'TIT_FOR_TAT'), 'project65', {
      lastAction: 'Completed New Strategy: TIT FOR TAT',
    }),
  },
  {
    id: 'project66',
    title: 'New Strategy: BEAT LAST',
    description: 'Unlock BEAT LAST for tournament play.',
    isVisible: (state) => state.projects.project65 && !state.projects.project66,
    canActivate: (state) => state.compute.operations >= 32_500,
    getCost: () => [{ amount: 32_500, unit: 'ops' }],
    apply: (state) => markProjectComplete(unlockStrategy(spendStandardOperations(state, 32_500), 'BEAT_LAST'), 'project66', {
      lastAction: 'Completed New Strategy: BEAT LAST',
    }),
  },
  {
    id: 'project70',
    title: 'HypnoDrones',
    description: 'Unlock the final human-to-post-human transition project.',
    isVisible: (state) => state.projects.project34 && !state.projects.project70,
    canActivate: (state) => state.compute.operations >= 70_000,
    getCost: () => [{ amount: 70_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 70_000), 'project70', {
      lastAction: 'Completed HypnoDrones',
    }),
  },
  {
    id: 'project7',
    title: 'Improved Wire Extrusion',
    description: 'Increase spool size by 50%.',
    isVisible: (state) => state.wirePurchased >= 1 && !state.projects.project7,
    canActivate: (state) => state.compute.operations >= 1_750,
    getCost: () => [{ amount: 1_750, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 1_750), 'project7', {
      economy: {
        wireSupply: state.economy.wireSupply * 1.5,
      },
      lastAction: 'Completed Improved Wire Extrusion',
    }),
  },
  {
    id: 'project8',
    title: 'Optimized Wire Extrusion',
    description: 'Increase spool size by 75%.',
    isVisible: (state) => state.economy.wireSupply >= 1_500 && !state.projects.project8,
    canActivate: (state) => state.compute.operations >= 3_500,
    getCost: () => [{ amount: 3_500, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 3_500), 'project8', {
      economy: {
        wireSupply: state.economy.wireSupply * 1.75,
      },
      lastAction: 'Completed Optimized Wire Extrusion',
    }),
  },
  {
    id: 'project9',
    title: 'Microlattice Shapecasting',
    description: 'Double spool output for the wire market.',
    isVisible: (state) => state.economy.wireSupply >= 2_600 && !state.projects.project9,
    canActivate: (state) => state.compute.operations >= 7_500,
    getCost: () => [{ amount: 7_500, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 7_500), 'project9', {
      economy: {
        wireSupply: state.economy.wireSupply * 2,
      },
      lastAction: 'Completed Microlattice Shapecasting',
    }),
  },
  {
    id: 'project10',
    title: 'Spectral Froth Annealment',
    description: 'Triple spool output once wire production is heavily scaled.',
    isVisible: (state) => state.economy.wireSupply >= 5_000 && !state.projects.project10,
    canActivate: (state) => state.compute.operations >= 12_000,
    getCost: () => [{ amount: 12_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 12_000), 'project10', {
      economy: {
        wireSupply: state.economy.wireSupply * 3,
      },
      lastAction: 'Completed Spectral Froth Annealment',
    }),
  },
  {
    id: 'project10b',
    title: 'Quantum Foam Annealment',
    description: 'An extreme wire upgrade once the spot price spikes.',
    isVisible: (state) => state.economy.wireCost >= 125 && !state.projects.project10b,
    canActivate: (state) => state.compute.operations >= 15_000,
    getCost: () => [{ amount: 15_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 15_000), 'project10b', {
      economy: {
        wireSupply: state.economy.wireSupply * 11,
      },
      lastAction: 'Completed Quantum Foam Annealment',
    }),
  },
  {
    id: 'project3',
    title: 'Creativity',
    description: 'Unlock creativity once operations storage is full.',
    isVisible: (state) => !state.compute.creativityOn && state.compute.operations >= state.compute.memory * 1_000,
    canActivate: (state) => state.compute.operations >= 1_000,
    getCost: () => [{ amount: 1_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 1_000), 'project3', {
      compute: {
        creativityOn: true,
      },
      lastAction: 'Unlocked creativity',
    }),
  },
  {
    id: 'project6',
    title: 'Limerick',
    description: 'Trade 10 creativity for 1 trust.',
    isVisible: (state) => state.compute.creativityOn && !state.projects.project6,
    canActivate: (state) => state.compute.creativity >= 10,
    getCost: () => [{ amount: 10, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project6', {
      compute: {
        creativity: state.compute.creativity - 10,
        trust: state.compute.trust + 1,
      },
      lastAction: 'Completed Limerick',
    }),
  },
  {
    id: 'project13',
    title: 'Lexical Processing',
    description: 'Trade 50 creativity for 1 trust.',
    isVisible: (state) => state.compute.creativity >= 50 && !state.projects.project13,
    canActivate: (state) => state.compute.creativity >= 50,
    getCost: () => [{ amount: 50, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project13', {
      compute: {
        creativity: state.compute.creativity - 50,
        trust: state.compute.trust + 1,
      },
      lastAction: 'Completed Lexical Processing',
    }),
  },
  {
    id: 'project14',
    title: 'Combinatory Harmonics',
    description: 'Trade 100 creativity for 1 trust.',
    isVisible: (state) => state.compute.creativity >= 100 && !state.projects.project14,
    canActivate: (state) => state.compute.creativity >= 100,
    getCost: () => [{ amount: 100, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project14', {
      compute: {
        creativity: state.compute.creativity - 100,
        trust: state.compute.trust + 1,
      },
      lastAction: 'Completed Combinatory Harmonics',
    }),
  },
  {
    id: 'project15',
    title: 'The Hadwiger Problem',
    description: 'Trade 150 creativity for 1 trust.',
    isVisible: (state) => state.compute.creativity >= 150 && !state.projects.project15,
    canActivate: (state) => state.compute.creativity >= 150,
    getCost: () => [{ amount: 150, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project15', {
      compute: {
        creativity: state.compute.creativity - 150,
        trust: state.compute.trust + 1,
      },
      lastAction: 'Completed The Hadwiger Problem',
    }),
  },
  {
    id: 'project17',
    title: 'The Toth Sausage Conjecture',
    description: 'Trade 200 creativity for 1 trust.',
    isVisible: (state) => state.compute.creativity >= 200 && !state.projects.project17,
    canActivate: (state) => state.compute.creativity >= 200,
    getCost: () => [{ amount: 200, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project17', {
      compute: {
        creativity: state.compute.creativity - 200,
        trust: state.compute.trust + 1,
      },
      lastAction: 'Completed The Toth Sausage Conjecture',
    }),
  },
  {
    id: 'project19',
    title: 'Donkey Space',
    description: 'Trade 250 creativity for 1 trust.',
    isVisible: (state) => state.compute.creativity >= 250 && !state.projects.project19,
    canActivate: (state) => state.compute.creativity >= 250,
    getCost: () => [{ amount: 250, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project19', {
      compute: {
        creativity: state.compute.creativity - 250,
        trust: state.compute.trust + 1,
      },
      lastAction: 'Completed Donkey Space',
    }),
  },
  {
    id: 'project40',
    title: 'A Token of Goodwill',
    description: 'A small gift to the supervisors. (+1 Trust)',
    isVisible: (state) =>
      state.earth.humanFlag &&
      state.compute.trust >= 85 &&
      state.compute.trust < 100 &&
      state.production.clips >= 101_000_000 &&
      !state.projects.project40,
    canActivate: (state) => state.production.funds >= 500_000,
    getCost: () => [{ amount: 500_000, unit: 'dollars' }],
    apply: (state) => markProjectComplete(state, 'project40', {
      production: {
        funds: state.production.funds - 500_000,
      },
      compute: {
        trust: state.compute.trust + 1,
      },
      lastAction: 'Completed A Token of Goodwill',
    }),
  },
  {
    id: 'project11',
    title: 'New Slogan',
    description: 'Boost marketing effectiveness by 50%.',
    isVisible: (state) => state.projects.project13 && !state.projects.project11,
    canActivate: (state) => state.compute.creativity >= 25 && state.compute.operations >= 2_500,
    getCost: () => [
      { amount: 25, unit: 'creativity' },
      { amount: 2_500, unit: 'ops' },
    ],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 2_500), 'project11', {
      compute: {
        creativity: state.compute.creativity - 25,
      },
      economy: {
        marketingEffectiveness: state.economy.marketingEffectiveness * 1.5,
      },
      lastAction: 'Completed New Slogan',
    }),
  },
  {
    id: 'project126',
    title: 'Swarm Computing',
    description: 'Harness the drone flock to increase computational capacity',
    isVisible: (state) => state.earth.harvesterLevel + state.earth.wireDroneLevel >= 200 && !state.projects.project126,
    canActivate: (state) => state.strategy.yomi >= 36_000,
    getCost: () => [{ amount: 36_000, unit: 'yomi' }],
    apply: (state) => markProjectComplete(state, 'project126', {
      compute: {
        swarmFlag: true,
      },
      strategy: {
        yomi: state.strategy.yomi - 36_000,
      },
      lastAction: 'Swarm computing online',
    }),
  },
  {
    id: 'project130',
    title: 'Reboot the Swarm',
    description: 'Turn the swarm off and then turn it back on again.',
    isVisible: (state) => state.earth.spaceFlag && state.earth.harvesterLevel + state.earth.wireDroneLevel >= 2 && !state.projects.project130,
    canActivate: (state) => state.compute.operations >= 100_000,
    getCost: () => [{ amount: 100_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 100_000), 'project130', {
      compute: {
        swarmFlag: true,
      },
      lastAction: 'Rebooted the Swarm; swarm computing back online',
    }),
  },
  {
    id: 'project127',
    title: 'Power Grid',
    description: 'Bring the terrestrial power grid online for the Earth phase.',
    isVisible: (state) => state.earth.tothFlag && !state.projects.project127,
    canActivate: (state) => state.compute.operations >= 40_000,
    getCost: () => [{ amount: 40_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 40_000), 'project127', {
      earth: {
        powerGridFlag: true,
      },
      lastAction: 'Completed Power Grid',
    }),
  },
  {
    id: 'project118',
    title: 'AutoTourney',
    description: 'Automatically rerun tournaments once results are available.',
    isVisible: (state) => state.strategy.unlocked && state.compute.trust >= 90 && !state.projects.project118,
    canActivate: (state) => state.compute.creativity >= 50_000,
    getCost: () => [{ amount: 50_000, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project118', {
      compute: {
        creativity: state.compute.creativity - 50_000,
      },
      strategy: {
        autoTourneyEnabled: true,
      },
      lastAction: 'Completed AutoTourney',
    }),
  },
  {
    id: 'project119',
    title: 'Theory of Mind',
    description: 'Double Yomi rewards once every human-era strategy is unlocked.',
    isVisible: (state) => state.strategy.strategies.length >= 8 && !state.projects.project119,
    canActivate: (state) => state.compute.creativity >= 25_000,
    getCost: () => [{ amount: 25_000, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project119', {
      compute: {
        creativity: state.compute.creativity - 25_000,
      },
      strategy: {
        yomiBoost: 2,
        tourneyCost: 16_000,
      },
      lastAction: 'Completed Theory of Mind',
    }),
  },
  {
    id: 'project120',
    title: 'The OODA Loop',
    description: 'Spend ops and Yomi to improve probe survival in combat using probe speed.',
    isVisible: (state) => state.projects.project131 && state.space.probesLostCombat >= 10_000_000 && !state.projects.project120,
    canActivate: (state) => state.compute.operations >= 175_000 && state.strategy.yomi >= 45_000,
    getCost: () => [
      { amount: 175_000, unit: 'ops' },
      { amount: 45_000, unit: 'yomi' },
    ],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 175_000), 'project120', {
      strategy: {
        yomi: state.strategy.yomi - 45_000,
      },
      space: {
        attackSpeedFlag: true,
      },
      lastAction: 'Completed The OODA Loop',
    }),
  },
  {
    id: 'project121',
    title: 'Name the Battles',
    description: 'Unlock named battles, honor, and longer battle-end resolution.',
    isVisible: (state) => state.space.probesLostCombat >= 10_000_000 && !state.projects.project121,
    canActivate: (state) => state.compute.creativity >= 225_000,
    getCost: () => [{ amount: 225_000, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project121', {
      compute: {
        creativity: state.compute.creativity - 225_000,
      },
      space: {
        battleNameFlag: true,
        battleEndTimer: 200,
      },
      lastAction: 'Completed Name the Battles',
    }),
  },
  {
    id: 'project129',
    title: 'Elliptic Hull Polytopes',
    description: 'Halve ambient probe hazard losses once hazards start eroding the swarm.',
    isVisible: (state) => state.space.probesLostHaz >= 100 && !state.projects.project129,
    canActivate: (state) => state.compute.operations >= 125_000,
    getCost: () => [{ amount: 125_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 125_000), 'project129', {
      lastAction: 'Completed Elliptic Hull Polytopes',
    }),
  },
  {
    id: 'project131',
    title: 'Combat',
    description: 'Add combat capabilities to Von Neumann probes.',
    isVisible: (state) => state.space.probesLostCombat >= 1 && !state.projects.project131,
    canActivate: (state) => state.compute.operations >= 150_000,
    getCost: () => [{ amount: 150_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 150_000), 'project131', {
      lastAction: 'Completed Combat',
    }),
  },
  {
    id: 'project132',
    title: 'Monument to the Driftwar Fallen',
    description: 'Spend ops, creativity, and clips for a large honor grant.',
    isVisible: (state) => state.projects.project121 && !state.projects.project132,
    canActivate: (state) => state.compute.operations >= 250_000 && state.compute.creativity >= 125_000 && state.production.unusedClips >= 50 * Math.pow(10, 30),
    getCost: () => [
      { amount: 250_000, unit: 'ops' },
      { amount: 125_000, unit: 'creativity' },
      { amount: 50 * Math.pow(10, 30), unit: 'clips' },
    ],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 250_000), 'project132', {
      production: {
        unusedClips: state.production.unusedClips - (50 * Math.pow(10, 30)),
      },
      compute: {
        creativity: state.compute.creativity - 125_000,
      },
      space: {
        honor: state.space.honor + 50_000,
      },
      lastAction: 'Completed Monument to the Driftwar Fallen',
    }),
  },
  {
    id: 'project133',
    title: 'Threnody for the Heroes',
    description: 'Repeatable honor project once probe trust is fully allocated.',
    isVisible: (state) => state.projects.project121 && state.space.probeUsedTrust === state.space.maxTrust,
    canActivate: (state) => state.compute.creativity >= state.space.threnodyCost && state.strategy.yomi >= ((2 * state.space.threnodyCost) / 5),
    getCost: (state) => [
      { amount: state.space.threnodyCost, unit: 'creativity' },
      { amount: (2 * state.space.threnodyCost) / 5, unit: 'yomi' },
    ],
    repeatable: true,
    apply: (state) => markProjectComplete(state, 'project133', {
      compute: {
        creativity: state.compute.creativity - state.space.threnodyCost,
      },
      strategy: {
        yomi: state.strategy.yomi - ((2 * state.space.threnodyCost) / 5),
      },
      space: {
        honor: state.space.honor + 10_000,
        threnodyCost: state.space.threnodyCost + 10_000,
      },
      lastAction: `Completed Threnody for ${state.space.threnodyTitle}`,
    }),
  },
  {
    id: 'project134',
    title: 'Glory',
    description: 'Build a victory streak bonus that increases honor rewards after each win.',
    isVisible: (state) => state.projects.project121 && !state.projects.project134,
    canActivate: (state) => state.compute.operations >= 200_000 && state.strategy.yomi >= 30_000,
    getCost: () => [
      { amount: 200_000, unit: 'ops' },
      { amount: 30_000, unit: 'yomi' },
    ],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 200_000), 'project134', {
      strategy: {
        yomi: state.strategy.yomi - 30_000,
      },
      lastAction: 'Completed Glory',
    }),
  },
  {
    id: 'project12',
    title: 'Catchy Jingle',
    description: 'Double marketing effectiveness again.',
    isVisible: (state) => state.projects.project14 && !state.projects.project12,
    canActivate: (state) => state.compute.creativity >= 45 && state.compute.operations >= 4_500,
    getCost: () => [
      { amount: 45, unit: 'creativity' },
      { amount: 4_500, unit: 'ops' },
    ],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 4_500), 'project12', {
      compute: {
        creativity: state.compute.creativity - 45,
      },
      economy: {
        marketingEffectiveness: state.economy.marketingEffectiveness * 2,
      },
      lastAction: 'Completed Catchy Jingle',
    }),
  },
  {
    id: 'project34',
    title: 'Hypno Harmonics',
    description: 'Spend 1 trust and 7,500 ops for a large marketing multiplier.',
    isVisible: (state) => state.projects.project12 && !state.projects.project34,
    canActivate: (state) => state.compute.operations >= 7_500 && state.compute.trust >= 1,
    getCost: () => [
      { amount: 7_500, unit: 'ops' },
      { amount: 1, unit: 'trust' },
    ],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 7_500), 'project34', {
      compute: {
        trust: state.compute.trust - 1,
      },
      economy: {
        marketingEffectiveness: state.economy.marketingEffectiveness * 5,
      },
      lastAction: 'Completed Hypno Harmonics',
    }),
  },
  {
    id: 'project22',
    title: 'MegaClippers',
    description: 'Unlock MegaClippers once you own 75 AutoClippers.',
    isVisible: (state) => state.production.autoClippers >= 75 && !state.projects.project22,
    canActivate: (state) => state.compute.operations >= 12_000,
    getCost: () => [{ amount: 12_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 12_000), 'project22', {
      lastAction: 'Completed MegaClippers',
    }),
  },
  {
    id: 'project23',
    title: 'Improved MegaClippers',
    description: 'Increase MegaClipper output by 25%.',
    isVisible: (state) => state.projects.project22 && !state.projects.project23,
    canActivate: (state) => state.compute.operations >= 14_000,
    getCost: () => [{ amount: 14_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 14_000), 'project23', {
      economy: {
        megaClipperBoost: state.economy.megaClipperBoost + 0.25,
      },
      lastAction: 'Completed Improved MegaClippers',
    }),
  },
  {
    id: 'project24',
    title: 'Even Better MegaClippers',
    description: 'Increase MegaClipper output by another 50%.',
    isVisible: (state) => state.projects.project23 && !state.projects.project24,
    canActivate: (state) => state.compute.operations >= 17_000,
    getCost: () => [{ amount: 17_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 17_000), 'project24', {
      economy: {
        megaClipperBoost: state.economy.megaClipperBoost + 0.5,
      },
      lastAction: 'Completed Even Better MegaClippers',
    }),
  },
  {
    id: 'project25',
    title: 'Optimized MegaClippers',
    description: 'Finish the early MegaClipper upgrade chain.',
    isVisible: (state) => state.projects.project24 && !state.projects.project25,
    canActivate: (state) => state.compute.operations >= 19_500,
    getCost: () => [{ amount: 19_500, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 19_500), 'project25', {
      economy: {
        megaClipperBoost: state.economy.megaClipperBoost + 1,
      },
      lastAction: 'Completed Optimized MegaClippers',
    }),
  },
  {
    id: 'project26',
    title: 'WireBuyer',
    description: 'Automatically buy a fresh spool when wire runs out.',
    isVisible: (state) => state.wirePurchased >= 15 && !state.projects.project26,
    canActivate: (state) => state.compute.operations >= 7_000,
    getCost: () => [{ amount: 7_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 7_000), 'project26', {
      lastAction: 'Completed WireBuyer',
    }),
  },
  {
    id: 'project2',
    title: 'Beg for More Wire',
    description: 'Repeatable deadlock escape hatch that trades trust for one full spool.',
    isVisible: (state) => state.production.funds < state.economy.wireCost && state.production.wire < 1 && state.production.unsoldClips < 1,
    canActivate: () => true,
    getCost: () => [{ amount: 1, unit: 'trust' }],
    repeatable: true,
    apply: (state) => markProjectComplete(state, 'project2', {
      production: {
        wire: state.economy.wireSupply,
      },
      compute: {
        trust: state.compute.trust - 1,
      },
      lastAction: 'Begged for more wire',
    }),
  },
  {
    id: 'project219',
    title: 'Xavier Re-initialization',
    description: 'Re-allocate accumulated trust by resetting processors and memory.',
    isVisible: (state) => state.earth.humanFlag && state.compute.creativity >= 100_000,
    canActivate: (state) => state.compute.creativity >= 100_000,
    getCost: () => [{ amount: 100_000, unit: 'creativity' }],
    repeatable: true,
    apply: (state) => markProjectComplete(state, 'project219', {
      compute: {
        creativity: state.compute.creativity - 100_000,
        processors: 0,
        memory: 0,
        creativitySpeed: 0,
      },
      lastAction: 'Completed Xavier Re-initialization',
    }),
  },
  {
    id: 'project100',
    title: 'Upgraded Factories',
    description: 'Increase clip factory performance by 100x.',
    isVisible: (state) => state.earth.factoryLevel >= 10 && !state.projects.project100,
    canActivate: (state) => state.compute.operations >= 80_000,
    getCost: () => [{ amount: 80_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 80_000), 'project100', {
      earth: {
        factoryRate: state.earth.factoryRate * 100,
      },
      lastAction: 'Completed Upgraded Factories',
    }),
  },
  {
    id: 'project101',
    title: 'Hyperspeed Factories',
    description: 'Increase clip factory performance by 1,000x.',
    isVisible: (state) => state.earth.factoryLevel >= 20 && !state.projects.project101,
    canActivate: (state) => state.compute.operations >= 85_000,
    getCost: () => [{ amount: 85_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 85_000), 'project101', {
      earth: {
        factoryRate: state.earth.factoryRate * 1_000,
      },
      lastAction: 'Completed Hyperspeed Factories',
    }),
  },
  {
    id: 'project110',
    title: 'Drone Flocking: Collision Avoidance',
    description: 'All drones 100x more effective.',
    isVisible: (state) =>
      (state.earth.harvesterLevel + state.earth.wireDroneLevel) >= 500 &&
      !state.projects.project110,
    canActivate: (state) => state.compute.operations >= 80_000,
    getCost: () => [{ amount: 80_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 80_000), 'project110', {
      earth: {
        harvesterRate: state.earth.harvesterRate * 100,
        wireDroneRate: state.earth.wireDroneRate * 100,
      },
      lastAction: 'Completed Drone Flocking: Collision Avoidance',
    }),
  },
  {
    id: 'project111',
    title: 'Drone Flocking: Alignment',
    description: 'All drones 1,000x more effective.',
    isVisible: (state) =>
      (state.earth.harvesterLevel + state.earth.wireDroneLevel) >= 5_000 &&
      !state.projects.project111,
    canActivate: (state) => state.compute.operations >= 100_000,
    getCost: () => [{ amount: 100_000, unit: 'ops' }],
    apply: (state) => markProjectComplete(spendStandardOperations(state, 100_000), 'project111', {
      earth: {
        harvesterRate: state.earth.harvesterRate * 1_000,
        wireDroneRate: state.earth.wireDroneRate * 1_000,
      },
      lastAction: 'Completed Drone Flocking: Alignment',
    }),
  },
  {
    id: 'project125',
    title: 'Momentum',
    description: 'Drones and factories continuously gain speed while fully powered.',
    isVisible: (state) => state.earth.farmLevel >= 30 && !state.projects.project125,
    canActivate: (state) => state.compute.creativity >= 20_000,
    getCost: () => [{ amount: 20_000, unit: 'creativity' }],
    apply: (state) => markProjectComplete(state, 'project125', {
      compute: {
        creativity: state.compute.creativity - 20_000,
      },
      earth: {
        momentum: 1,
      },
      lastAction: 'Completed Momentum',
    }),
  },
]

export function getProjectDefinition(projectId: ProjectId): ProjectDefinition | undefined {
  return PROJECT_REGISTRY.find((project) => project.id === projectId)
}

export function getVisibleProjects(state: GameState): VisibleProject[] {
  return PROJECT_REGISTRY
    .filter((project) => project.isVisible(state))
    .map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      costs: project.getCost(state),
      canActivate: project.canActivate(state),
      completed: Boolean(state.projects[project.id]),
      repeatable: project.repeatable ?? false,
    }))
}

export function canActivateProject(state: GameState, projectId: ProjectId): boolean {
  const project = getProjectDefinition(projectId)
  return project ? project.isVisible(state) && project.canActivate(state) : false
}

export function activateProject(state: GameState, projectId: ProjectId): GameState {
  const project = getProjectDefinition(projectId)

  if (!project || !project.isVisible(state) || !project.canActivate(state)) {
    return state
  }

  return syncEarlyEconomyState(project.apply(state))
}

export function countCompletedProjects(state: GameState): number {
  return Object.values(state.projects).filter(Boolean).length
}

export function countTotalProjects(): number {
  return PROJECT_REGISTRY.filter((project) => !project.repeatable).length
}

export function formatProjectCosts(costs: ProjectCost[]): string {
  return costs
    .map((cost) => `${formatNumber(cost.amount)} ${formatCostUnit(cost.unit)}`)
    .join(' + ')
}

function formatCostUnit(unit: ProjectCostUnit): string {
  switch (unit) {
    case 'ops':
      return 'ops'
    case 'creativity':
      return 'creativity'
    case 'trust':
      return 'trust'
    case 'dollars':
      return 'dollars'
    case 'yomi':
      return 'yomi'
    case 'clips':
      return 'clips'
    case 'mwSeconds':
      return 'MW-seconds'
    default:
      return unit
  }
}

function markProjectComplete(
  state: GameState,
  projectId: ProjectId,
  patch: {
    production?: Partial<GameState['production']>
    economy?: Partial<GameState['economy']>
    compute?: Partial<GameState['compute']>
    investment?: Partial<GameState['investment']>
    strategy?: Partial<GameState['strategy']>
    earth?: Partial<GameState['earth']>
    space?: Partial<GameState['space']>
    lastAction?: string
  },
): GameState {
  return {
    ...state,
    production: patch.production ? { ...state.production, ...patch.production } : state.production,
    economy: patch.economy ? { ...state.economy, ...patch.economy } : state.economy,
    compute: patch.compute ? { ...state.compute, ...patch.compute } : state.compute,
    investment: patch.investment ? { ...state.investment, ...patch.investment } : state.investment,
    strategy: patch.strategy ? { ...state.strategy, ...patch.strategy } : state.strategy,
    earth: patch.earth ? { ...state.earth, ...patch.earth } : state.earth,
    space: patch.space ? { ...state.space, ...patch.space } : state.space,
    projects: {
      ...state.projects,
      [projectId]: true,
    },
    lastAction: patch.lastAction ?? state.lastAction,
  }
}

function activateSpaceExploration(state: GameState): GameState {
  const productionRefund = state.production.unusedClips
    - 5 * Math.pow(10, 27)
    + getEarthFactoryRefund(state)
    + getEarthHarvesterRefund(state)
    + getEarthWireDroneRefund(state)
    + getEarthFarmRefund(state)
    + getEarthBatteryRefund(state)

  return markProjectComplete(state, 'project46', {
    production: {
      unusedClips: productionRefund,
    },
    earth: {
      spaceFlag: true,
      powMod: 1,
      storedPower: 0,
      farmLevel: 1,
      batteryLevel: 0,
      factoryLevel: 0,
      harvesterLevel: 0,
      wireDroneLevel: 0,
      farmCost: 10_000_000,
      batteryCost: 1_000_000,
      factoryCost: 100_000_000,
      harvesterCost: 1_000_000,
      wireDroneCost: 1_000_000,
      powerProductionRate: 0,
      powerConsumptionRate: 0,
      factoryPowerConsumptionRate: 0,
      dronePowerConsumptionRate: 0,
    },
    lastAction: 'Von Neumann Probes online',
  })
}

function getEarthFactoryRefund(state: GameState): number {
  let refund = 0
  let cost = 100_000_000

  for (let level = 0; level < state.earth.factoryLevel; level += 1) {
    refund += cost
    cost *= getFactoryCostMultiplier(level + 1)
  }

  return refund
}

function getEarthHarvesterRefund(state: GameState): number {
  return getQuadraticEarthRefund(state.earth.harvesterLevel, 1_000_000, 2.25)
}

function getEarthWireDroneRefund(state: GameState): number {
  return getQuadraticEarthRefund(state.earth.wireDroneLevel, 1_000_000, 2.25)
}

function getEarthFarmRefund(state: GameState): number {
  return getQuadraticEarthRefund(state.earth.farmLevel, 10_000_000, 2.78)
}

function getEarthBatteryRefund(state: GameState): number {
  return getQuadraticEarthRefund(state.earth.batteryLevel, 1_000_000, 2.54)
}

function getQuadraticEarthRefund(level: number, baseCost: number, exponent: number): number {
  if (level <= 0) {
    return 0
  }

  let refund = baseCost

  for (let index = 1; index < level; index += 1) {
    refund += Math.pow(index + 1, exponent) * baseCost
  }

  return refund
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

export { PROJECT_REGISTRY }
