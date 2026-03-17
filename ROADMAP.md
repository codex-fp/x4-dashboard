# Roadmap

This roadmap is a lightweight public planning document for the next release cycle.

## v1.2.0 priorities

### 1. Desktop polish
- Add custom application icons and better installer branding
- Improve first-run experience for desktop users
- Reduce Electron packaging rough edges and clarify runtime requirements
- Make LAN access a first-class mode so the app is reachable from other devices by default, not only localhost
- Separate release artifacts for the server, browser clients, Electron client, and the Lua mod so each piece can be used independently

### 2. Dashboard UX improvements
- Add a dedicated settings and diagnostics surface
- Improve empty, loading, and disconnected states across widgets
- Make dashboard scaling and layout behavior more predictable on different screens
- Audit the current dashboard presets and remove unused or low-value dashboards to keep the shipped set intentional
- Rename misleading dashboard presets such as `Flight Horizontal` and clean up dashboards that should no longer ship by default

### 3. Data model and widget coverage
- Expand typed support for remaining game data areas still treated loosely
- Add more widgets for factions, inventory, transaction log, and agents
- Document the contract for adding new exported game fields end to end

### 4. Release and contributor experience
- Add app icons and release screenshots for GitHub releases
- Improve issue labeling and contributor onboarding for first contributions
- Keep CI and release automation current as GitHub Actions platform requirements evolve
- Move important runtime configuration into the app UI instead of relying only on environment variables

## Next major version vision

### v2.0.0 candidate: user-defined dashboards
- Move beyond editing `client/src/dashboards.ts` as the only way to define layouts
- Let users create, edit, duplicate, reorder, and delete dashboards from the app UI
- Persist dashboard definitions in user-managed storage instead of hardcoded source only
- Keep a built-in set of curated default dashboards while allowing custom user presets
- Design the widget/layout model so custom dashboards stay compatible with future widgets and data fields
- Let users manage which built-in dashboards are visible so shipped presets and custom presets can coexist cleanly

## How this is managed

- The milestone for this cycle is `v1.2.0`
- The next major planning milestone is `v2.0.0`
- Implementation tasks are tracked as GitHub issues
- Scope may shift based on feedback from early public users
