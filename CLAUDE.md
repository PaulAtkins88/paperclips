# CLAUDE.md — Paperclips Remake

## Project

An unofficial, non-commercial React + TypeScript remake of *Universal Paperclips* (Frank Lantz, NYU Game Center).

**Goal:** Full rules-parity with the original game at [decisionproblem.com/paperclips/index2.html](https://www.decisionproblem.com/paperclips/index2.html).  
UX improvements are welcome. Game logic must not diverge from the original.

**Repo:** `PaulAtkins88/paperclips`  
**Deploy:** GitHub Pages from `main` via `.github/workflows/deploy-pages.yml`.

---

## Stack

| Concern | Tool |
|---|---|
| Language | TypeScript (no `strict` flag, but `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are on) |
| UI | React 19, Tailwind CSS 4 |
| 3D | `@react-three/fiber` + `@react-three/drei` |
| Build | Vite 8 |
| Package manager | pnpm (use only `pnpm`, never `npm` or `yarn`) |
| Test | Vitest |
| Lint | ESLint + `typescript-eslint` |

---

## Commands

```bash
pnpm dev      # dev server
pnpm test     # run tests (vitest)
pnpm build    # tsc + vite build
pnpm lint     # eslint
pnpm preview  # preview the build
```

All three checks — `pnpm test`, `pnpm build`, `pnpm lint` — must pass before opening a PR.

---

## Architecture

Three strict layers. **No cross-layer imports in the wrong direction.**

```
src/
  domain/          # Pure game rules, formulas, state transitions. NO React, NO DOM.
  application/     # Orchestration: commands, tick scheduling, save/load, selectors.
  ui/              # React components and screen composition only.
  app/             # Entry point, providers, bootstrap.
```

### Domain layer (`src/domain/`)

- All game logic lives here. Pure functions operating on `GameState`.
- Subsystems: `economy/`, `compute/`, `investments/`, `strategy/`, `earth/`, `space/`, `projects/`, `state/`.
- `domain/game.ts` is the orchestration reducer and state factory. Subsystem logic already lives in dedicated modules (`compute/`, `economy/`, `earth/`, `space/`, etc.) — `game.ts` delegates to them. Do not pull subsystem logic back into it.
- The current `GameState` type lives in `game.ts`. The target canonical shape is defined separately in `domain/state/gameState.ts` — migration toward that shape is ongoing.
- The domain must not import React or reference DOM APIs.
- When RNG is needed, accept an injected `() => number` rather than calling `Math.random()` directly, so tests can be deterministic. **Note:** `game.ts` currently violates this — `tick()` and the `runTournament` action both call `Math.random` directly. This is tracked in [Issue #11](https://github.com/PaulAtkins88/paperclips/issues/11).

### Application layer (`src/application/`)

- Owns tick scheduling (`tickScheduler.ts`), save/load (`save/`), and selectors (`game/selectors.ts`).
- `useGameController` wires the reducer, tick loop, and persistence together for React.

### UI layer (`src/ui/`)

- Screens, layout, and shared UI primitives.
- Components consume selectors or view-models — never encode game formulas directly.
- `ui/system.tsx` and `ui/classes.ts` are good reusable view primitives; keep them.

---

## Design Principles

- **SOLID** — single responsibility, open/closed, dependency inversion. Each domain file owns one concern.
- **DRY** — extract repeated logic into helpers immediately. Never duplicate a formula.
- **DDD** — use domain language from the original game (clips, unsoldClips, unusedClips, trust, yomi, honor, mwSeconds, etc.). Never rename domain concepts arbitrarily.
- **Good OOP** — prefer pure functions on plain data over stateful classes in the domain layer. Classes are fine in the application layer where they have genuine lifecycle.

---

## Game Parity Rules

1. **The original JS is the spec.** When in doubt, read `index2.html` source and mirror the math exactly.
2. **Document parity quirks** where the rule is implemented, not in a separate doc.
3. **Golden tests are required** before broad UI migration. See `src/test/golden/earlyEconomy.golden.test.ts` for the pattern.
4. **Don't guess thresholds** — verify against the original. Constants like `fibonacci trust thresholds`, `sale quantity curves`, `wire price deltas` must be sourced from the original.
5. Tick cadence must match the original: fast loop at `10ms`, slow loop at `100ms`. The current implementation runs a single loop at `1000ms` — that is a known gap, not the spec.

### Key domain invariants

- `clips` = total ever made; `unsoldClips` = in market; `unusedClips` = post-human matter budget.
- Compute unlocks at **2,000 clips** OR on a stall (no unsold clips, no funds, no wire) — whichever comes first. Trust increases on **Fibonacci thresholds**.
- `humanFlag = false` ends the human economy (clippers, marketing, manual production, investment all halt).
- Space unlocks when Earth matter is exhausted and `project46` is activated.

---

## GitHub Hygiene

### Branches

- `main` — deployable at all times. Merges via PR only.
- Create feature branches from `main`. No single naming convention is enforced — use conventional commit prefixes (`feat/`, `fix/`, `chore/`, `refactor/`) or a plain topic name.

### Pull Requests

Use `.github/PULL_REQUEST_TEMPLATE.md`:
- **Summary** — user-facing change description.
- **Validation checklist** — `pnpm test`, `pnpm build`, `pnpm lint` all ticked.
- **Notes** — screenshots for UI changes, follow-up items.
- Keep PRs focused and small. One logical change per PR.

### Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `ci:`, `chore:`.
- Message body explains *why*, not *what*.
- Co-authored commits include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`.

### Issues

Three templates live in `.github/ISSUE_TEMPLATE/`:
- `gameplay_bug_report.md` — progression, rule, or balance bugs.
- `ui_bug_report.md` — visual/interaction bugs.
- `feature_request.md` — enhancements.

Available labels: `bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`.

Labels guide: `docs/labels.md`.  
CODEOWNERS: `@PaulAtkins88` owns all files.

---

## Testing

- Test framework: **Vitest**.
- Golden parity tests in `src/test/golden/` — these verify formulas match the original game exactly.
- Use `createSeededRng` from `src/test/fixtures/seeded-rng.ts` for any test that involves probabilistic behavior.
- Never mock domain functions in tests — call the real domain functions with controlled inputs.
- Tests call domain functions directly; they do not render React components.

---

## What Is Complete / In Progress

### Done (parity-verified)
- Early economy: demand, sales, wire market, pricing, auto-clippers, mega-clippers, marketing
- Compute: trust unlock, Fibonacci thresholds, processors, memory, operations, creativity
- Investments: deposit/withdraw/upgrade, stock shop, risk modes
- Strategy/tournaments: yomi, strategy selection, auto-tournament
- Projects: visibility, cost, one-shot and repeatable (beg-for-wire pattern)
- Earth post-human: matter, harvesters, wire drones, factories, solar farms, batteries, power grid, momentum
- Swarm Computing: gift accumulation, boredom, disorganization, work/think slider
- Space: probes, trust, exploration, replication, drift, hazards, combat, honor, threnody, OODA, named battles

### Known gaps (parity not yet achieved)
- Tick cadence: currently `1000ms`, must reach `10ms`/`100ms` to match original
- Full canonical `GameState` migration (current state still uses prototype shape — see `src/domain/state/gameState.ts`)
- Prestige / endgame systems
- Full UI screen migration to selectors/view-models (Phase 8)
- Stall detection (`getStallState` in `game.ts`) — implemented but not yet surfaced in the UI
- RNG injection in `game.ts` tick path (tracked in [Issue #11](https://github.com/PaulAtkins88/paperclips/issues/11))

---

## File Map (key files)

| File | Purpose |
|---|---|
| `src/domain/game.ts` | Root reducer, `GameState` type, `GameAction` union, initial state factory |
| `src/domain/state/gameState.ts` | Canonical target state shape (work in progress) |
| `src/domain/projects/projectRegistry.ts` | All project definitions (visibility, cost, effect) |
| `src/application/game/useGameController.ts` | Tick loop + persistence wired into React |
| `src/application/save/` | LocalStorage serialization / hydration |
| `src/test/golden/earlyEconomy.golden.test.ts` | Golden parity test suite |
| `docs/parity-rebuild-plan.md` | Full architectural target and delivery phases |
| `docs/maintainer-notes.md` | High-complexity subsystem warnings |

---

## IP & Attribution

- Original game © Frank Lantz. Non-commercial fan remake only.
- Do not alter attribution or credits in the About modal.
- IP inquiries: frank.lantz@nyu.edu.
