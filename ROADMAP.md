# Roadmap

This roadmap is a lightweight public planning document for a shorter, more frequent release cadence.

## Current release plan

### v1.3.0 - Controls and onboarding
- Ship in-launcher keybinding capture for faster host setup
- Ship automatic import for supported X4 key bindings from local game settings
- Ship a non-technical installation and usage guide for new players
- Reduce friction between first launch, setup, and the first successful control action with a clearer launcher-first flow
- Include the controlled-ship `shipStatus` fix so affected widgets dim cleanly when the player is not actively piloting
- Roll in the latest combat and situational-awareness additions already on `master`, including factions, target, transaction log, and missile warning improvements

### v1.4.0 - Widget reliability and data coverage
- Improve empty, loading, and disconnected states across the remaining widgets that still need polish after the recent dashboard pass
- Close out the remaining secondary game data coverage work after shipping factions, transaction log, and agents
- Resolve inventory bridge coverage and, if feasible, ship the remaining secondary-data follow-up widget slice
- ~~Verify live UnderAttack and broader combat data flow in gameplay and close any remaining bridge coverage gaps~~ *(partially done — inventory delivered; combat data gaps remain)*
- **Delivered in this cycle:** inventory bridge export, typed contract, and Operations/Trade dashboard integration

### v1.5.0 - Quality and release presentation
- Add an initial automated test suite to protect the most important flows
- Capture screenshots for under-attack and active-target states
- Add separate dashboard zoom and text scaling controls so players can tune widget readability without resizing the top title bar
- Improve release presentation with better screenshots and supporting docs where useful
- Keep CI and release packaging polished as the project becomes easier to distribute

### v1.6.0 - Native launcher migration
- Replace the Electron-based launcher with a Tauri desktop shell to reduce startup time, bundle size, and memory usage
- Move launcher-side host logic into Rust as the target architecture for packaging, reliability, and Windows integration
- Keep the browser-first dashboard model intact while separating host-only desktop responsibilities more clearly
- Rework desktop packaging and distribution so the launcher stays easy to install without bundling a full Chromium runtime
- Preserve feature parity for settings, diagnostics, local server lifecycle, and host-side control integration before removing Electron

## Released

### v1.2.0 - Network and settings foundation (released 2026-03-19)
- Made LAN access a first-class runtime mode so the app is reachable from other devices without manual setup
- Added a dedicated launcher settings and diagnostics surface for the current host/client model
- Moved important host runtime configuration out of ad-hoc environment-variable-only setup and into the launcher UI
- Established the host/network foundation for smoother setup and future control improvements

## Already landed before v1.3.0

- Custom desktop app icons and installer branding
- Improved desktop first-run experience
- Split release artifacts into server, browser client, Electron launcher, and Lua mod packages
- Renamed and cleaned up shipped dashboard presets
- Refreshed `README.md` with better structure and screenshots
- Fixed scrolling in the Mission Offers and Comms widgets

## Next major version vision

### v2.0.0 - User-defined dashboards
- Move beyond editing `client/src/dashboards.ts` as the only way to define layouts
- Let users create, edit, duplicate, reorder, and delete dashboards from the app UI
- Persist dashboard definitions in user-managed storage instead of hardcoded source only
- Keep a built-in set of curated default dashboards while allowing custom user presets
- Design the widget/layout model so custom dashboards stay compatible with future widgets and data fields
- Let users manage which built-in dashboards are visible so shipped presets and custom presets can coexist cleanly

## How this is managed

- Each minor release gets its own GitHub milestone
- Implementation tasks are tracked as concrete GitHub issues; release themes stay in the roadmap and milestone instead of separate umbrella issues unless a distinct cross-cutting deliverable needs one
- `v2.0.0` stays reserved for user-defined dashboards unless a larger strategic shift appears
- Scope may still move based on feedback from early public users, but each release should stay intentionally small
