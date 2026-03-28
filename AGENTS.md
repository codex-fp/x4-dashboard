# AGENTS.md

Guidance for coding agents working in this repository.

## Project Snapshot

- `x4-dashboard` is a browser-first cockpit dashboard and server launcher for X4: Foundations.
- Main areas:
  - `client/` - main dashboard frontend in React + TypeScript
  - `server/` - Express + WebSocket backend in CommonJS
  - `launcher/` - Windows host-side Server Launcher
  - `game-mods/x4_dashboard_bridge/` - Lua bridge mod for the game
  - `landing/` - public project landing page
- `server/public/` is generated build output from `client/`; do not edit it directly.
- The product model is one host server with one or more browser clients on localhost or LAN.
- Electron is the host-side launcher, not the main dashboard UI.

## Planning And Delivery

- `ROADMAP.md` is the source of truth for release planning.
- `CHANGELOG.md` stores user-facing release notes.
- `RELEASE.md` is the release and packaging checklist.
- Prefer the current milestone in `ROADMAP.md` over future work unless the user explicitly redirects.
- Prefer concrete GitHub issues over vague ideas when selecting work.

## Codex Layout

- Repository-wide policy lives in this file.
- Module-specific policy lives in the nearest nested `AGENTS.md`.
- Root project skills live in `.agents/skills/`:
  - `propose`
  - `refine`
  - `implement`
  - `verify`
  - `deploy`
  - `release`
- Custom project roles live in `.codex/agents/`:
  - `manager`
  - `developer`
  - `tester`
  - `devops`
- Module-local skills may exist deeper in the tree, such as the X4 bridge skill under `game-mods/x4_dashboard_bridge/.agents/skills/`.
- `.opencode/` and `opencode.json` are legacy reference material during migration only; do not treat them as the source of truth.

## Build, Run, And Validation

Run commands from the repository root unless noted.

```bash
npm run install:all       # install client, server, and landing dependencies
npm run dev               # dashboard dev flow with Electron launcher
npm run dev:mock          # mock dashboard dev flow with Electron launcher
npm run build             # build dashboard client into server/public/
npm run build:landing     # build the landing page
npm start                 # run the built app through the Electron launcher
npm run serve             # start the production server only
npm run typecheck         # dashboard/client typecheck
npm run typecheck:landing # landing page typecheck
npm run test              # server-side Jest tests
npm run release:check     # dashboard release validation
npm run release:bundle    # server + Lua release bundles
npm run desktop:dist      # Windows desktop artifacts
```

- There is no linter configured.
- `npm run typecheck` and `npm test` are the main validation commands for the dashboard product.
- After dashboard TypeScript changes, run `npm run typecheck`.
- After landing changes, run `npm run typecheck:landing`, and run `npm run build:landing` when practical.
- After server logic changes, run `npm test` when practical.
- After packaging, deployment, or release changes, run the most relevant command when practical:
  - `npm run release:check`
  - `npm run release:bundle`
  - `npm run desktop:dist`

## Deployment Awareness

- Active deployment for the landing page and mock deployment targets is handled through Dokploy.
- `Dockerfile.landing` and `Dockerfile.mock` back those Dokploy targets.
- Do not reintroduce GitHub Pages for `landing/` unless the user explicitly requests it.
- Codex may use Dokploy MCP and Chrome DevTools MCP when they are configured in the local environment.
- Never commit MCP secrets, API keys, local endpoints, or user-specific MCP configuration into the repository.
- GitHub Releases and desktop packaging are still part of the project delivery flow, but they are separate from Dokploy-hosted deployments.

## Architecture Boundaries

- Node serves the built dashboard frontend from `server/public/`.
- In dashboard dev mode, Vite runs on `3000` and proxies `/api` to `3001`.
- Data flow:
  1. the Lua bridge posts widget payloads to `POST /api/data`
  2. `server/utils/normalizeData.js` strips X4 formatting codes
  3. `server/dataAggregator.js` merges partial payloads into durable game state
  4. `client/src/hooks/useGameData.ts` receives updates over WebSocket
  5. UI actions call `POST /api/keypress` for host key presses
- When adding a new exported game field:
  1. update `client/src/types/gameData.ts`
  2. update `getState()` in `server/dataAggregator.js`
  3. update `server/mockData.js` if mock mode should expose it
- Host-only settings and key bindings belong in the Electron Server Launcher, not the browser dashboard.
- Shared game-state types belong in `client/src/types/gameData.ts`.
- Do not mix CommonJS and ESM across module boundaries.

## Repository-Wide Conventions

- Follow existing file style and avoid unrelated refactors.
- Prefer descriptive names using existing product vocabulary.
- Use Conventional Commits for every commit.
- Keep commit scopes aligned with the touched area when practical.
- Code, commit messages, PR descriptions, and GitHub comments must be in English.
- Chat with the user in the user's language.

## Do Not

- Do not edit `server/public/` directly.
- Do not add a linter or a new test framework without explicit request.
- Do not use destructive git commands unless explicitly requested.
- Do not push, tag, or rewrite history unless the user explicitly asks.
