# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic Versioning.

## [Unreleased]

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
