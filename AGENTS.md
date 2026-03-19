# AGENTS.md

Guidance for agentic coding assistants working in this repository.

## Project Snapshot

- `x4-dashboard` is a React + Node.js dashboard for X4: Foundations.
- The repo has four main parts:
  - `client/` - Vite + React + TypeScript frontend
  - `server/` - Express + WebSocket backend in CommonJS
  - `electron/` - desktop wrapper for packaged app builds
  - `game-mods/x4_dashboard_bridge/` - Lua mod that sends game data
- `server/public/` is generated build output from `client/` and must not be edited directly.

## Commands

Run from the repository root.

```bash
npm run install:all    # install client and server dependencies
npm run dev            # Vite + server in dev mode
npm run desktop:dev    # Vite + server + Electron
npm run desktop:mock   # Vite + mock server + Electron launcher
npm run dev:mock       # Vite + server mock mode
npm run mock           # mock server only at http://localhost:3001
npm run build          # build client into server/public/
npm start              # start production server
npm run desktop:start  # run Electron against built app
npm run desktop:dist   # build Windows desktop artifacts
npm run typecheck      # main validation command
npm run check          # alias for typecheck
npm run release:check  # typecheck + frontend build
npm run release:bundle # create server and Lua bundles in dist/
```

## Validation

- There is no test suite, no linter, and no single-test command.
- The main validation step is:

```bash
npm run typecheck
```

- Client-only equivalent:

```bash
npm --prefix client run typecheck
```

- After TypeScript changes, run `npm run typecheck`.
- After packaging or release changes, run the relevant validation when practical:
  - `npm run release:check`
  - `npm run desktop:dist`
  - `npm run release:bundle`

## Architecture

- The Node server serves the built React app from `server/public/`.
- In dev mode, Vite runs on port `3000` and proxies `/api` to port `3001`.
- The intended client model is browser-first: one host server, many browser clients on localhost or LAN.
- The Electron launcher starts the bundled server, shows local/LAN URLs, and manages host-only settings.

Data flow:
1. The Lua mod posts widget payloads to `POST /api/data`.
2. `server/utils/normalizeData.js` strips X4 formatting codes.
3. `server/dataAggregator.js` merges partial payloads into durable game state.
4. `client/src/hooks/useGameData.ts` receives updates over WebSocket.
5. UI actions call `POST /api/keypress`, which forwards key presses to the OS.

When adding a new exported game field:
1. Update `client/src/types/gameData.ts`.
2. Update `getState()` in `server/dataAggregator.js`.
3. Update `server/mockData.js` if the field should exist in mock mode.

## Module and File Rules

- `server/` uses CommonJS and `.js`.
- `client/` uses ESM and `.ts` / `.tsx`.
- Do not mix module systems.
- Keep generated assets out of source edits.

## TypeScript Style

- `client/tsconfig.json` uses `strict: false`; do not tighten it casually.
- Prefer `interface` for object shapes instead of `type` aliases or `enum`s.
- Use `T | null` instead of `T | undefined` for nullable state.
- Prefer named exports; do not introduce default exports in client code.
- Keep shared game-state types in `client/src/types/gameData.ts`.
- For loosely shaped external data, `Record<string, any>` is acceptable in this repo.

## Naming and Structure

- Use descriptive names; prefer product terms already used in the repo.
- React components: PascalCase filenames and component names.
- Helper functions and variables: camelCase.
- Interfaces and props types: PascalCase.
- Keep `Props` interfaces directly above the component that uses them.
- Keep components focused; move reusable logic to hooks or utilities.

## React and Frontend Conventions

- Functional components only.
- Use named exports: `export function MyWidget(...)`.
- Use destructuring with defaults for optional props when helpful.
- Follow existing hook patterns from `useGameData.ts`.
- Never enable React StrictMode; it breaks Arwes animations.

