export function computeSaleQuantity(demand: number): number {
  return Math.floor(0.7 * (demand ** 1.15))
}

export function shouldSell(demand: number, roll: number): boolean {
  return roll < (demand / 100)
}

export function truncateCurrency(value: number): number {
  return Math.floor(value * 1000) / 1000
}
