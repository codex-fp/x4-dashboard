const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DataAggregator = require('./dataAggregator');
const MockDataSource = require('./mockData');
const keyPresser = require('./keyPresser');
const { normalizeData } = require('./utils/normalizeData');
const { readKeybindings, writeKeybindings, mergeKeybindingUpdates } = require('./keybindingsStore');
const { requireLocalControlRequest } = require('./requestGuards');
const { readRuntimeConfig } = require('./runtimeConfigStore');

const PORT = process.env.PORT || 3001;
const MOCK_MODE = process.argv.includes('--mock') || process.env.MOCK === 'true';
const publicDir = path.join(__dirname, 'public');
const publicIndexPath = path.join(publicDir, 'index.html');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const aggregator = new DataAggregator();

let mock = null;

// === Express + static client ===
app.use(express.json({ limit: '10mb' }));

function registerClientRoutes() {
  if (fs.existsSync(publicIndexPath)) {
    app.use(express.static(publicDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(publicIndexPath);
    });
    return;
  }

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.status(503).type('html').send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>X4 Dashboard - build required</title>
  </head>
  <body style="font-family: sans-serif; padding: 24px; line-height: 1.5;">
    <h1>Client build required</h1>
    <p>This checkout keeps source files only. Build the frontend before opening the dashboard.</p>
    <pre style="background: #f4f4f4; padding: 12px;">npm run build
npm start</pre>
  </body>
</html>`);
  });
}

registerClientRoutes();

// === WebSocket server ===
function serializeState() {
  const state = aggregator.getState();
  return { ...state, _meta: { ...state._meta, mockMode: MOCK_MODE } };
}

function broadcast(data) {
  const message = JSON.stringify(data);

  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) {
      continue;
    }

    try {
      client.send(message);
    } catch {
      // ignore
    }
  }
}

function broadcastState() {
  broadcast(serializeState());
}

wss.on('connection', (ws, req) => {
  console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);
  ws.send(JSON.stringify(serializeState()));
  ws.on('error', (err) => console.log(`[WS] Client error: ${err.message}`));
  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// === Data sources ===
function onExternalData(data) {
  aggregator.updateExternal(data);
  broadcastState();
}

if (MOCK_MODE) {
  mock = new MockDataSource();
  mock.on('data', onExternalData);
  mock.start();
}

// === REST API ===
app.post('/api/data', (req, res) => {
  if (!MOCK_MODE) {
    const data = normalizeData(req.body || {});
    onExternalData({ ...data, _connected: true });
  }

  res.send('ok');
});

app.post('/api/keypress', requireLocalControlRequest, (req, res) => {
  const action = typeof req.body?.action === 'string' ? req.body.action.trim() : '';
  if (!action) {
    return res.status(400).json({ error: 'action is required' });
  }

  let keybindings;
  try {
    keybindings = readKeybindings();
  } catch (err) {
    return res.status(500).json({ error: `Cannot read keybindings: ${err.message}` });
  }

  const binding = keybindings.bindings?.[action];
  if (!binding) {
    return res.status(404).json({
      error: `Unknown action: ${action}`,
      available: Object.keys(keybindings.bindings || {}),
    });
  }

  keyPresser.press(binding.key, binding.modifiers || []);
  return res.json({ ok: true, action, key: binding.key });
});

app.get('/api/keybindings', requireLocalControlRequest, (req, res) => {
  try {
    res.json(readKeybindings());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/keybindings', requireLocalControlRequest, (req, res) => {
  try {
    const current = readKeybindings();
    const updates = req.body?.bindings || {};
    const next = mergeKeybindingUpdates(current, updates);

    writeKeybindings(next);
    console.log('[Keybindings] Updated:', Object.keys(updates).join(', '));
    res.json(next);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function registerMockToggleRoute(route, action, stateKey) {
  app.post(route, (req, res) => {
    if (!MOCK_MODE || !mock) {
      return res.status(404).json({ error: 'Not in mock mode' });
    }

    action();
    return res.json({ ok: true, [stateKey]: mock[stateKey] });
  });
}

registerMockToggleRoute('/api/mock/combat', () => mock.toggleCombat(), 'inCombat');
registerMockToggleRoute('/api/mock/travel', () => mock.toggleTravel(), 'travelDrive');
registerMockToggleRoute('/api/mock/boost', () => mock.toggleBoost(), 'boosting');

app.get('/api/state', (req, res) => {
  res.json(aggregator.getState());
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, externalConnected: aggregator.externalConnected });
});

// === Start server ===
server.listen({ port: PORT, host: '::', ipv6Only: false }, () => {
  const lan = Object.values(os.networkInterfaces())
    .flat()
    .find((iface) => iface && iface.family === 'IPv4' && !iface.internal);

  console.log('\n========================================');
  console.log('  X4 Foundations Dashboard Server');
  if (MOCK_MODE) console.log('  *** MOCK MODE - preview only ***');
  console.log('========================================');
  console.log(`  Open:   http://localhost:${PORT}`);
  if (lan) console.log(`  LAN:    http://${lan.address}:${PORT}`);
  if (!MOCK_MODE) console.log(`  Data:   POST http://localhost:${PORT}/api/data`);
  if (!fs.existsSync(publicIndexPath)) console.log('  Client: Build required (`npm run build`)');
  console.log(`  Controls: ${readRuntimeConfig().allowRemoteControls ? 'remote enabled' : 'localhost only'}`);
  console.log('========================================\n');
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  mock?.stop();
  server.close(() => process.exit(0));
});
