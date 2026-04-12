# Paperclips Remake

A React + TypeScript remake of *Universal Paperclips*, focused on clear gameplay UI and parity-friendly architecture.

## Development

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm test
pnpm build
pnpm lint
```

## Project Structure

- `src/domain` - core game rules and state
- `src/application` - orchestration, selectors, and persistence
- `src/ui` - screens, layout, and shared UI primitives
- `docs/README.md` - project notes and planning docs
- `docs/labels.md` - suggested GitHub labels

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

## Credits

This project is an unofficial fan remake of *Universal Paperclips* by Frank Lantz. The original game and its concept were created by Frank Lantz, Chair of the NYU Game Center. His professional site is [franklantz.net](http://www.franklantz.net).

The code in this repository is a non-commercial portfolio exercise with a custom UI/UX layer built from scratch. Core game logic, pacing, and mathematical behavior were reconstructed from the original web release at [decisionproblem.com/paperclips/](https://decisionproblem.com/paperclips/).

If you enjoy the game, please support the original creator by using the official versions linked in the app's About / Credits panel.

## Project Docs

- [`CHANGELOG.md`](CHANGELOG.md)
- [`docs/README.md`](docs/README.md)
- [`docs/labels.md`](docs/labels.md)
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
- [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md)

## License

See [`LICENSE`](LICENSE).
