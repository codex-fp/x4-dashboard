const fs = require('fs');
const path = require('path');

const { BUILT_IN_DASHBOARDS } = require('./dashboardBuiltIns');

const SCHEMA_VERSION = 1;
const DEFAULT_DASHBOARD_STORE_PATH = path.join(__dirname, 'config', 'dashboards.json');
const MAX_CUSTOM_DASHBOARDS = 60;
const MAX_PANELS = 80;
const MAX_WIDGETS = 240;
const MAX_COLUMNS = 8;
const MAX_STRING_LENGTH = 140;
const PANEL_COLORS = new Set(['primary', 'danger', 'success', 'warning', 'purple']);
const TONE_RULES = new Set(['fixed', 'targetHostility', 'missionUrgency']);
const BUILT_IN_IDS = new Set(BUILT_IN_DASHBOARDS.map((dashboard) => dashboard.id));

function getDashboardStorePath() {
  return process.env.X4_USER_DATA_PATH
    ? path.join(process.env.X4_USER_DATA_PATH, 'dashboards.json')
    : DEFAULT_DASHBOARD_STORE_PATH;
}

function getDefaultDashboardStore() {
  return {
    schemaVersion: SCHEMA_VERSION,
    dashboardStoreVersion: 1,
    selectedDashboardId: 'flight',
    builtInOrder: BUILT_IN_DASHBOARDS.map((dashboard) => dashboard.id),
    hiddenBuiltInDashboardIds: [],
    customDashboards: [],
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeString(value, fallback, maxLength = MAX_STRING_LENGTH) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, maxLength);
}

function sanitizeOptionalString(value, maxLength = MAX_STRING_LENGTH) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function sanitizeId(value, fallback) {
  const id = sanitizeString(value, fallback, 96);
  return id.replace(/[^a-zA-Z0-9:._-]/g, '-');
}

function sanitizeCssValue(value, fallback, maxLength = 80) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return fallback;
  return /^[a-zA-Z0-9().,%\s+\-_/]+$/.test(trimmed) ? trimmed : fallback;
}

