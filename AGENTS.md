# AGENTS.md

Guidance for agentic coding assistants working in this repository.

## Project Snapshot

- `x4-dashboard` is a React + Node.js dashboard for X4: Foundations.
- Main areas:
  - `client/` - Vite + React + TypeScript frontend
  - `server/` - Express + WebSocket backend in CommonJS
  - `electron/` - desktop launcher / packaged wrapper
  - `game-mods/x4_dashboard_bridge/` - Lua bridge mod
- `server/public/` is generated build output from `client/`; do not edit it directly.
- Product model is browser-first: one host server, many browser clients on localhost or LAN.
- Electron is the host-side Server Launcher, not the main dashboard UI.

## External Rules

- No `.cursor/rules/` directory is present.
- No `.cursorrules` file is present.
- No `.github/copilot-instructions.md` file is present.

## Build, Run, and Validation Commands

Run commands from the repository root unless noted.

```bash
npm run install:all    # install client and server dependencies
npm run dev            # Vite + server in dev mode
npm run desktop:dev    # Vite + server + Electron launcher
npm run desktop:mock   # mock server + Vite + Electron launcher
npm run dev:mock       # mock server + Vite
npm run mock           # mock server only on :3001
npm run build          # build client into server/public/
npm start              # start production server
npm run desktop:start  # run Electron against built app
npm run desktop:dist   # build Windows desktop artifacts
npm run typecheck      # main validation command
npm run check          # alias for typecheck
npm run release:check  # typecheck + frontend build
npm run release:bundle # build release bundles into dist/
```

## Tests and Linting

- There is currently no test suite.
- There is currently no linter.
- There is no single-test command because no tests exist yet.
- The main validation step is `npm run typecheck`.
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

## Module and File Rules

- `client/` uses ESM with `.ts` / `.tsx`.
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

## Imports and Structure

- Match the surrounding import style and ordering in each file.
- Keep imports minimal; remove unused imports.
- Keep components focused; move reusable logic to hooks or utilities.
- Widget components render content only; panel chrome belongs in `ArwesPanel`.
- Dashboard layout model is `Dashboard -> Panel -> Widget`.
- Dashboard configs live in `client/src/dashboards.ts`.
- Widget registration lives in `client/src/components/dashboard/widgetRegistry.tsx`.
- Layout helpers live in `client/src/components/dashboard/DashboardLayouts.tsx`.
- Current curated shipped dashboards are `Flight`, `Ship Controls`, and `Operations`.

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

- Do not introduce `async/await` in `server/`; follow the existing callback/sync style.
- Use synchronous config reads where the current code expects them.
- HTTP routes should return JSON errors with explicit status codes.
- Keep section comments in the existing style, e.g. `// === WebSocket server ===`.
- Use defensive nullish coalescing and clamp numeric values where appropriate.
- WebSocket send failures should remain silent where the repo already does that.
- Error-handling patterns:
  - WebSocket / JSON parse: silent `catch {}` where already used
  - HTTP routes: `res.status(...).json({ error: '...' })`
  - Key press failures: `console.error(...)`
  - Missing config files may crash loudly if the current code expects that

## Key Bindings and Runtime Config

- Host-only settings and key bindings belong in the Electron Server Launcher, not the browser dashboard.
- Browser UI should focus on dashboard use and client-side preferences.
- Current env vars include `PORT`, `MOCK`, `AUTOHOTKEY_PATH`, `X4_FORCE_ACTIVATE`, `X4_WINDOW_TITLE`, and `ALLOW_REMOTE_CONTROLS`.
- When adding a new host-side flag or action, update both client and server mappings.
- Preserve current behavior unless the user explicitly asks for config model changes.

## Release and Distribution

- Release bundles are created by `scripts/create-server-bundle.js` and `scripts/create-lua-mod-bundle.js`.
- GitHub workflows live in `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Desktop artifacts are written to `release/`; server/Lua bundles to `dist/`.
- If you change packaging, ensure the build still includes server runtime dependencies.

## GitHub Planning Workflow

- Treat `ROADMAP.md` as the source of truth for product planning.
- Keep roadmap, milestones, and open issues aligned.
- Use milestones for release-sized groupings such as `v1.2.0` and `v2.0.0`.
- Prefer updating an existing issue before creating a new one.
- When creating an issue from user discussion or roadmap work, attach it to the most appropriate existing milestone if one fits.
- New planning issues should use `Goal`, `Scope`, and `Why`.
- Do not create releases, tags, or close milestones unless the user explicitly asks.
- Before proposing a release version, check milestone scope and unfinished issues.

## Git Workflow

- Create local commits proactively while working; do not wait for the user to ask once a meaningful chunk is done.
- Do not ask whether to commit unless the user explicitly wants to control commit boundaries or commit messages.
- Treat local commits as the default checkpoint mechanism while work is in progress.
- Do not push unless the user explicitly asks.
- When the user asks for a push, inspect recent local history first.
- Squash or otherwise consolidate related local commits into a clean public history whenever practical before pushing.
- If the user asks to push immediately, still review history and use judgment.
- Before creating a release or tag, make sure the related history is already clean enough for public consumption.

## Do Not

- Do not edit `server/public/` directly.
- Do not add a linter or test framework without explicit request.
- Do not enable React StrictMode.
- Do not introduce default exports in client code.
- Do not use `enum` where an `interface` is sufficient.
- Do not mix CommonJS and ESM.
- Do not use destructive git commands unless explicitly requested.
