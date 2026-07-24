# Contributing

Thanks for helping improve Paperclips Remake.

## Workflow

1. Create a branch for your change.
2. Keep changes focused and small.
3. Run `pnpm test`, `pnpm build`, and `pnpm lint` before opening a pull request.
4. If your change is user-facing, add a bullet under `## Unreleased` in `CHANGELOG.md`.

## Style

- Use TypeScript.
- Match the existing UI and domain patterns.
- Prefer small, readable components and pure game logic.

## Pull Requests

- Explain the user-facing change.
- Call out any follow-up work.
- Include screenshots for UI changes when relevant.

## Releases

Maintainers own versioning. At release time we bump the `version` in `package.json` and move the `## Unreleased` entries in `CHANGELOG.md` under a new version heading. You do not need to change the version number in a pull request.

## IP Questions

Direct any IP-related inquiries to frank.lantz@nyu.edu.
