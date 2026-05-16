# Custom Dashboards

X4 Dashboard 2.0 stores user-defined dashboards on the host that runs the server. Browser clients read the same dashboard catalog, so a tablet, side monitor, and localhost browser can share one cockpit setup.

## What Users Can Manage

- Create grid or columns dashboards from the dashboard manager.
- Duplicate built-in dashboards into editable custom dashboards.
- Reorder visible dashboards and hide built-in presets.
- Add existing widgets to panels without changing the Lua bridge.
- Drag and resize panels in grid dashboards.
- Grid editing uses fixed slots: dragging or resizing into an occupied slot is blocked instead of pushing other panels or widgets away.
- Adjust panel and widget scale on custom dashboards.
- Export and import dashboard JSON for backup or sharing.

## Storage Contract

The runtime file is `dashboards.json` in the launcher user-data directory. In development without `X4_USER_DATA_PATH`, the fallback is `server/config/dashboards.json`, which is intentionally ignored by git.

The persisted format is versioned by `schemaVersion` and described by `docs/schemas/dashboard-store.schema.json`. The HTTP contract is described by `docs/api/dashboard-management.openapi.yaml`.

## Compatibility

Built-in dashboards remain source-owned and recoverable. Custom dashboards store only serializable layout data: panel titles, colors, tone rules, placement, widget ids, and scale values. Unknown future widget ids render as unavailable placeholders instead of breaking the whole dashboard.
