# Roadmap

This roadmap is a lightweight public planning document for the next release cycle.

## v1.2.0 priorities

### 1. Desktop polish
- Add custom application icons and better installer branding
- Improve first-run experience for desktop users
- Reduce Electron packaging rough edges and clarify runtime requirements
- Make LAN access a first-class mode so the app is reachable from other devices by default, not only localhost

### 2. Dashboard UX improvements
- Add a dedicated settings and diagnostics surface
- Improve empty, loading, and disconnected states across widgets
- Make dashboard scaling and layout behavior more predictable on different screens

### 3. Data model and widget coverage
- Expand typed support for remaining game data areas still treated loosely
- Add more widgets for factions, inventory, transaction log, and agents
- Document the contract for adding new exported game fields end to end

### 4. Release and contributor experience
- Add app icons and release screenshots for GitHub releases
- Improve issue labeling and contributor onboarding for first contributions
- Keep CI and release automation current as GitHub Actions platform requirements evolve

## How this is managed

- The milestone for this cycle is `v1.2.0`
- Implementation tasks are tracked as GitHub issues
- Scope may shift based on feedback from early public users
