import { describe, expect, it } from 'vitest'
import { exportGame, importGame } from '../application/save/storage'
import { GAME_VERSION, createInitialGameState } from '../domain/game'

/**
 * Project state changed from `Record<ProjectId, boolean>` to
 * `Record<ProjectId, { triggered, completed }>`. Saves written before that change are
 * still in players' browsers, so loading one must preserve project progress rather than
 * silently reading every project back as incomplete.
 */
describe('save migration', () => {
  const legacySave = (projects: Record<string, boolean>) =>
    JSON.stringify({
      version: 10,
      production: { ...createInitialGameState().production, clips: 5_000 },
      projects,
    })

  it('preserves completed projects when loading a pre-migration save', () => {
    const loaded = importGame(legacySave({ project1: true, project22: true, project50: true }))

    expect(loaded).not.toBeNull()
    expect(loaded!.projects.project1).toEqual({ triggered: true, completed: true })
    expect(loaded!.projects.project22).toEqual({ triggered: true, completed: true })
    expect(loaded!.projects.project50).toEqual({ triggered: true, completed: true })
  })

  it('does not mark unfinished projects complete when loading a pre-migration save', () => {
    const loaded = importGame(legacySave({ project1: true, project22: false }))

    expect(loaded!.projects.project22).toEqual({ triggered: false, completed: false })
  })

  it('fills in projects the legacy save never knew about', () => {
    const loaded = importGame(legacySave({ project1: true }))

    // project102 was added after the legacy save was written.
    expect(loaded!.projects.project102).toEqual({ triggered: false, completed: false })
  })

  it('keeps the rest of a legacy save intact', () => {
    const loaded = importGame(legacySave({ project1: true }))

    expect(loaded!.production.clips).toBe(5_000)
    expect(loaded!.version).toBe(GAME_VERSION)
  })

  it('round-trips a current-version save unchanged', () => {
    const state = createInitialGameState()
    state.projects.project1 = { triggered: true, completed: true }
    state.projects.project2 = { triggered: true, completed: false }

    const loaded = importGame(exportGame(state))

    expect(loaded!.projects.project1).toEqual({ triggered: true, completed: true })
    expect(loaded!.projects.project2).toEqual({ triggered: true, completed: false })
  })

  it('rejects a save from an unrecognised version', () => {
    expect(importGame(JSON.stringify({ version: 9, projects: {} }))).toBeNull()
    expect(importGame(JSON.stringify({ version: 99, projects: {} }))).toBeNull()
  })
})
