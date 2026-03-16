# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and the project follows Semantic Versioning.

## [Unreleased]

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
