# AGENTS.md

Guidance for agentic coding assistants working in this repository.

## Commands

```bash
npm run install:all   # Install all dependencies (server + client)
npm run dev           # Dev mode: Node (port 3001) + Vite (port 3000) with hot-reload
npm run dev:mock      # Dev mode with mock data (no X4 game needed)
npm run mock          # Server only with mock data at http://localhost:3001
npm run build         # Compile React → server/public/ (required before npm start)
npm start             # Production: Node serves built client at port 3001
```

**There are no tests and no linter configured.**

Type-check only:
```bash
cd client && npx tsc --noEmit
```

This is the sole validation tool. Run it after editing any TypeScript file.

## Architecture Overview

Single Node.js server (`server/`) that serves a built React frontend (`server/public/`).
In dev mode, Vite runs on port 3000 and proxies `/api` to port 3001.

**Data flow:**
1. X4 Lua mod (`game-mods/mycu_external_app/`) POSTs JSON to `POST /api/data` each tick
2. `server/index.js` strips X4 color codes (`server/utils/normalizeData.js`) and feeds data to the aggregator, then broadcasts via WebSocket
3. `server/dataAggregator.js` merges partial updates into a unified `GameState` (ship-only ticks don't wipe mission/logbook data)
4. `client/src/hooks/useGameData.ts` receives WebSocket messages and exposes `{ state, wsConnected, pressKey }` to components
5. `pressKey(action)` → `POST /api/keypress` → `server/keyPresser.js` → PowerShell `SendKeys` (Windows) / `xdotool` (Linux) → key reaches X4

**When adding a new data field:** update both `client/src/types/gameData.ts` **and** `getState()` in `server/dataAggregator.js`.

## Module Systems

| Layer | System | Style |
|-------|--------|-------|
| `server/` | CommonJS | `require()` / `module.exports` |
| `client/` | ESM | `import` / `export` |

Never mix the two. Server files use `.js`, client source files use `.ts` / `.tsx`.

## TypeScript Conventions

- `strict: false` in `client/tsconfig.json` — lenient type checking is intentional
- Use **interfaces** for object shapes, not `type` aliases or `enum`s
- Use `T | null` for nullable fields, not `T | undefined`
- Prefer `Record<string, any>` for loosely-shaped external data
- All types live in `client/src/types/gameData.ts`; add new interfaces there
- Named exports only — no default exports anywhere in the client

```ts
// Correct
export interface FlightState {
  speed: number;       // current m/s
  boostEnergy: number; // 0–100 %
  boosting: boolean;
  seta: boolean | null;
}
```

## React / Component Conventions

- **Functional components only**, named exports: `export function MyWidget({ ... }: Props) {`
- Define the `Props` interface directly above the component in the same file
- Use destructuring with defaults for optional props: `color = 'primary'`
- Hooks: `useState`, `useEffect`, `useCallback` — follow the existing pattern in `useGameData.ts`
- **Never enable React StrictMode** — it breaks Arwes animations
- Keep components presentational where possible; lift state into hooks

## Arwes UI Framework

Version `@arwes/react@1.0.0-next.25020502`. This is a sci-fi animation framework with strict rules:

- Every `<Text>` must have a parent `<Animator>` node
- **Always use `<ArwesPanel>`** (`client/src/components/ArwesPanel.tsx`) for new panels — it handles `FrameCorners`, glow, color themes, and animated titles
- Frame pattern requires two nested `<div>`s:
  ```tsx
  <div style={{ position: 'relative' }}>
    <FrameCorners ... />
    <div style={{ position: 'relative' }}>content</div>
  </div>
  ```
- Available panel color themes: `'primary'` | `'danger'` | `'success'` | `'warning'` | `'purple'`
- Arwes CSS variables: `--arwes-frames-line-color`, `--arwes-frames-bg-color`, `--arwes-frames-line-filter`
- Use inline `style` objects with `as React.CSSProperties` when setting custom CSS variables dynamically

## Styling

- Global styles are in `client/src/index.css` (monolithic — do not split it)
- CSS custom properties for the design system: `--c-cyan`, `--font-mono`, etc.
- Use CSS classes (from `index.css`) for static visual states
- Use inline `style` objects only for values that must be computed at runtime
- Class names follow BEM-ish conventions matching existing component patterns

## Server-Side Conventions

- No async/await on the server — use synchronous `fs.readFileSync` for config, callbacks otherwise
- Route handlers use inline try/catch: `res.status(N).json({ error: '...' })`
- Silent WebSocket send errors: `try { client.send(msg); } catch { /* ignore */ }`
- Data aggregator uses defensive nullish coalescing: `es?.hull ?? 100`
- Clamp numeric values: `Math.max(0, Math.min(100, value))`
- Section comments in server files: `// === WebSocket server ===`

## Error Handling Patterns

| Context | Pattern |
|---------|---------|
| WebSocket / JSON parse | Silent `catch {}` |
| `pressKey` API failure | `console.error(...)` |
| HTTP route errors | `res.status(N).json({ error: 'message' })` |
| Config file missing | `fs.readFileSync` throws — let it crash loudly |
| Aggregator missing data | Nullish coalescing with sensible defaults |

## Key Bindings System

Key bindings are stored in `server/config/keybindings.json` (user-editable).

**SendKeys notation:** `{F1}`–`{F12}`, `^a` (Ctrl+A), `+a` (Shift+A), `%a` (Alt+A), `{ENTER}`, `{ESC}`, `{SPACE}`, arrow keys.

**Adding a new System Flag / key binding:**
1. Add the action key to `server/config/keybindings.json`
2. Add an entry to `FLAG_CONFIG` in `client/src/components/SystemFlags.tsx` with the matching `key` from `FlightState`
3. Add the field to `FlightState` in `client/src/types/gameData.ts` if it doesn't exist
4. Map the field in `server/dataAggregator.js` `getState()` from `ext.shipStatus.*`

## Game State Model

All frontend types are in `client/src/types/gameData.ts`. Top-level `GameState` fields:

| Field | Type | Source widget |
|-------|------|---------------|
| `_meta` | `ConnectionMeta` | Server |
| `player` | `PlayerInfo` | `playerProfile` |
| `ship` | `ShipStatus` | `shipStatus` |
| `flight` | `FlightState` | `shipStatus` |
| `combat` | `CombatState` | Reserved (target always null) |
| `missionOffers` | `MissionOffers \| null` | `mission_offers` |
| `activeMission` | `ActiveMission \| null` | `active_mission` |
| `logbook` | `{ list: LogbookEntry[] } \| null` | `logbook` |
| `currentResearch` | `CurrentResearch \| null` | `current_research` |
| `factions` | `Record \| null` | `factions` |
| `agents` | `any[] \| null` | `agents` |
| `inventory` | `Record \| null` | `inventory` |
| `transactionLog` | `{ list: any[] } \| null` | `transaction_log` |

## Lua Mod

Lives in `game-mods/mycu_external_app/`. Deploy by copying the folder to the X4 extensions directory.
- `ui/config.lua` — `host = 'localhost'`, `port = 3001`
- Each widget POSTs its data independently; the aggregator merges partial updates
- Do not expect all fields to be present on every tick

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |

## What NOT to Do

- Do not enable React StrictMode — it breaks Arwes animations
- Do not add a linter or test framework without explicit user request
- Do not split `index.css` into modules
- Do not use `enum` or `type` aliases where an `interface` works
- Do not use `export default` in client source files
- Do not use async/await in `server/` files
- Do not create new files when editing an existing one is sufficient
