import {
  formatCurrency,
  formatNumber,
  formatWireAmount,
  getMaxOps,
  getProjectProgress,
  getSelectedStrategyLabel,
  getStallState,
  WIRE_BATCH_UNIT,
  WIRE_UNIT_LABEL,
  type GameState,
} from '../../domain/game'
import { getEarthPowerStatus } from '../../domain/earth/earth'
import { getSpaceStatus } from '../../domain/space/space'
import { getTotalDroneCount, timeUntilSwarmGift } from '../../domain/compute/swarm'

export interface InfoRowViewModel {
  label: string
  value: string
}

export interface StatChipViewModel {
  label: string
  value: string
}

export type SwarmStatus = 'Sleeping' | 'No response' | 'No drones' | 'Lonely' | 'Active' | 'Bored' | 'Disorganized'

function getDroneStatus(state: GameState): SwarmStatus {
  if (state.compute.disorgFlag) return 'Disorganized'
  if (state.compute.boredomFlag) return 'Bored'
  if (getTotalDroneCount(state) === 1) return 'Lonely'
  if (getTotalDroneCount(state) === 0) return 'No drones'
  if (state.earth.spaceFlag && !state.projects.project130) return 'No response'
  if (state.earth.powMod === 0 || !state.compute.swarmFlag) return 'Sleeping'
  return 'Active'
}

function getUiVisibility(state: GameState) {
  return {
    showCompute: state.compute.unlocked || state.compute.operations > 0 || state.compute.trust > 2,
    showInvestment: state.investment.unlocked,
    showStrategy: state.strategy.unlocked || state.projects.project118,
    showPostHuman: !state.earth.humanFlag || state.projects.project35 || state.earth.tothFlag,
    showSpace: state.earth.spaceFlag,
  }
}

function getEarthUnlocksLabel(state: GameState) {
  return `${state.earth.tothFlag ? 'Toth ' : ''}${state.earth.powerGridFlag ? 'Grid ' : ''}${state.earth.wireProductionFlag ? 'Wire ' : ''}${state.earth.harvesterFlag ? 'Harvester ' : ''}${state.earth.wireDroneFlag ? 'Drone ' : ''}${state.earth.factoryFlag ? 'Factory' : ''}`.trim() || 'None'
}

function getEarthModeLabel(state: GameState) {
  if (state.earth.spaceFlag) {
    return 'Space transition'
  }

  return state.earth.humanFlag ? 'Human economy' : 'Post-human Earth'
}

function buildComputeRows(state: GameState): InfoRowViewModel[] {
  return [
    { label: 'Processors / Memory', value: `${formatNumber(state.compute.processors)} / ${formatNumber(state.compute.memory)}` },
    { label: 'Ops / Max', value: `${formatNumber(state.compute.operations)} / ${formatNumber(getMaxOps(state))}` },
    { label: 'Trust / Next', value: `${formatNumber(state.compute.trust)} / ${formatNumber(state.compute.nextTrust)}` },
    {
      label: 'Creativity',
      value: state.compute.creativityOn ? formatNumber(state.compute.creativity, state.compute.creativity >= 100 ? 0 : 2) : 'Locked',
    },
    { label: 'Yomi', value: formatNumber(state.strategy.yomi) },
  ]
}

function buildEarthRows(state: GameState): InfoRowViewModel[] {
  const earthPower = getEarthPowerStatus(state)

  return [
    { label: 'Mode', value: getEarthModeLabel(state) },
    { label: 'Matter / NanoWire', value: `${formatNumber(state.earth.availableMatter)} / ${formatNumber(state.earth.nanoWire)}` },
    { label: 'Acquired / Processed', value: `${formatNumber(state.earth.acquiredMatter)} / ${formatNumber(state.earth.processedMatter)}` },
    { label: 'Levels', value: `${formatNumber(state.earth.harvesterLevel)} / ${formatNumber(state.earth.wireDroneLevel)} / ${formatNumber(state.earth.factoryLevel)}` },
    { label: 'Power', value: `${formatNumber(earthPower.performancePercent)}% | ${formatNumber(earthPower.storedPower)} / ${formatNumber(earthPower.maxStoredPower)}` },
    { label: 'Unlocks', value: getEarthUnlocksLabel(state) },
  ]
}

