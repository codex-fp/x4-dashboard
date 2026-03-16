# Contributing

Thanks for your interest in improving `x4-dashboard`.

## Local setup

```bash
npm run install:all
npm run dev
```

Useful commands:

```bash
npm run dev:mock
npm run build
npm run typecheck
```

## Project rules

- Do not edit `server/public/` directly. It is generated build output.
- Keep server code in CommonJS and client code in ESM.
- Use functional React components with named exports.
- Add or update types in `client/src/types/gameData.ts` when game state changes.
- Run `npm run typecheck` after editing TypeScript files.

## Pull requests

- Keep changes focused.
- Explain the user-facing impact and technical rationale.
- Update documentation when behavior, setup, or security changes.
- Include screenshots or recordings for visible UI work when helpful.