Frontend layout model:
- `Dashboard -> Panel -> Widget`
- Dashboard configs live in `client/src/dashboards.ts`.
- `client/src/components/Dashboard.tsx` is the shell.
- Widget registration lives in `client/src/components/dashboard/widgetRegistry.tsx`.
- Layout helpers live in `client/src/components/dashboard/DashboardLayouts.tsx`.
- Widget components render content only; panel chrome belongs in `ArwesPanel`.
- Current curated shipped dashboards are `Flight`, `Ship Controls`, and `Operations`.

## Arwes and Styling

- Use `client/src/components/ArwesPanel.tsx` for new framed panels.
- Every Arwes `<Text>` must have a parent `<Animator>`.
- Available panel colors: `primary`, `danger`, `success`, `warning`, `purple`.
- Global CSS lives in `client/src/index.css`; do not split it into modules.
- Use CSS classes for static states and inline styles for computed values.

## Server Conventions

- Do not introduce `async/await` in `server/`; follow existing callback/sync style.
- Use synchronous config reads where the code already expects them.
- Route handlers should return JSON errors with explicit status codes.
- WebSocket send failures should remain silent where the repo already does that.
- Use defensive nullish coalescing and clamp numeric values where appropriate.
- Keep section comments in the existing style, for example `// === WebSocket server ===`.

Error-handling patterns:
- WebSocket / JSON parse: silent `catch {}` when already used that way
- HTTP routes: `res.status(...).json({ error: '...' })`
- Key press failures: `console.error(...)`
- Missing config files may crash loudly if the current code expects that

## Key Bindings and Runtime Config

- Key bindings are stored in `server/config/keybindings.json`.
- Runtime host settings are stored in `server/config/runtime.json` when saved from the launcher.
- When adding a new system flag or action, update both client and server mappings.
- Current env vars include `PORT`, `MOCK`, `AUTOHOTKEY_PATH`, `X4_FORCE_ACTIVATE`, `X4_WINDOW_TITLE`, and `ALLOW_REMOTE_CONTROLS`.
- Host-only settings and key bindings belong in the Server Launcher, not the browser dashboard.
- Browser UI should focus on dashboard usage and client-side preferences, not host machine control config.
- Prefer preserving current behavior unless the user asks for config model changes.

## Release and Distribution

- Release bundles are created by `scripts/create-server-bundle.js` and `scripts/create-lua-mod-bundle.js`.
- GitHub workflows live in `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Desktop artifacts are written to `release/`; server/Lua bundles to `dist/`.
- If you change packaging, ensure the build still includes server runtime dependencies.

## Roadmap and GitHub Planning

- Treat `ROADMAP.md` as the source of truth for product planning.
- Keep roadmap, milestones, and open issues aligned.
- Use milestones for release-sized groupings such as `v1.2.0` and `v2.0.0`.
- Prefer updating existing issues before creating new ones.
- When creating a new issue from user discussion or roadmap work, attach it to the most appropriate existing milestone if one already fits.
- New planning issues should use `Goal`, `Scope`, and `Why`.
- Do not create releases, tags, or close milestones unless the user explicitly asks.

## Git Workflow

- Create local commits proactively while working; do not wait for the user to ask for a commit once a meaningful chunk of work is complete.
- Do not ask whether to commit the current work unless the user explicitly wants to control commit boundaries or commit messages.
- Do not push commits to the remote unless the user explicitly asks.
- Treat local commits as the default way to checkpoint active work, even if multiple local commits will later be squashed before push.
- When the user asks for a push, first inspect recent local history and identify commits that should be squashed.
- Prefer pushing a cleaner, squashed history for related work instead of many tiny incremental commits.
- Before pushing, consolidate related local commits into a clean public history whenever practical.
- If the user asks to push immediately, use judgment, but still review local history before pushing.
- Before creating a release or tag, make sure the related commits are already in a good shape for public history.

## Do Not

- Do not edit `server/public/` directly.
- Do not add a linter or test framework without explicit request.
- Do not enable React StrictMode.
- Do not introduce default exports in client code.
- Do not use `enum` where an `interface` is sufficient.
- Do not mix CommonJS and ESM.
- Do not use destructive git commands unless explicitly requested.