function buildSpaceRows(state: GameState): InfoRowViewModel[] {
  const spaceStatus = getSpaceStatus(state)

  return [
    { label: 'Mode', value: 'Probe operations' },
    { label: 'Probes / Trust', value: `${formatNumber(state.space.probeCount)} / ${formatNumber(state.space.probeTrust)}` },
    { label: 'Speed / Exploration', value: `${formatNumber(state.space.probeSpeed)} / ${formatNumber(state.space.probeNav)}` },
    { label: 'Replication / Industry', value: `${formatNumber(state.space.probeRep)} / ${formatNumber(state.space.probeFac + state.space.probeHarv + state.space.probeWire)}` },
    { label: 'Exploration rate', value: formatNumber(spaceStatus.explorationRate) },
    { label: 'Hazard / Drift', value: `${formatNumber(spaceStatus.hazardLossRate, 4)} / ${formatNumber(spaceStatus.driftLossRate, 4)}` },
    { label: 'Losses / Drifters', value: `${formatNumber(state.space.probesLostHaz, 4)} / ${formatNumber(state.space.drifterCount, 4)}` },
    { label: 'Combat / Losses', value: `${spaceStatus.battleActive ? 'Active' : 'Idle'} / ${formatNumber(state.space.probesLostCombat, 4)}` },
    ...(state.projects.project121 ? [{ label: 'Honor / Bonus', value: `${formatNumber(state.space.honor, 2)} / ${formatNumber(state.space.bonusHonor, 2)}` }] : []),
    { label: 'Found matter', value: formatNumber(state.space.foundMatter) },
  ]
}

export function selectHeaderStats(state: GameState) {
  return {
    funds: formatCurrency(state.production.funds),
    inventory: formatNumber(state.production.clips),
    wire: formatWireAmount(state.production.wire),
    demand: `${formatNumber(state.economy.demand)}%`,
    paused: state.paused,
    phase: state.phase,
  }
}

export function selectStallState(state: GameState) {
  return getStallState(state)
}

export function selectHeaderViewModel(state: GameState, demand: string, phaseLabel: string) {
  return {
    stats: [
      { label: 'Funds', value: formatCurrency(state.production.funds) },
      { label: 'Inventory', value: formatNumber(state.production.unsoldClips) },
      { label: 'Wire', value: formatWireAmount(state.production.wire) },
      { label: 'Demand', value: demand },
      { label: 'Trust', value: formatNumber(state.compute.trust) },
      { label: 'Earth', value: state.earth.spaceFlag ? 'Space' : state.earth.humanFlag ? 'Human' : 'Post-human' },
      { label: 'Phase', value: phaseLabel },
      { label: 'State', value: state.paused ? 'Paused' : 'Running' },
    ],
  }
}

export function selectOverviewScreenViewModel(
  state: GameState,
  clipPrice: string,
  wireSpoolBatches: readonly [1, 5],
  wireBatchCosts: Record<1 | 5, number>,
) {
  return {
    manualDisabled: !state.earth.humanFlag,
    manualNote: state.earth.humanFlag ? undefined : 'Manual business controls are offline after the HypnoDrone release.',
    wireDescription: `Wire is now bought by spool. Each purchase adds ${formatWireAmount(state.economy.wireSupply)} for ${formatCurrency(state.economy.wireCost)}.`,
    wirePrimaryLabel: `Buy ${formatNumber(wireSpoolBatches[0])} spool`,
    wirePrimaryTooltip: `Buy ${formatWireAmount(state.economy.wireSupply * wireSpoolBatches[0])} for ${formatCurrency(wireBatchCosts[wireSpoolBatches[0]])}.`,
    wireSecondaryLabel: `Buy ${formatNumber(wireSpoolBatches[1])} spools`,
    wireSecondaryTooltip: `Buy ${formatWireAmount(state.economy.wireSupply * wireSpoolBatches[1])} for ${formatCurrency(wireBatchCosts[wireSpoolBatches[1]])}.`,
    wireDisabled: !state.earth.humanFlag,
    wireNote: `Original-style baseline: ${formatWireAmount(WIRE_BATCH_UNIT)} per spool, current market price ${formatCurrency(state.economy.wireCost)}.`,
    priceDescription: 'Lower price for demand. Raise price for revenue.',
    clipPriceLabel: `Current ${clipPrice}`,
  }
}

