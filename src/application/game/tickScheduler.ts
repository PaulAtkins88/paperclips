export const DEFAULT_TICK_MS = 1000

export function startTickLoop(runTick: () => void, tickMs = DEFAULT_TICK_MS): () => void {
  const timer = window.setInterval(runTick, tickMs)
  return () => window.clearInterval(timer)
}