function sanitizeOptionalCssValue(value, maxLength = 80) {
  const sanitized = sanitizeCssValue(value, '', maxLength);
  return sanitized || undefined;
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function sanitizeBoolean(value) {
  return value === true;
}

function uniqueStrings(values, allowedSet) {
  const result = [];
  const seen = new Set();

  for (const value of Array.isArray(values) ? values : []) {
    const id = sanitizeId(value, '');
    if (!id || seen.has(id)) continue;
    if (allowedSet && !allowedSet.has(id)) continue;
    seen.add(id);
    result.push(id);
  }

  return result;
}

function sanitizeWidgetBase(value, index) {
  const input = isPlainObject(value) ? value : {};
  const widget = {
    id: sanitizeId(input.id, `UnknownWidget${index + 1}`),
  };
  const scale = clampNumber(input.scale, 0.5, 2.5, 1);
  if (scale !== 1) widget.scale = scale;
  if (sanitizeBoolean(input.grow)) widget.grow = true;
  const height = sanitizeOptionalCssValue(input.height, 40);
  if (height) widget.height = height;
  return widget;
}

function sanitizeGridWidget(value, index) {
  const input = isPlainObject(value) ? value : {};
  const widget = sanitizeWidgetBase(input, index);
  widget.col = Math.round(clampNumber(input.col, 1, 24, 1));
  widget.row = Math.round(clampNumber(input.row, 1, 80, index + 1));
  const colSpan = Math.round(clampNumber(input.colSpan, 1, 24, 1));
  const rowSpan = Math.round(clampNumber(input.rowSpan, 1, 40, 1));
  if (colSpan > 1) widget.colSpan = colSpan;
  if (rowSpan > 1) widget.rowSpan = rowSpan;
  return widget;
}

function sanitizeColumnWidget(value, index) {
  return sanitizeWidgetBase(value, index);
}

function sanitizeInternalLayout(value) {
  const input = isPlainObject(value) ? value : {};

  if (input.layout === 'grid') {
    const layout = {
      layout: 'grid',
      columns: sanitizeCssValue(input.columns, 'repeat(2, minmax(0, 1fr))'),
      widgets: (Array.isArray(input.widgets) ? input.widgets : [])
        .slice(0, MAX_WIDGETS)
        .map(sanitizeGridWidget),
    };
    const rows = sanitizeOptionalCssValue(input.rows);
    const gap = sanitizeOptionalCssValue(input.gap, 32);
    const width = sanitizeOptionalCssValue(input.width, 40);
    if (rows) layout.rows = rows;
    if (gap) layout.gap = gap;
    if (width) layout.width = width;
    return layout;
  }

  return {
    layout: 'columns',
    columns: (Array.isArray(input.columns) && input.columns.length ? input.columns : [{ widgets: [] }])
      .slice(0, MAX_COLUMNS)
      .map((column) => ({
        ...(sanitizeOptionalCssValue(column?.width, 40) ? { width: sanitizeOptionalCssValue(column.width, 40) } : {}),
        widgets: (Array.isArray(column?.widgets) ? column.widgets : [])
          .slice(0, MAX_WIDGETS)
          .map(sanitizeColumnWidget),
      })),
  };
}

function sanitizePanelDisplay(value, index) {
  const input = isPlainObject(value) ? value : {};
  const panel = {
    id: sanitizeId(input.id, `panel-${index + 1}`),
    internal: sanitizeInternalLayout(input.internal),
  };
  const title = sanitizeOptionalString(input.title);
  const titleIcon = sanitizeOptionalString(input.titleIcon, 8);
  const color = PANEL_COLORS.has(input.color) ? input.color : undefined;
  const toneRule = TONE_RULES.has(input.toneRule) ? input.toneRule : undefined;
  if (title) panel.title = title;
  if (titleIcon) panel.titleIcon = titleIcon;
  if (color) panel.color = color;
  if (toneRule) panel.toneRule = toneRule;
  if (sanitizeBoolean(input.frameless)) panel.frameless = true;
  return panel;
}

function sanitizeGridPanel(value, index) {
  const input = isPlainObject(value) ? value : {};
  const panel = sanitizePanelDisplay(input, index);
  panel.col = Math.round(clampNumber(input.col, 1, 24, 1));
  panel.row = Math.round(clampNumber(input.row, 1, 80, index + 1));
  const colSpan = Math.round(clampNumber(input.colSpan, 1, 24, 4));
  const rowSpan = Math.round(clampNumber(input.rowSpan, 1, 40, 4));
  if (colSpan > 1) panel.colSpan = colSpan;
  if (rowSpan > 1) panel.rowSpan = rowSpan;
  const scale = clampNumber(input.scale, 0.5, 2.5, 1);
  if (scale !== 1) panel.scale = scale;
  if (sanitizeBoolean(input.grow)) panel.grow = true;
  const height = sanitizeOptionalCssValue(input.height, 40);
  if (height) panel.height = height;
  return panel;
}

function sanitizeColumnPanel(value, index) {
  const input = isPlainObject(value) ? value : {};
  const panel = sanitizePanelDisplay(input, index);
  const scale = clampNumber(input.scale, 0.5, 2.5, 1);
  if (scale !== 1) panel.scale = scale;
  if (sanitizeBoolean(input.grow)) panel.grow = true;
  const height = sanitizeOptionalCssValue(input.height, 40);
  if (height) panel.height = height;
  return panel;
}

function sanitizeCustomDashboard(value, index, usedIds) {
  const input = isPlainObject(value) ? value : {};
  let id = sanitizeId(input.id, `custom:dashboard-${index + 1}`);
  if (!id.startsWith('custom:')) id = `custom:${id}`;
  while (usedIds.has(id)) {
    id = `${id}-${index + 1}`;
  }
  usedIds.add(id);

  if (input.layout === 'columns') {
    return {
      id,
      label: sanitizeString(input.label, `Custom Dashboard ${index + 1}`),
      layout: 'columns',
      columns: (Array.isArray(input.columns) && input.columns.length ? input.columns : [{ panels: [] }])
        .slice(0, MAX_COLUMNS)
        .map((column) => ({
          ...(sanitizeOptionalCssValue(column?.width, 40) ? { width: sanitizeOptionalCssValue(column.width, 40) } : {}),
          panels: (Array.isArray(column?.panels) ? column.panels : [])
            .slice(0, MAX_PANELS)
            .map(sanitizeColumnPanel),
        })),
    };
  }

  return {
    id,
    label: sanitizeString(input.label, `Custom Dashboard ${index + 1}`),
    layout: 'grid',
    columns: sanitizeCssValue(input.columns, 'repeat(12, minmax(0, 1fr))'),
    rows: sanitizeOptionalCssValue(input.rows),
    autoRows: sanitizeCssValue(input.autoRows, 'minmax(88px, 1fr)'),
    panels: (Array.isArray(input.panels) ? input.panels : [])
      .slice(0, MAX_PANELS)
      .map(sanitizeGridPanel),
  };
}

function sanitizeDashboardStore(value) {
  const defaults = getDefaultDashboardStore();
  const input = isPlainObject(value) ? value : {};
  const usedCustomIds = new Set();
  const customDashboards = (Array.isArray(input.customDashboards) ? input.customDashboards : [])
    .slice(0, MAX_CUSTOM_DASHBOARDS)
    .map((dashboard, index) => sanitizeCustomDashboard(dashboard, index, usedCustomIds));
  const allIds = new Set([...BUILT_IN_IDS, ...customDashboards.map((dashboard) => dashboard.id)]);
  const selectedDashboardId = allIds.has(input.selectedDashboardId)
    ? input.selectedDashboardId
    : defaults.selectedDashboardId;

  return {
    schemaVersion: SCHEMA_VERSION,
    dashboardStoreVersion: Math.max(1, Math.round(clampNumber(input.dashboardStoreVersion, 1, Number.MAX_SAFE_INTEGER, defaults.dashboardStoreVersion))),
    selectedDashboardId,
    builtInOrder: uniqueStrings(input.builtInOrder, BUILT_IN_IDS).concat(
      defaults.builtInOrder.filter((id) => !uniqueStrings(input.builtInOrder, BUILT_IN_IDS).includes(id))
    ),
    hiddenBuiltInDashboardIds: uniqueStrings(input.hiddenBuiltInDashboardIds, BUILT_IN_IDS),
    customDashboards,
  };
}

function readConfigFile(configPath) {
  return sanitizeDashboardStore(JSON.parse(fs.readFileSync(configPath, 'utf8')));
}

function readDashboardStore() {
  const dashboardStorePath = getDashboardStorePath();

  try {
    if (fs.existsSync(dashboardStorePath)) {
      return readConfigFile(dashboardStorePath);
    }
  } catch {
    return getDefaultDashboardStore();
  }

  return getDefaultDashboardStore();
}

function writeDashboardStore(value) {
  const current = readDashboardStore();
  const next = sanitizeDashboardStore(value);
  next.dashboardStoreVersion = Math.max(current.dashboardStoreVersion + 1, Date.now());
  const dashboardStorePath = getDashboardStorePath();

  fs.mkdirSync(path.dirname(dashboardStorePath), { recursive: true });
  fs.writeFileSync(dashboardStorePath, JSON.stringify(next, null, 2));
  return next;
}

function resetDashboardStore() {
  const current = readDashboardStore();
  const next = getDefaultDashboardStore();
  next.dashboardStoreVersion = Math.max(current.dashboardStoreVersion + 1, Date.now());
  const dashboardStorePath = getDashboardStorePath();

  fs.mkdirSync(path.dirname(dashboardStorePath), { recursive: true });
  fs.writeFileSync(dashboardStorePath, JSON.stringify(next, null, 2));
  return next;
}

function createDashboardCatalogPayload(store) {
  const dashboardStore = sanitizeDashboardStore(store || readDashboardStore());

  return {
    ...dashboardStore,
    store: dashboardStore,
    catalog: {
      builtIns: BUILT_IN_DASHBOARDS,
      customDashboards: dashboardStore.customDashboards.map((dashboard) => ({
        id: dashboard.id,
        label: dashboard.label,
        layout: dashboard.layout,
      })),
    },
  };
}

module.exports = {
  DASHBOARD_STORE_PATH: DEFAULT_DASHBOARD_STORE_PATH,
  getDashboardStorePath,
  getDefaultDashboardStore,
  sanitizeDashboardStore,
  readDashboardStore,
  writeDashboardStore,
  resetDashboardStore,
  createDashboardCatalogPayload,
};