export function selectWatchWindowViewModel(state: GameState) {
  const visibility = getUiVisibility(state)

  return {
    ...visibility,
    businessRows: [
      { label: 'Funds', value: formatCurrency(state.production.funds) },
      { label: 'Unsold clips', value: formatNumber(state.production.unsoldClips) },
      { label: 'Clip price', value: formatCurrency(state.economy.clipPrice) },
      { label: 'Demand', value: `${formatNumber(state.economy.demand * 10)}%` },
      { label: 'Wire stock', value: formatWireAmount(state.production.wire) },
    ],
    computeRows: buildComputeRows(state),
    earthRows: buildEarthRows(state),
    spaceRows: buildSpaceRows(state),
    focusChips: [
      { label: 'Phase', value: state.phase },
      { label: 'Run state', value: state.paused ? 'Paused' : 'Active' },
      { label: 'Projects', value: getProjectProgress(state) },
      { label: 'Strategy', value: getSelectedStrategyLabel(state) },
    ],
  }
}

export function selectStatusSidebarViewModel(state: GameState, tickMs: number, clipPrice: string, demand: string, activeTab: string) {
  const visibility = getUiVisibility(state)
  const earthPower = getEarthPowerStatus(state)
  const spaceStatus = getSpaceStatus(state)
  const compactOverview = activeTab === 'overview'
  const primaryRows: InfoRowViewModel[] = [
    { label: 'Last action', value: state.lastAction },
    { label: 'Tick', value: `${tickMs / 1000}s` },
    { label: 'Available funds', value: formatCurrency(state.production.funds) },
    { label: 'Unsold inventory', value: formatNumber(state.production.unsoldClips) },
    { label: 'Price per clip', value: clipPrice },
    { label: `Wire (${WIRE_UNIT_LABEL})`, value: formatNumber(state.production.wire) },
    { label: 'Public demand', value: demand },
    { label: 'Revenue', value: formatCurrency(state.lastTickRevenue) },
  ]

  const detailRows: InfoRowViewModel[] = [
    { label: 'Wire spool size', value: formatWireAmount(state.economy.wireSupply) },
    { label: 'Ad cost', value: formatCurrency(state.economy.adCost) },
    ...(visibility.showPostHuman
      ? [
          { label: 'Earth mode', value: state.earth.spaceFlag ? 'Space transition' : 'Post-human' },
          { label: 'Matter / NanoWire', value: `${formatNumber(state.earth.availableMatter)} / ${formatNumber(state.earth.nanoWire)}` },
          { label: 'Acquired / Processed', value: `${formatNumber(state.earth.acquiredMatter)} / ${formatNumber(state.earth.processedMatter)}` },
          { label: 'Earth levels', value: `${formatNumber(state.earth.harvesterLevel)} / ${formatNumber(state.earth.wireDroneLevel)} / ${formatNumber(state.earth.factoryLevel)}` },
          { label: 'Earth power', value: `${formatNumber(earthPower.performancePercent)}% | ${formatNumber(earthPower.storedPower)} / ${formatNumber(earthPower.maxStoredPower)}` },
          { label: 'Earth unlocks', value: getEarthUnlocksLabel(state) },
        ]
      : []),
    ...(visibility.showSpace
      ? [
          { label: 'Probes / Trust', value: `${formatNumber(state.space.probeCount)} / ${formatNumber(state.space.probeTrust)}` },
          { label: 'Probe stats', value: `${formatNumber(state.space.probeSpeed)} / ${formatNumber(state.space.probeNav)} / ${formatNumber(state.space.probeRep)}` },
          { label: 'Probe industry', value: `${formatNumber(state.space.probeFac)} / ${formatNumber(state.space.probeHarv)} / ${formatNumber(state.space.probeWire)}` },
          { label: 'Exploration rate', value: formatNumber(spaceStatus.explorationRate) },
          { label: 'Hazard / Drift', value: `${formatNumber(spaceStatus.hazardLossRate, 4)} / ${formatNumber(spaceStatus.driftLossRate, 4)}` },
          { label: 'Probe losses', value: `${formatNumber(state.space.probesLostHaz, 4)} / ${formatNumber(state.space.probesLostDrift, 4)}` },
          { label: 'Combat', value: `${spaceStatus.battleActive ? 'Active' : 'Idle'} / ${formatNumber(state.space.probesLostCombat, 4)}` },
          ...(state.projects.project121 ? [{ label: 'Honor / Bonus', value: `${formatNumber(state.space.honor, 2)} / ${formatNumber(state.space.bonusHonor, 2)}` }] : []),
          { label: 'Found matter', value: formatNumber(state.space.foundMatter) },
        ]
      : []),
    ...(visibility.showInvestment
      ? [
          { label: 'Bankroll / Portfolio', value: `${formatCurrency(state.investment.bankroll)} / ${formatCurrency(state.investment.portTotal)}` },
          { label: 'Risk / Threshold', value: `${state.investment.riskMode} / ${formatNumber(state.investment.stockGainThreshold, 2)}` },
        ]
      : []),
    ...(visibility.showCompute ? buildComputeRows(state) : []),
    ...(visibility.showStrategy
      ? [
          { label: 'Yomi / Tournament', value: `${formatNumber(state.strategy.yomi)} / ${formatNumber(state.strategy.tourneyCost)}` },
          { label: 'Selected strategy', value: getSelectedStrategyLabel(state) },
        ]
      : []),
  ]

  return {
    ...visibility,
    statusRows: compactOverview ? primaryRows : [...primaryRows, ...detailRows],
    compactOverview,
  }
}

