# AGENTS.md

Guidance for coding agents working in `x4-dashboard`.
This file inherits organization defaults from parent `AGENTS.md` files and
defines only local guidance.

## Scope

This repository is a browser-first cockpit dashboard and server launcher for
X4: Foundations.

- Applies to `x4-dashboard/`.
- Inherits broader `codex-fp` guidance when opened inside the organization
  workspace.
- More specific nested `AGENTS.md` files override this file for their subtree.

## Purpose

This area owns the X4 Dashboard product.

This area owns:

- The React dashboard frontend.
- The Express and WebSocket backend.
- The Windows host-side server launcher.
- The X4 Lua bridge mod.
- The public landing page and release packaging workflow.

This area does not own:

- Generated `server/public/` output as a hand-edited source tree.
- GitHub Pages deployment unless explicitly restored.
- Local MCP endpoints, secrets, or user-specific deployment configuration.

## Read Order

Before changing this area, read:

1. `README.md` for the product overview.
2. This file and any deeper `AGENTS.md` for the touched path.
3. `ROADMAP.md` for release planning.
4. `RELEASE.md` and `CHANGELOG.md` for release or packaging changes.

## Documentation Contract

- Treat `ROADMAP.md` as the source of truth for release planning.
- Keep user-facing release notes in `CHANGELOG.md`.
- Keep release and packaging procedure in `RELEASE.md`.
- Update documentation before or with product behavior, workflow, deployment,
  or release-contract changes.
- Link to module-specific guidance instead of duplicating it here.

## Layout

- `client/` - main dashboard frontend in React and TypeScript.
- `server/` - Express and WebSocket backend in CommonJS.
- `launcher/` - Windows host-side Server Launcher.
- `game-mods/x4_dashboard_bridge/` - Lua bridge mod for the game.
- `landing/` - public project landing page.
- `.agents/skills/` - repository root skills.
- `.codex/agents/` - custom project roles.
- `server/public/` - generated client build output; do not edit directly.

## Architecture And Boundaries

- The product model is one host server with one or more browser clients on
  localhost or LAN.
- Electron is the host-side launcher, not the main dashboard UI.
- Node serves the built dashboard frontend from `server/public/`.
- In dashboard dev mode, Vite runs on port `3000` and proxies `/api` to port
  `3001`.
- Shared game-state types belong in `client/src/types/gameData.ts`.
- Host-only settings and key bindings belong in `launcher/`, not the browser
  dashboard.
- Do not mix CommonJS and ESM across module boundaries.

## Workflow Overrides

- Prefer the current milestone in `ROADMAP.md` over future work unless the user
  explicitly redirects.
- Prefer concrete planned work over vague ideas when selecting work.
- Use Conventional Commits for every commit.
- Do not push, tag, or rewrite history unless the user explicitly asks.

## Build, Run, And Validation

Run commands from `x4-dashboard/` unless a deeper `AGENTS.md` states otherwise.

```bash
npm run install:all
npm run dev
npm run dev:mock
npm run build
npm run build:landing
npm start
npm run serve
npm run typecheck
npm run typecheck:landing
npm run test
npm run release:check
npm run release:bundle
npm run desktop:dist
npm run screenshots:capture
```

Validation expectations:

- Run `npm run typecheck` after dashboard TypeScript changes.
- Run `npm run typecheck:landing` after landing TypeScript changes.
- Run `npm run build:landing` for meaningful landing rendering or deployment
  changes when practical.
- Run `npm run test` for meaningful server logic changes when practical.
- Run the most relevant release or desktop command for packaging, deployment,
  or release changes.
- If no executable check applies, state that clearly in the handoff.

## Conventions

- Follow existing file style and avoid unrelated refactors.
- Prefer descriptive names using existing product vocabulary.
- Keep commit scopes aligned with the touched area when practical.
- Keep root project skills in `.agents/skills/`.
- Keep custom project roles in `.codex/agents/`.
- Do not add a linter or a new test framework without explicit request.

## Runtime Or Deployment Notes

- Active deployment for the landing page and mock deployment targets is handled
  through Dokploy.
- `Dockerfile.landing` and `Dockerfile.mock` back the Dokploy targets.
- Do not reintroduce GitHub Pages for `landing/` unless the user explicitly
  requests it.
- `npm run screenshots:capture` is the canonical repeatable screenshot
  regeneration flow for `docs/screenshots/`.

## Secrets And State

- Never commit MCP secrets, API keys, local endpoints, user-specific MCP
  configuration, or generated local runtime state.
- Treat Dokploy access, endpoints, and secrets as environment-local
  configuration.

## Quality Gates

- Confirm changed files match this repository's scope.
- Confirm docs, release notes, and implementation agree.
- Confirm generated output such as `server/public/` was not edited directly.
- Confirm local links and file references remain correct.
- Review the diff for accidental generated output, hidden artifacts, local
  state, secrets, and scope creep.

## References

- `README.md` - product overview.
- `ROADMAP.md` - release planning.
- `CHANGELOG.md` - user-facing release notes.
- `RELEASE.md` - release and packaging checklist.
- `client/AGENTS.md` - dashboard frontend guidance.
- `server/AGENTS.md` - backend guidance.
- `launcher/AGENTS.md` - launcher guidance.
- `game-mods/x4_dashboard_bridge/AGENTS.md` - Lua bridge guidance.
- `landing/AGENTS.md` - landing page guidance.
