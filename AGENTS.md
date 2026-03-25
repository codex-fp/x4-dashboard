# AGENTS.md

Guidance for coding agents working in this repository.

## Project Snapshot

- `x4-dashboard` is a React + Node.js dashboard for X4: Foundations.
- Main areas:
  - `client/` - Vite + React + TypeScript frontend
  - `server/` - Express + WebSocket backend in CommonJS
  - `electron/` - desktop launcher / packaged wrapper
  - `game-mods/x4_dashboard_bridge/` - Lua bridge mod
- `server/public/` is generated build output from `client/`; do not edit it directly.
- The product is browser-first: one host server, many browser clients on localhost or LAN.
- Electron is the host-side Server Launcher, not the main dashboard UI.

## Planning Files

- `ROADMAP.md` is the source of truth for release planning.
- `CHANGELOG.md` stores user-facing release notes.
- `RELEASE.md` is the release and packaging checklist.

## Task Prioritization

- Always prioritize tasks from the nearest release milestone over future releases.
- When selecting next tasks, prefer issues assigned to the current milestone in `ROADMAP.md`.
- Do not pick tasks from later milestones unless the current milestone has no open work or the user explicitly requests it.

## Build, Run, and Validation

Run commands from the repository root unless noted.

```bash
npm run install:all    # install client and server dependencies
npm run dev            # hot reload: server + Vite client + Electron launcher
npm run dev:mock       # hot reload: mock server + Vite client + Electron launcher
npm run build          # build client into server/public/
npm start              # run the built app through the Electron launcher
npm run serve          # advanced: start only the production server
npm run desktop:dist   # build Windows desktop artifacts
npm run typecheck      # main validation command
npm run check          # alias for typecheck
npm run release:check  # typecheck + frontend build
npm run release:bundle # build release bundles into dist/
```

- There is currently no test suite.
- There is currently no linter.
- `npm run typecheck` is the main validation step.
- Client-only equivalent: `npm --prefix client run typecheck`.
- After TypeScript changes, run `npm run typecheck`.
- After packaging or release changes, run the most relevant command when practical:
  - `npm run release:check`
  - `npm run desktop:dist`
  - `npm run release:bundle`

## Architecture Notes

- Node serves the built frontend from `server/public/`.
- In dev, Vite runs on `3000` and proxies `/api` to `3001`.
- Data flow:
  1. Lua bridge posts widget payloads to `POST /api/data`
  2. `server/utils/normalizeData.js` strips X4 formatting codes
  3. `server/dataAggregator.js` merges partial payloads into durable game state
  4. `client/src/hooks/useGameData.ts` receives updates over WebSocket
  5. UI actions call `POST /api/keypress` for host key presses
- When adding a new exported game field:
  1. update `client/src/types/gameData.ts`
  2. update `getState()` in `server/dataAggregator.js`
  3. update `server/mockData.js` if mock mode should expose it

## Source Boundaries

- `client/` uses ESM with `.ts` and `.tsx`.
- `server/` uses CommonJS with `.js`.
- Do not mix module systems.
- Keep generated assets out of source edits.
- Shared game-state types belong in `client/src/types/gameData.ts`.

## Code Style and Naming

- Follow existing file style; do not reformat unrelated code.
- Prefer descriptive names using existing product vocabulary.
- React components and files: PascalCase.
- Functions, hooks, helpers, and variables: camelCase.
- Interfaces and props types: PascalCase.
- Keep `Props` interfaces directly above the component that uses them.
- Prefer named exports; do not introduce default exports in client code.
- Prefer `interface` for object shapes instead of `type` aliases or `enum`s.
- Use `T | null` instead of `T | undefined` for nullable client state.
- `client/tsconfig.json` uses `strict: false`; do not tighten it casually.
- For loosely shaped external data, `Record<string, any>` is acceptable here.
- Match surrounding import style and ordering in each file.
- Keep imports minimal and remove unused imports.
- Keep components focused; move reusable logic to hooks or utilities.
- Widget components render content only; panel chrome belongs in `ArwesPanel`.
- Dashboard configs live in `client/src/dashboards.ts`.
- Widget registration lives in `client/src/components/dashboard/widgetRegistry.tsx`.
- Layout helpers live in `client/src/components/dashboard/DashboardLayouts.tsx`.

## Frontend Conventions

- Functional components only.
- Use destructuring with defaults for optional props when helpful.
- Follow hook patterns already used in `useGameData.ts`.
- Never enable React StrictMode; it breaks Arwes animations.
- Use `client/src/components/ArwesPanel.tsx` for new framed panels.
- Every Arwes `<Text>` must have a parent `<Animator>`.
- Available panel colors: `primary`, `danger`, `success`, `warning`, `purple`.
- Global CSS lives in `client/src/index.css`; do not split into CSS modules.
- Prefer CSS classes for static states and inline styles for computed values.

## Server Conventions and Error Handling

- Do not introduce `async/await` in `server/`; follow the existing callback and sync style.
- Use synchronous config reads where the current code expects them.
- HTTP routes should return JSON errors with explicit status codes.
- Keep section comments in the existing style, for example `// === WebSocket server ===`.
- Use defensive nullish coalescing and clamp numeric values where appropriate.
- WebSocket send failures should remain silent where the repo already does that.
- Error-handling patterns:
  - WebSocket or JSON parse failures: silent `catch {}` where already used
  - HTTP routes: `res.status(...).json({ error: '...' })`
  - Key press failures: `console.error(...)`
  - Missing config files may crash loudly if the current code expects that

## Runtime and Distribution

- Host-only settings and key bindings belong in the Electron Server Launcher, not the browser dashboard.
- Browser UI should focus on dashboard use and client-side preferences.
- When adding a new host-side flag or action, update both client and server mappings.
- Release bundles are created by `scripts/create-server-bundle.js` and `scripts/create-lua-mod-bundle.js`.
- GitHub workflows live in `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Desktop artifacts are written to `release/`; server and Lua bundles to `dist/`.
- If you change packaging, ensure the build still includes server runtime dependencies.

## Git Conventions

- Use Conventional Commits for every commit.
- Keep commit scopes aligned with the touched area when practical.
- Do not push, tag, or rewrite history unless the user explicitly asks.

## Do Not

- Do not edit `server/public/` directly.
- Do not add a linter or test framework without explicit request.
- Do not enable React StrictMode.
- Do not introduce default exports in client code.
- Do not use `enum` where an `interface` is sufficient.
- Do not mix CommonJS and ESM.
- Do not use destructive git commands unless explicitly requested.

## Skill Usage

Project-local skills are loaded on-demand when the task matches:

- `delivery-pipeline` - Full delivery loop orchestration (task selection → implementation → verification → issue closure)
- `implement-task` - Implementation workflow with local commit
- `verify-task` - Manual-style verification of delivered work
- `refine-task` - Turn vague tasks into implementation-ready issues
- `feature-intake` - Turn rough feature ideas into roadmap updates
- `release` - Release readiness and publish workflow
- `explore-x4-api` - X4: Foundations Lua API discovery

Agent skill permissions are configured per-agent:
- `developer`: `implement-task`, `explore-x4-api`, `refine-task`
- `tester`: `verify-task`
- `product-manager`: `delivery-pipeline`, `feature-intake`, `release`, `refine-task`