export function selectIndustryScreenViewModel(state: GameState, demand: string) {
  const visibility = getUiVisibility(state)
  const earthPower = getEarthPowerStatus(state)
  const showEarthProduction = visibility.showPostHuman && (state.earth.harvesterFlag || state.earth.wireDroneFlag || state.earth.factoryFlag)
  const showPowerGrid = visibility.showPostHuman && state.earth.powerGridFlag
  const computeNoteUnlocked = [
    `Proc ${formatNumber(state.compute.processors)}`,
    `Mem ${formatNumber(state.compute.memory)}`,
    `Max Ops ${formatNumber(getMaxOps(state))}`,
    ...(state.earth.humanFlag ? [`Next Trust ${formatNumber(state.compute.nextTrust)}`] : []),
    ...(state.compute.swarmGifts > 0 ? [`Swarm Gifts ${formatNumber(state.compute.swarmGifts)}`] : []),
  ].join(' | ')
  const droneCount = getTotalDroneCount(state)

  return {
    ...visibility,
    showEarthProduction,
    showPowerGrid,
    showSwarmComputing: state.compute.swarmFlag && droneCount > 0,
    droneCount,
    swarmStatus: getDroneStatus(state),
    canEntertain: state.compute.creativity >= state.compute.entertainCost,
    entertainCostNote: `Creativity ${formatNumber(state.compute.creativity)} | Cost ${formatNumber(state.compute.entertainCost)} creativity`,
    canSynchronize: state.strategy.yomi >= state.compute.synchCost,
    synchronizeCostNote: `Yomi ${formatNumber(state.strategy.yomi)} | Cost ${formatNumber(state.compute.synchCost)} yomi`,
    timeUntilSwarmGift: timeUntilSwarmGift(state),
    automationNote: `AutoClipper cost ${formatCurrency(state.production.autoClipperCost)}. MegaClipper ${state.projects.project22 ? formatCurrency(state.production.megaClipperCost) : 'locked'}.`,
    marketingNote: `Current level ${formatNumber(state.production.marketingLevel)}. Next ad cost ${formatCurrency(state.economy.adCost)}.`,
    transitionRows: [
      { label: 'Civilization', value: getEarthModeLabel(state) },
      { label: 'Available matter', value: formatNumber(state.earth.availableMatter) },
      { label: 'NanoWire', value: formatNumber(state.earth.nanoWire) },
      { label: 'Toth', value: state.earth.tothFlag ? 'Online' : 'Locked' },
      { label: 'Power grid', value: state.earth.powerGridFlag ? 'Online' : 'Locked' },
      { label: 'Power performance', value: `${formatNumber(earthPower.performancePercent)}%` },
      { label: 'Wire production', value: state.earth.wireProductionFlag ? 'Online' : 'Locked' },
      { label: 'Harvesters / Wire drones / Factories', value: `${state.earth.harvesterFlag ? 'On' : 'Off'} / ${state.earth.wireDroneFlag ? 'On' : 'Off'} / ${state.earth.factoryFlag ? 'On' : 'Off'}` },
      { label: 'Levels', value: `${formatNumber(state.earth.harvesterLevel)} / ${formatNumber(state.earth.wireDroneLevel)} / ${formatNumber(state.earth.factoryLevel)}` },
      { label: 'Acquired matter', value: formatNumber(state.earth.acquiredMatter) },
    ],
    earthProductionNote: state.earth.humanFlag
      ? 'Release the HypnoDrones first.'
      : `Unused clips ${formatNumber(state.production.unusedClips)} | Costs ${formatNumber(state.earth.harvesterCost)} / ${formatNumber(state.earth.wireDroneCost)} / ${formatNumber(state.earth.factoryCost)}`,
    powerRows: [
      { label: 'Performance', value: `${formatNumber(earthPower.performancePercent)}%` },
      { label: 'Production / Consumption', value: `${formatNumber(earthPower.powerProductionRate)} / ${formatNumber(earthPower.powerConsumptionRate)} MWs` },
      { label: 'Factories / Drones', value: `${formatNumber(earthPower.factoryPowerConsumptionRate)} / ${formatNumber(earthPower.dronePowerConsumptionRate)} MWs` },
      { label: 'Stored power', value: `${formatNumber(earthPower.storedPower)} / ${formatNumber(earthPower.maxStoredPower)} MW-seconds` },
      { label: 'Farms / Batteries', value: `${formatNumber(state.earth.farmLevel)} / ${formatNumber(state.earth.batteryLevel)}` },
    ],
    powerNote: state.earth.humanFlag
      ? 'Power systems appear after the post-human transition.'
      : `Costs ${formatNumber(state.earth.farmCost)} / ${formatNumber(state.earth.batteryCost)} clips`,
    computeNote: state.compute.unlocked ? computeNoteUnlocked : 'Locked until 2,000 clips or a no-wire/no-cash stall, like the original.',
    pricingNote: `Public demand is currently ${demand}.`,
    creativityNote: state.compute.creativityOn
      ? `Creativity ${formatNumber(state.compute.creativity, state.compute.creativity >= 100 ? 0 : 2)}`
      : `Requires the Creativity project. Current ops: ${formatNumber(state.compute.operations)}.`,
    investmentNote: state.investment.unlocked
      ? `Bankroll ${formatCurrency(state.investment.bankroll)} | Portfolio ${formatCurrency(state.investment.portTotal)} | Upgrade ${formatNumber(state.investment.investUpgradeCost)} yomi`
      : 'Unlock Algorithmic Trading through projects once trust reaches 8.',
    strategyNote: state.strategy.unlocked
      ? `Yomi ${formatNumber(state.strategy.yomi)} | Cost ${formatNumber(state.strategy.tourneyCost)} ops | Strategies ${formatNumber(state.strategy.strategies.length)}`
      : 'Unlock Strategic Modeling through projects after Donkey Space.',
    selectedStrategyLabel: getSelectedStrategyLabel(state),
  }
}

