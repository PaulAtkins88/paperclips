export interface StoragePort<TState> {
  load(): TState | null
  save(state: TState): void
}
