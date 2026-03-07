/**
 * X4 Dashboard Server
 * Aggregates data from X4 External App, broadcasts unified state via WebSocket,
 * and handles key press commands.
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const DataAggregator = require('./dataAggregator');
const MockDataSource = require('./mockData');
const keyPresser = require('./keyPresser');
const { normalizeData } = require('./utils/normalizeData');

const PORT = process.env.PORT || 3001;
const KEYBINDINGS_PATH = path.join(__dirname, 'config', 'keybindings.json');

const MOCK_MODE = process.argv.includes('--mock') || process.env.MOCK === 'true';

// === Express + HTTP server ===
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve built client from server/public (disabled in mock mode — use Vite on :3000 for HMR)
if (!MOCK_MODE) {
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(publicDir, 'index.html'));
    });
  }
}

const server = http.createServer(app);

// === WebSocket server ===
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try { client.send(msg); } catch { /* ignore */ }
    }
  }
}

function broadcastState() {
  const state = aggregator.getState();
  broadcast({ ...state, _meta: { ...state._meta, mockMode: MOCK_MODE } });
}

wss.on('connection', (ws, req) => {
  console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);
  const state = aggregator.getState();
  ws.send(JSON.stringify({ ...state, _meta: { ...state._meta, mockMode: MOCK_MODE } }));
  ws.on('error', (err) => console.log(`[WS] Client error: ${err.message}`));
  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// === Data aggregation ===
const aggregator = new DataAggregator();

function onExternalData(data) {
  aggregator.updateExternal(data);
  broadcastState();
}

let mock = null;

if (MOCK_MODE) {
  mock = new MockDataSource();
  mock.on('data', onExternalData);
  mock.start();
}

// === REST API ===

// Receives game data pushed directly from the X4 Lua mod (mycu_external_app)
app.post('/api/data', (req, res) => {
  if (!MOCK_MODE) {
    const data = normalizeData(req.body || {});
    onExternalData({ ...data, _connected: true });
  }
  res.send('ok');
});

app.post('/api/keypress', (req, res) => {
  const { action } = req.body || {};
  if (!action) return res.status(400).json({ error: 'action is required' });

  let bindings;
  try {
    bindings = JSON.parse(fs.readFileSync(KEYBINDINGS_PATH, 'utf8'));
  } catch (err) {
    return res.status(500).json({ error: `Cannot read keybindings: ${err.message}` });
  }

  const binding = bindings.bindings?.[action];
  if (!binding) {
    return res.status(404).json({ error: `Unknown action: ${action}`, available: Object.keys(bindings.bindings || {}) });
  }

  keyPresser.press(binding.key, binding.modifiers || []);
  res.json({ ok: true, action, key: binding.key });
});

app.get('/api/keybindings', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(KEYBINDINGS_PATH, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/keybindings', (req, res) => {
  try {
    const current = JSON.parse(fs.readFileSync(KEYBINDINGS_PATH, 'utf8'));
    const updates = req.body?.bindings || {};
    const updated = {
      ...current,
      bindings: { ...current.bindings, ...updates },
    };
    fs.writeFileSync(KEYBINDINGS_PATH, JSON.stringify(updated, null, 2));
    console.log('[Keybindings] Updated:', Object.keys(updates).join(', '));
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mock/combat', (req, res) => {
  if (!MOCK_MODE || !mock) return res.status(404).json({ error: 'Not in mock mode' });
  mock.toggleCombat();
  res.json({ ok: true, inCombat: mock.inCombat });
});

app.get('/api/state', (req, res) => {
  res.json(aggregator.getState());
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, externalConnected: aggregator.externalConnected });
});

// === Start server ===
server.listen(PORT, '0.0.0.0', () => {
  const ifaces = require('os').networkInterfaces();
  const lan = Object.values(ifaces).flat().find(i => i.family === 'IPv4' && !i.internal);

  console.log('\n========================================');
  console.log('  X4 Foundations Dashboard Server');
  if (MOCK_MODE) console.log('  *** MOCK MODE — preview only ***');
  console.log('========================================');
  console.log(`  Open:   http://localhost:${PORT}`);
  if (lan) console.log(`  LAN:    http://${lan.address}:${PORT}`);
  if (!MOCK_MODE) console.log(`  Data:   POST http://localhost:${PORT}/api/data`);
  console.log('========================================\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  mock?.stop();
  server.close(() => process.exit(0));
});