export function selectSpaceScreenViewModel(state: GameState) {
  const spaceStatus = getSpaceStatus(state)

  return {
    spaceUnlocked: state.earth.spaceFlag,
    availableProbeTrust: spaceStatus.availableProbeTrust,
    summaryRows: [
      { label: 'Transition', value: state.earth.spaceFlag ? 'Space phase active' : 'Post-human Earth' },
      { label: 'Available matter', value: formatNumber(state.earth.availableMatter) },
      { label: 'Stored power', value: formatNumber(state.earth.storedPower) },
      { label: 'Unused clips', value: formatNumber(state.production.unusedClips) },
      { label: 'Solar farms', value: formatNumber(state.earth.farmLevel) },
      { label: 'NanoWire', value: formatNumber(state.earth.nanoWire) },
    ],
    programRows: [
      { label: 'Probe count', value: formatNumber(state.space.probeCount) },
      { label: 'Probe launches', value: formatNumber(state.space.probeLaunchLevel) },
      { label: 'Descendents', value: formatNumber(state.space.probeDescendents) },
      { label: 'Probe trust', value: `${formatNumber(state.space.probeTrust)} / ${formatNumber(state.space.maxTrust)}` },
      { label: 'Unassigned trust', value: formatNumber(spaceStatus.availableProbeTrust) },
      { label: 'Speed / Exploration', value: `${formatNumber(state.space.probeSpeed)} / ${formatNumber(state.space.probeNav)}` },
      { label: 'Replication / Factory', value: `${formatNumber(state.space.probeRep)} / ${formatNumber(state.space.probeFac)}` },
      { label: 'Harvester / Wire', value: `${formatNumber(state.space.probeHarv)} / ${formatNumber(state.space.probeWire)}` },
      { label: 'Combat trust', value: formatNumber(state.space.probeCombat) },
      { label: 'Trust cost', value: `${formatNumber(state.space.probeTrustCost)} yomi` },
      { label: 'Probe cost', value: `${formatNumber(state.space.probeCost)} clips` },
      { label: 'Exploration rate', value: `${formatNumber(spaceStatus.explorationRate)} matter / tick` },
      { label: 'Replication rate', value: `${formatNumber(spaceStatus.replicationRate, 4)} probes / tick` },
      { label: 'Hazard loss rate', value: `${formatNumber(spaceStatus.hazardLossRate, 4)} probes / tick` },
      { label: 'Drift loss rate', value: `${formatNumber(spaceStatus.driftLossRate, 4)} probes / tick` },
      { label: 'Battle status', value: spaceStatus.battleActive ? 'Active engagement' : 'No engagement' },
      { label: 'Combat losses', value: formatNumber(state.space.probesLostCombat, 4) },
      { label: 'Factory spawn rate', value: `${formatNumber(spaceStatus.factorySpawnRate, 4)} / tick` },
      { label: 'Harvester spawn rate', value: `${formatNumber(spaceStatus.harvesterSpawnRate, 4)} / tick` },
      { label: 'Wire drone spawn rate', value: `${formatNumber(spaceStatus.wireDroneSpawnRate, 4)} / tick` },
      { label: 'Matter discovered', value: formatNumber(state.space.foundMatter) },
      { label: 'Lost to hazards', value: formatNumber(state.space.probesLostHaz, 4) },
      { label: 'Lost to drift', value: formatNumber(state.space.probesLostDrift, 4) },
      { label: 'Drifters', value: formatNumber(state.space.drifterCount, 4) },
      { label: 'Universe explored', value: `${formatNumber(spaceStatus.exploredPercent, 12)}%` },
    ],
    note: state.earth.spaceFlag
      ? 'Original behavior: launch cost is fixed, exploration needs both Speed and Exploration, hazards strike before probe-built industry, drift happens after self-replication, battles can begin before Combat is unlocked, and drifters only start dying once probe trust is allocated into Combat.'
      : 'Complete Space Exploration first to bring the probe program online.',
  }
}

