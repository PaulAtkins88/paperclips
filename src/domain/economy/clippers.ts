export const AUTO_CLIPPER_BASE_COST = 5
export const INITIAL_MEGA_CLIPPER_COST = 500
export const DEFAULT_CLIPPER_BOOST = 1
export const DEFAULT_MEGA_CLIPPER_BOOST = 1

export function computeAutoClipperCost(level: number): number {
  return (1.1 ** level) + AUTO_CLIPPER_BASE_COST
}

export function computeMegaClipperCost(level: number): number {
  return (1.07 ** level) * 1000
}

export function computeAutoClipperProduction(level: number, clipperBoost: number, seconds: number): number {
  return clipperBoost * level * seconds
}

export function computeMegaClipperProduction(level: number, megaClipperBoost: number, seconds: number): number {
  return megaClipperBoost * level * 500 * seconds
}
