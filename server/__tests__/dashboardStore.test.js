const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  getDefaultDashboardStore,
  getDashboardStorePath,
  readDashboardStore,
  resetDashboardStore,
  sanitizeDashboardStore,
  writeDashboardStore,
} = require('../dashboardStore');

describe('dashboardStore', () => {
  let originalUserDataPath;
  let tempDir;

  beforeEach(() => {
    originalUserDataPath = process.env.X4_USER_DATA_PATH;
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'x4-dashboard-store-'));
    process.env.X4_USER_DATA_PATH = tempDir;
  });

  afterEach(() => {
    if (originalUserDataPath === undefined) {
      delete process.env.X4_USER_DATA_PATH;
    } else {
      process.env.X4_USER_DATA_PATH = originalUserDataPath;
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('uses X4_USER_DATA_PATH for the persisted store', () => {
    expect(getDashboardStorePath()).toBe(path.join(tempDir, 'dashboards.json'));
  });

  it('returns the default store when no file exists', () => {
    expect(readDashboardStore()).toEqual(getDefaultDashboardStore());
  });

  it('writes sanitized dashboards and increments the store version', () => {
    const next = writeDashboardStore({
      selectedDashboardId: 'custom:ops',
      builtInOrder: ['target', 'flight', 'target'],
      hiddenBuiltInDashboardIds: ['ship-controls', 'missing'],
      customDashboards: [{
        id: 'ops',
        label: ' Ops Board ',
        layout: 'grid',
        columns: 'repeat(12, minmax(0, 1fr))',
        panels: [{
          id: 'main',
          title: 'Main',
          color: 'danger',
          toneRule: 'missionUrgency',
          col: -5,
          row: 2,
          colSpan: 99,
          rowSpan: 0,
          scale: 99,
          internal: {
            layout: 'grid',
            columns: 'repeat(2, minmax(0, 1fr))',
            widgets: [{ id: 'Unknown Future Widget', col: 0, row: 1, scale: 9 }],
          },
        }],
      }],
    });

    expect(next.dashboardStoreVersion).toBeGreaterThan(1);
    expect(next.selectedDashboardId).toBe('custom:ops');
    expect(next.builtInOrder.slice(0, 2)).toEqual(['target', 'flight']);
    expect(next.hiddenBuiltInDashboardIds).toEqual(['ship-controls']);
    expect(next.customDashboards[0].id).toBe('custom:ops');
    expect(next.customDashboards[0].panels[0]).toMatchObject({
      col: 1,
      row: 2,
      colSpan: 24,
      scale: 2.5,
    });
    expect(next.customDashboards[0].panels[0].rowSpan).toBeUndefined();
    expect(next.customDashboards[0].panels[0].internal.widgets[0]).toMatchObject({
      id: 'Unknown-Future-Widget',
      col: 1,
      row: 1,
      scale: 2.5,
    });
  });

  it('preserves unknown widget ids without crashing', () => {
    const store = sanitizeDashboardStore({
      customDashboards: [{
        id: 'custom:test',
        label: 'Future',
        layout: 'columns',
        columns: [{
          panels: [{
            id: 'panel',
            internal: {
              layout: 'columns',
              columns: [{ widgets: [{ id: 'FutureWidget' }] }],
            },
          }],
        }],
      }],
    });

    expect(store.customDashboards[0].columns[0].panels[0].internal.columns[0].widgets[0].id).toBe('FutureWidget');
  });

  it('falls back to defaults for invalid JSON without overwriting the bad file', () => {
    const storePath = getDashboardStorePath();
    fs.writeFileSync(storePath, '{ bad json');

    expect(readDashboardStore()).toEqual(getDefaultDashboardStore());
    expect(fs.readFileSync(storePath, 'utf8')).toBe('{ bad json');
  });

  it('resets the store to defaults with a newer version', () => {
    const written = writeDashboardStore({
      selectedDashboardId: 'custom:test',
      customDashboards: [{ id: 'custom:test', label: 'Test', layout: 'grid', panels: [] }],
    });
    const reset = resetDashboardStore();

    expect(reset.customDashboards).toEqual([]);
    expect(reset.dashboardStoreVersion).toBeGreaterThan(written.dashboardStoreVersion);
  });
});
