const CLIP_PRICE_MIN = 0.01

export function normalizeClipPrice(price: number): number {
  const rounded = Math.round(price * 100) / 100
  return Math.max(CLIP_PRICE_MIN, rounded)
}

export function computeMarketingMultiplier(marketingLevel: number): number {
  return 1.1 ** Math.max(0, marketingLevel - 1)
}

export function computeDemand(params: {
  clipPrice: number
  marketingLevel: number
  marketingEffectiveness: number
  demandBoost: number
}): number {
  const marketing = computeMarketingMultiplier(params.marketingLevel)
  return ((0.8 / params.clipPrice) * marketing * params.marketingEffectiveness) * params.demandBoost
}

export function formatDisplayedDemand(demand: number): number {
  return demand * 10
}
