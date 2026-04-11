export const INITIAL_WIRE_COST = 20
const INITIAL_WIRE_BASE_PRICE = 20

export function createInitialWireMarket() {
  return {
    wireCost: INITIAL_WIRE_COST,
    wireBasePrice: INITIAL_WIRE_BASE_PRICE,
    wirePriceCounter: 0,
    wirePriceTimer: 0,
  }
}

export function updateWirePrice(params: {
  wireBasePrice: number
  wireCost: number
  wirePriceCounter: number
  wirePriceTimer: number
  roll: number
}) {
  let wireBasePrice = params.wireBasePrice
  let wirePriceCounter = params.wirePriceCounter
  let wirePriceTimer = params.wirePriceTimer + 1
  let wireCost = params.wireCost

  if (wirePriceTimer > 250 && wireBasePrice > 15) {
    wireBasePrice -= wireBasePrice / 1000
    wirePriceTimer = 0
  }

  if (params.roll < 0.015) {
    wirePriceCounter += 1
    wireCost = Math.ceil(wireBasePrice + (6 * Math.sin(wirePriceCounter)))
  }

  return {
    wireBasePrice,
    wireCost,
    wirePriceCounter,
    wirePriceTimer,
  }
}

export function applyWirePurchase(wireBasePrice: number): number {
  return wireBasePrice + 0.05
}
