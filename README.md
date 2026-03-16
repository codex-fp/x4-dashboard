# X4 Dashboard

A playable real-time cockpit dashboard for X4: Foundations.

It combines a React + Arwes frontend, a small Node.js bridge server, and an X4 Lua mod that pushes game state straight into the browser. The project is already usable as a second-screen control panel and live status display, even though it is still evolving.

The bundled Lua mod is a modified version of the X4 External App mod by Mycu. `x4-dashboard` keeps the game-side data export idea, but replaces the original frontend with its own Node.js server and React dashboard.

## What it does

- Shows live ship, navigation, combat, mission, research, and logbook data.
- Streams updates from X4 over HTTP into a unified WebSocket game state.
- Lets you trigger selected ship actions from the dashboard through configurable key bindings.
- Includes a mock-data mode so you can preview the UI without running the game.

## Screens and features

- Ship hull and shield status.
- Navigation speed, boost energy, travel drive, and flight-assist indicators.
- System controls for Flight Assist, SETA, Travel Drive, and Autopilot.
- Target and combat telemetry.
- Mission offers and active mission details.
- Logbook, research, faction, inventory, and transaction widgets.
- Connection indicators for dashboard and game feed state.

## Important safety note

This app can simulate local key presses on the machine where the server is running.

- Keep it on a trusted local machine or private LAN only.
- Do not expose the server directly to the public internet.
- Control endpoints are localhost-only by default. Set `ALLOW_REMOTE_CONTROLS=true` only if you understand the risk.
- The game window usually needs to be focused, or running borderless windowed, for key presses to land reliably.

## Requirements

- Node.js 18+
- X4: Foundations
- The `djfhe_http` X4 dependency required by `game-mods/mycu_external_app/content.xml`
- Optional: `VerboseTransactionLog` if you want richer transaction-log data

Platform notes for key simulation:

- Windows: AutoHotkey v2 is recommended for reliable in-game key presses; PowerShell `SendKeys` is used as a fallback when AutoHotkey is unavailable
- Linux: `xdotool`
- macOS: `osascript`

## Quick start

Install dependencies:

```bash
npm run install:all
```

Preview with mock data:

```bash
npm run mock
```

Then open `http://localhost:3001`.

## Running with the real game

This repository keeps source files only. The production frontend in `server/public/` is generated locally and ignored by Git.

Build the client before starting the server, and rebuild after frontend changes:

```bash
npm run build
```

Start the server:

```bash
npm start
```

Open `http://localhost:3001` in your browser.

## Desktop app

Run the Electron desktop shell in development:

```bash
npm run desktop:dev
```

Run the desktop shell against the locally built production frontend:

```bash
npm run build
npm run desktop:start
```

Build Windows desktop artifacts:

```bash
npm run desktop:dist
```

Generated installers are written to `release/`.

Windows note:

- Install AutoHotkey v2 on the same machine as the dashboard server if you want dashboard buttons to work reliably in X4.
- The server will auto-detect common AutoHotkey install paths.
- If needed, set `AUTOHOTKEY_PATH` to the full `AutoHotkey64.exe` path.

## Development

Hot-reload frontend and backend together:

```bash
npm run dev
```

- Vite frontend: `http://localhost:3000`
- Node server: `http://localhost:3001`

Validation:

```bash
npm run check
```

There is no dedicated test suite yet; TypeScript checking is the main validation step for the client.

Release validation:

```bash
npm run release:check
```

Build a distributable runtime bundle:

```bash
npm run release:bundle
```

The bundle is written to `dist/` and contains the built frontend, server runtime files, and bundled X4 mod.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | Server port |
| `MOCK` | unset | Forces mock mode when set to `true` |
| `AUTOHOTKEY_PATH` | unset | Explicit path to `AutoHotkey64.exe` |
| `X4_FORCE_ACTIVATE` | `false` | Try to focus the game window before sending keys |
| `X4_WINDOW_TITLE` | `X4` | Window title fragment used for focus matching |
| `ALLOW_REMOTE_CONTROLS` | `false` | Allows remote access to `/api/keypress` and keybinding management |

## X4 mod setup

The Lua integration lives in `game-mods/mycu_external_app/`.

This Lua mod is a modified version of X4 External App. The original X4 External App Node application is not required for `x4-dashboard` to work, because this project ships its own Node.js app that replaces the original frontend/backend flow.

Copy that folder into your X4 extensions directory so the final path looks like this:

```text
X4 Foundations/extensions/mycu_external_app/
```

The mod posts data to the dashboard server on every tick. Configuration is in `game-mods/mycu_external_app/ui/config.lua`:

```lua
host = '127.0.0.1'
port = 3001
```

If your dashboard server runs on another machine on your LAN, update `host` accordingly.

## Credits

Special thanks to Mycu, the author of X4 External App, for the original mod that made this integration path possible.

## Key bindings

Bindings are stored in `server/config/keybindings.json` and editable from the dashboard UI.

On Windows, these bindings are sent through AutoHotkey when it is available, which is more reliable for games than plain `SendKeys`.

Supported key format uses SendKeys-style notation:

| Format | Example | Meaning |
| --- | --- | --- |
| Function keys | `{F1}` | Function key |
| Regular keys | `a` | Plain key |
| Ctrl | `^a` | Ctrl+A |
| Shift | `+a` | Shift+A |
| Alt | `%a` | Alt+A |
| Special keys | `{ENTER}` | Enter |
| Arrow keys | `{UP}` | Up arrow |

## Architecture overview

The app is a single Node.js server that serves a locally built React frontend from `server/public/`.

Data flow:

1. The X4 Lua mod posts widget payloads to `POST /api/data`.
2. `server/utils/normalizeData.js` strips X4 formatting codes.
3. `server/dataAggregator.js` merges partial updates into one durable game state.
4. The server broadcasts the state to browser clients over WebSocket.
5. Dashboard control buttons call `POST /api/keypress`, which forwards key presses to the host OS.

## Project layout

```text
x4-dashboard/
|- client/                      React + TypeScript source
|- game-mods/mycu_external_app/ X4 Lua extension
|- server/                      Express, WebSocket, keypress bridge
|- server/public/               Local build output (generated, ignored by Git)
|- README.md
|- LICENSE
```

## Public repo hygiene

- Contribution guide: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`
- Release checklist: `RELEASE.md`
- Roadmap: `ROADMAP.md`
- Changelog: `CHANGELOG.md`
- Build output is ignored and regenerated locally
- Repository line endings are normalized with `.gitattributes`

## Known limitations

- This is a playable release, not a finished one.
- Some systems are intentionally simple and may still change shape.
- The server is designed for trusted local use, not hardened remote hosting.
- There is no formal automated test suite yet.

## License

MIT. See `LICENSE`.
