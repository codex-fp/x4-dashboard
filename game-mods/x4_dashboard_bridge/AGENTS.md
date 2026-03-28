# AGENTS.md

Bridge-mod guidance for the X4: Foundations integration layer.

## Scope

- `game-mods/x4_dashboard_bridge/` owns the Lua bridge that extracts game data and posts it to the dashboard server.
- Prefer the root `x4-api` skill when working on unfamiliar X4 APIs, new widgets, or FFI bindings.

## API Discovery

- Existing widget implementations under `ui/widgets/` are the primary source of truth for API usage patterns.
- Prefer established Lua helper functions when they already expose the needed data.
- Use `pcall(ffi.cdef, ...)` for FFI declarations to avoid redefinition errors.
- Use `pcall(...)` around exploratory or fragile API calls when the game API may be unavailable or shape-shifting.

## Workflow

- Keep widget registration and payload structure aligned with the current bridge architecture.
- When adding a new widget or payload, update the bridge-side registration points consistently.
- Keep payloads compatible with the server normalization and aggregation pipeline.
- Use temporary `DebugError(...)` logging for discovery only; remove noisy logging before finalizing changes.

## Style

- Match the existing Lua style and naming already used in the bridge files.
- Avoid speculative refactors in X4 integration code unless the task explicitly calls for them.