export function selectCombatScreenViewModel(state: GameState) {
  const activeBattle = state.space.activeBattle
  const availableProbeTrust = Math.max(0, state.space.probeTrust - state.space.probeUsedTrust)

  return {
    combatUnlocked: state.projects.project131,
    honorUnlocked: state.projects.project121,
    availableProbeTrust,
    statusRows: [
      { label: 'Combat project', value: state.projects.project131 ? 'Unlocked' : 'Locked' },
      { label: 'Honor layer', value: state.projects.project121 ? 'Unlocked' : 'Locked' },
      { label: 'Battle status', value: activeBattle ? 'Active engagement' : 'No engagement' },
      { label: 'Probe combat trust', value: formatNumber(state.space.probeCombat) },
      { label: 'Unassigned trust', value: formatNumber(availableProbeTrust) },
      { label: 'Combat losses', value: formatNumber(state.space.probesLostCombat, 4) },
      { label: 'Drifters', value: formatNumber(state.space.drifterCount, 4) },
      { label: 'Honor', value: formatNumber(state.space.honor, 2) },
      { label: 'Max trust', value: `${formatNumber(state.space.maxTrust)} / ${formatNumber(state.space.maxTrustCost, 2)} honor` },
    ],
    telemetryRows: [
      { label: 'Battle name', value: activeBattle?.name ?? 'None' },
      { label: 'Battle id', value: activeBattle ? formatNumber(activeBattle.id) : 'None' },
      { label: 'Unit size', value: activeBattle ? formatNumber(activeBattle.unitSize, 4) : '0' },
      { label: 'Clip probe force', value: activeBattle ? formatNumber(activeBattle.clipProbes, 4) : '0' },
      { label: 'Drifter force', value: activeBattle ? formatNumber(activeBattle.drifterProbes, 4) : '0' },
      { label: 'Starting ships', value: activeBattle ? `${formatNumber(activeBattle.startingLeftShips)} / ${formatNumber(activeBattle.startingRightShips)}` : '0 / 0' },
      { label: 'Left / Right ships', value: activeBattle ? `${formatNumber(activeBattle.leftShips)} / ${formatNumber(activeBattle.rightShips)}` : '0 / 0' },
      { label: 'Battle clock', value: activeBattle ? `${formatNumber(activeBattle.battleClock)} / ${formatNumber(activeBattle.masterBattleClock)}` : '0 / 0' },
      { label: 'End delay', value: activeBattle ? `${activeBattle.battleEndDelay ? 'Active' : 'Idle'} / ${formatNumber(activeBattle.battleEndTimer)}` : 'Idle / 0' },
      { label: 'Territory', value: activeBattle ? formatNumber(activeBattle.territory, 4) : '0' },
      { label: 'OODA / Naming', value: `${state.projects.project120 ? 'On' : 'Off'} / ${state.space.battleNameFlag ? 'On' : 'Off'}` },
      { label: 'Honor reward / Bonus', value: `${formatNumber(state.space.honorReward, 2)} / ${formatNumber(state.space.bonusHonor, 2)}` },
      { label: 'Threnody', value: `${state.space.threnodyTitle} / ${formatNumber(state.space.threnodyCost)} creat` },
    ],
    note: state.projects.project131
      ? 'Current parity slice: battles can begin before Combat unlocks, drifters only die after Combat trust is allocated, OODA raises probe survival via speed, and honor starts once Name the Battles is complete.'
      : 'Unlock Combat first to allocate probe trust into battle capability.',
  }
}
