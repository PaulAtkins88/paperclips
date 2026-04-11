export function createSeededRng(sequence: number[]): () => number {
  let index = 0

  return () => {
    const value = sequence[index] ?? sequence[sequence.length - 1] ?? 0
    index += 1
    return value
  }
}
