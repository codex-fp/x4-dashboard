# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic Versioning.

## [Unreleased]

### Added
- Non-technical player setup guide covering packaged installation, Lua bridge setup, launcher-based control configuration, LAN access, and first-action verification for new users

## [1.2.0] - 2026-03-19

### Added
- Server Launcher diagnostics for LAN availability, X4 bridge detection, AutoHotkey detection, and host status
- Launcher-managed host settings for remote controls, game window activation, window title matching, and AutoHotkey path
- Launcher-managed keybinding editing and test actions for host-side controls
- Custom launcher branding assets for the Windows portable and installer builds

### Changed
- Promoted LAN usage to the primary multi-device workflow with clearer local/LAN URLs and updated safety guidance
- Moved host configuration out of the browser dashboard and into the Electron Server Launcher to match the host/client architecture
- Improved first-run launcher UX with clearer startup feedback, diagnostics, and troubleshooting guidance
- Curated the shipped dashboard presets and refreshed public-facing documentation and screenshots

### Fixed
- Restored scrolling in the Mission Offers and Comms widgets
- Improved operations dashboard scrollbar visibility

## [1.1.2] - 2026-03-17

### Changed
- Repositioned the Electron build as a server launcher that exposes local and LAN dashboard URLs instead of acting as the main dashboard client
- Split release packaging toward separate server and Lua mod artifacts
- Updated the packaged Lua mod metadata so it no longer conflicts with the original Mycu mod
- Renamed the packaged Lua mod folder to `x4_dashboard_bridge` so it no longer clashes with the original Mycu extension folder

## [1.1.1] - 2026-03-16

### Fixed
- Included server runtime dependencies in the packaged Electron app so the portable and installer builds can boot correctly
- Improved desktop error reporting by writing bundled server logs to a file in the Electron user data directory

## [1.1.0] - 2026-03-16

### Added
- Electron desktop wrapper with local server bootstrapping for a packaged app experience
- Desktop development and packaging scripts for local runs and installer generation
- Windows release automation for portable and installer builds on tagged releases

### Changed
- Package versions bumped to `1.1.0`
- Documentation expanded with desktop app usage and packaging guidance

## [1.0.1] - 2026-03-16

### Added
- Release bundle generator for shipping the built dashboard, server runtime, and X4 mod together
- GitHub release workflow that uploads `.zip` and `.tar.gz` assets for tagged versions

### Changed
- Package versions bumped to `1.0.1`
- Release documentation updated with bundle generation steps

## [1.0.0] - 2026-03-16

### Added
- Public repo hygiene files: `SECURITY.md`, `CONTRIBUTING.md`, `.editorconfig`, `.gitattributes`
- GitHub templates and CI automation
- Release-oriented docs and validation flow

### Changed
- Frontend dashboard rendering split into smaller modules
- Shared formatting and text helpers extracted from UI components
- WebSocket bootstrap made safer and dashboard fallback fixed
- Server control endpoints limited to localhost by default
- Root npm scripts made more cross-platform with `npm --prefix`

### Security
- Key press and keybinding management endpoints now require localhost by default
