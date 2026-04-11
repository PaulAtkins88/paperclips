import type { GameState } from '../game'
import { computeAutoClipperCost, computeAutoClipperProduction, computeMegaClipperCost, computeMegaClipperProduction } from './clippers'
import { computeDemand, normalizeClipPrice } from './pricing'
import { computeSaleQuantity, shouldSell, truncateCurrency } from './sales'
import { applyWirePurchase, updateWirePrice } from './wireMarket'

const SLOW_TICK_MS = 100

export function syncEarlyEconomyState(state: GameState): GameState {
  const demand = computeDemand({
    clipPrice: state.economy.clipPrice,
    marketingLevel: state.production.marketingLevel,
    marketingEffectiveness: state.economy.marketingEffectiveness,
    demandBoost: state.economy.demandBoost,
  })

  return {
    ...state,
    production: {
      ...state.production,
      autoClipperCost: computeAutoClipperCost(state.production.autoClippers),
      megaClipperCost: computeMegaClipperCost(state.production.megaClippers),
    },
    economy: {
      ...state.economy,
      clipPrice: normalizeClipPrice(state.economy.clipPrice),
      demand,
      wirePrice: state.economy.wireCost / 1000,
    },
  }
}

export function runEarlyEconomyTick(state: GameState, deltaMs: number, random: () => number): GameState {
  let synced = syncEarlyEconomyState(state)

  if (synced.earth.humanFlag && synced.projects.project26 && synced.production.wire < 1 && synced.production.funds >= synced.economy.wireCost) {
    synced = syncEarlyEconomyState(applyWirePurchaseToEconomy(synced, 1))
  }

  if (synced.paused) {
    return synced
  }

  const seconds = deltaMs / 1000
  const autoProduced = synced.earth.humanFlag
    ? computeAutoClipperProduction(synced.production.autoClippers, synced.economy.clipperBoost, seconds)
    : 0
  const megaProduced = synced.earth.humanFlag
    ? computeMegaClipperProduction(synced.production.megaClippers, synced.economy.megaClipperBoost, seconds)
    : 0
  const requestedProduction = autoProduced + megaProduced
  const producedClips = Math.min(requestedProduction, synced.production.wire)

  let next: GameState = {
    ...synced,
    elapsedMs: synced.elapsedMs + deltaMs,
    production: {
      ...synced.production,
      clips: synced.production.clips + producedClips,
      unsoldClips: synced.production.unsoldClips + producedClips,
      unusedClips: synced.production.unusedClips + producedClips,
      wire: synced.production.wire - producedClips,
    },
    lastTickProduction: producedClips,
    lastTickSales: 0,
    lastTickRevenue: 0,
  }

  const slowTicks = Math.max(1, Math.floor(deltaMs / SLOW_TICK_MS))
  let soldClips = 0
  let revenue = 0

  for (let index = 0; index < slowTicks; index += 1) {
    const wireUpdate = updateWirePrice({
      wireBasePrice: next.economy.wireBasePrice,
      wireCost: next.economy.wireCost,
      wirePriceCounter: next.economy.wirePriceCounter,
      wirePriceTimer: next.economy.wirePriceTimer,
      roll: random(),
    })

    next = {
      ...next,
      economy: {
        ...next.economy,
        ...wireUpdate,
        wirePrice: wireUpdate.wireCost / 1000,
      },
    }

    if (!next.earth.humanFlag || !shouldSell(next.economy.demand, random())) {
      continue
    }

    const amount = Math.min(next.production.unsoldClips, computeSaleQuantity(next.economy.demand))
    if (amount <= 0) {
      continue
    }

    const earned = truncateCurrency(amount * next.economy.clipPrice)
    soldClips += amount
    revenue += earned
    next = {
      ...next,
      production: {
        ...next.production,
        unsoldClips: next.production.unsoldClips - amount,
        funds: next.production.funds + earned,
      },
    }
  }

  return {
    ...next,
    lastTickSales: soldClips,
    lastTickRevenue: revenue,
    lastAction:
      producedClips > 0 || soldClips > 0
        ? `Produced ${formatActionNumber(producedClips)} clips, sold ${formatActionNumber(soldClips)}.`
        : 'Awaiting production',
  }
}

export function applyManualClipProduction(state: GameState, amount: number): GameState {
  const producedClips = Math.min(amount, state.production.wire)
  if (producedClips < 1) {
    return state
  }

  return {
    ...state,
    production: {
      ...state.production,
      clips: state.production.clips + producedClips,
      unsoldClips: state.production.unsoldClips + producedClips,
      unusedClips: state.production.unusedClips + producedClips,
      wire: state.production.wire - producedClips,
    },
    lastTickProduction: producedClips,
    lastTickSales: 0,
    lastTickRevenue: 0,
    lastAction: 'Manually made a clip',
  }
}

export function applyWirePurchaseToEconomy(state: GameState, amount: number): GameState {
  if (!state.earth.humanFlag) {
    return state
  }

  const spools = Math.max(1, Math.floor(amount))
  const cost = spools * state.economy.wireCost

  if (state.production.funds < cost) {
    return state
  }

  const wireBasePrice = applyWirePurchase(state.economy.wireBasePrice)

  return {
    ...state,
    production: {
      ...state.production,
      funds: state.production.funds - cost,
      wire: state.production.wire + (spools * state.economy.wireSupply),
    },
    wirePurchased: state.wirePurchased + spools,
    economy: {
      ...state.economy,
      wireBasePrice,
      wirePriceTimer: 0,
    },
    lastAction: `Bought ${formatActionNumber(spools)} wire spool${spools === 1 ? '' : 's'}`,
  }
}

function formatActionNumber(value: number): string {
  return value >= 100 ? `${Math.round(value)}` : `${Math.round(value * 100) / 100}`
}
