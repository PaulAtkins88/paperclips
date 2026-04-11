# Maintainer Notes

Keep subsystem explanations close to the code they describe. The original game relied heavily on inline UI text and labels to explain mechanics, so this remake should keep developer notes near the domain and selector layers rather than only in the UI.

## High-Complexity Areas

- `domain/space/space.ts`: probe exploration, drift, hazards, and combat are tightly coupled. Changes here should be tested together.
- `domain/earth/earth.ts`: power, matter, and post-human production all feed each other. Power math is easy to break.
- `domain/projects/projectRegistry.ts`: project visibility, costs, unlock effects, and repeatable actions all live here today.
- `domain/game.ts`: this is the current orchestration reducer and state factory. It is still a temporary scaffold and should stay split by subsystem as parity work continues.

## Documentation Rule

- Prefer short notes that explain why a rule exists.
- Document non-obvious thresholds, caps, and one-way transitions.
- If a system has a parity quirk, document it where the rule is implemented.
