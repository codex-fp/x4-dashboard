# AGENTS.md

Launcher-specific guidance for the Windows Server Launcher.

## Scope

- `launcher/` is the host-side Server Launcher, not the main dashboard UI.
- Host-only behavior belongs here: launcher flows, URLs, runtime settings, and local keybinding management.

## Conventions

- Match the existing Electron and CommonJS-style `.cjs` files.
- Keep launcher responsibilities separate from browser dashboard responsibilities.
- Preserve existing preload and main-process boundaries.

## Product Boundaries

- Host-only settings such as remote control toggles, AutoHotkey paths, focus behavior, and launcher-managed key bindings belong here instead of in the browser dashboard.
- When adding a new host-side flag or action, update both the launcher-facing and server-facing mappings when needed.
- Branding and installer assets live in `launcher/assets/`; avoid unrelated packaging churn.

## Validation

- For meaningful launcher or packaging changes, run the most relevant command when practical:
  - `npm run release:check`
  - `npm run desktop:dist`
