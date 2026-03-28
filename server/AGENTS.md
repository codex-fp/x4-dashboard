# AGENTS.md

Server-specific guidance for the Express and WebSocket backend.

## Scope

- `server/` owns HTTP routes, WebSocket broadcasts, game-state aggregation, runtime config, and mock data.
- Keep browser-only UI concerns in `client/` and host launcher concerns in `launcher/`.

## Module Rules

- Use CommonJS with `.js`.
- Do not introduce `async/await`; follow the existing callback and synchronous patterns.
- Use synchronous config reads where the current code expects them.
- Keep section comments in the existing style, for example `// === WebSocket server ===`.

## Error Handling

- HTTP routes should return JSON errors with explicit status codes.
- WebSocket or JSON parse failures may stay as silent `catch {}` where the current code already uses that pattern.
- WebSocket send failures should remain silent where the repo already does that.
- Key press failures should use `console.error(...)`.
- Missing config files may crash loudly if the current code already expects that.
- Clamp numeric values and use defensive nullish handling where the aggregation logic already does so.

## Data Flow

- `server/dataAggregator.js` owns durable state assembly.
- `server/utils/normalizeData.js` owns X4 text normalization.
- `server/mockData.js` owns mock-mode payload coverage.
- When exporting a new game field, coordinate with the root rules:
  - update `client/src/types/gameData.ts`
  - update `getState()` in `server/dataAggregator.js`
  - update `server/mockData.js` when mock mode should expose it

## Tests

- Jest lives in `server/__tests__/`.
- Add or update tests for new normalization, aggregation, or regression-prone server logic when practical.
- Run `npm test` for meaningful server logic changes when practical.
