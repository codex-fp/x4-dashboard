---
name: explore-x4-api
description: Discover and use X4: Foundations Lua API functions when implementing new widget data extraction or game integration features.
compatibility: opencode
---

# Explore X4: Foundations API

## Use this when

- Implementing a new widget that needs game data not yet exposed in the bridge.
- Discovering how to extract specific game state (e.g., ship stats, faction relations, inventory).
- Debugging why a Lua API call returns unexpected results.
- Researching available FFI bindings for C functions in X4.

## Knowledge Sources

### Primary: Existing Bridge Code

The most reliable API reference is the existing widget implementations in `game-mods/x4_dashboard_bridge/ui/widgets/`. Each widget demonstrates real API usage patterns.

Key files to study:
- `ship_status.lua` - FFI bindings for ship statistics, combat state, flight modes
- `inventory.lua` - Ware data, storage APIs, cargo retrieval
- `factions.lua` - Faction relations, licenses, reputation
- `agents.lua` - Diplomacy system, agent operations, complex FFI structs
- `target_info.lua` - Target scanning, component data
- `player_profile.lua` - Player stats, money, reputation

### Secondary: External Resources

When the bridge code doesn't cover the needed API, consult these sources:

1. **GitHub Repositories**
   - `Alia5/X4-rest-server` - REST server implementation with FFI bindings
   - `crissian/x4` - X4 Utilities & Database (game data extraction)
   - `mycumycu/X4-External-App` - External app integration patterns

2. **Egosoft Forums**
   - Modding forum: `forum.egosoft.com/viewforum.php?f=181`
   - Search for "Lua API", "MD script", "UI extension"

3. **Game Files** (when running the game)
   - X4 installs Lua source files that can be inspected
   - Path: `<X4 install>/extensions/` - official extensions show API patterns
   - Path: `<X4 install>/ui/` - UI scripts use the same APIs

### Tertiary: In-Game Exploration

When documentation is insufficient, use runtime discovery:

1. **DebugError logging** - Print values to X4's log:
   ```lua
   DebugError("X4DashboardBridge: " .. tostring(someValue))
   ```

2. **pcall wrapping** - Safely explore unknown APIs:
   ```lua
   local ok, result = pcall(someUnknownFunction, arg1, arg2)
   if ok then
       DebugError("X4DashboardBridge: result=" .. tostring(result))
   else
       DebugError("X4DashboardBridge: error=" .. tostring(result))
   end
   ```

3. **Type inspection** - Discover table structures:
   ```lua
   for k, v in pairs(someTable) do
       DebugError("X4DashboardBridge: key=" .. tostring(k) .. " value=" .. tostring(v))
   end
   ```

## API Categories

### FFI C Functions

X4 exposes C functions through LuaJIT FFI. Declare them with `ffi.cdef`:

```lua
local ffi = require("ffi")
local C = ffi.C

pcall(ffi.cdef, [[
    typedef uint64_t UniverseID;
    UniverseID GetPlayerOccupiedShipID(void);
    double GetCurrentGameTime(void);
    // Add more declarations as needed
]])
```

Common patterns:
- `GetPlayer*` - Player-specific data
- `Get*Data(component, "property", ...)` - Component property queries
- `GetNum*` / `Get*Buffer` - Array/buffer patterns for collections

### Lua Helper Functions

X4 provides Lua helper functions (no FFI needed):

```lua
GetComponentData(component, "name", "icon", "idcode")
GetFactionData(faction, "shortname", "ishostile")
GetWareData(ware, "name", "iscraftingresource")
GetPlayerContextByClass("zone")
GetPlayerInventory()
GetPlayerActivity()
ConvertStringTo64Bit(str)
ConvertStringToLuaID(str)
ReadText(page, id)  -- Localized text
```

### Helper Library

The `Helper` library provides UI utilities:

```lua
Helper.getMenu("MapMenu")
Helper.getHoloMapColors()
```

### Event System

Register for game events:

```lua
RegisterEvent("eventName", handlerFunction)
```

Common events:
- `x4dashboardbridge.getMessages` - Custom event for data polling
- Game-specific events for missions, combat, etc.

## Discovery Workflow

When you need to extract new game data:

1. **Check existing widgets first** - The API pattern may already exist.

2. **Search for similar data** - Look for related functions in existing code:
   ```bash
   grep -r "GetPlayer" game-mods/x4_dashboard_bridge/
   grep -r "GetComponent" game-mods/x4_dashboard_bridge/
   ```

3. **Identify the data source** - Is it:
   - Player-specific? → `GetPlayer*` functions
   - Component-specific? → `GetComponentData`
   - Faction-related? → `GetFactionData`
   - Ware/inventory? → `GetWareData`, `GetUnitStorageData`
   - Time-based? → `GetCurrentGameTime`

4. **Declare FFI if needed** - For C functions not in Lua helpers:
   - Find similar declarations in existing widgets
   - Match the C signature exactly
   - Use `pcall(ffi.cdef, ...)` to avoid redefinition errors

5. **Handle errors gracefully** - Wrap calls in pcall:
   ```lua
   local ok, result = pcall(C.SomeFunction, arg)
   if not ok then
       DebugError("X4DashboardBridge: SomeFunction failed: " .. tostring(result))
       return nil
   end
   ```

6. **Test incrementally** - Add logging, verify output, then clean up.

## Common Patterns

### Getting Player Ship

```lua
local shipId = C.GetPlayerOccupiedShipID()
if shipId == 0 then
    shipId = C.GetPlayerControlledShipID()
end
```

### Getting Component Data

```lua
local name, icon, idcode = GetComponentData(component, "name", "icon", "idcode")
```

### Iterating Collections

```lua
local count = C.GetNumDiplomacyAgents()
if count > 0 then
    local buffer = ffi.new("UniverseID[?]", count)
    count = C.GetDiplomacyAgents(buffer, count)
    for i = 0, count - 1 do
        local agentId = buffer[i]
        -- process agent
    end
end
```

### Safe Type Conversion

```lua
local value = tonumber(someValue) or 0
local str = ffi.string(someCString)
```

## Output

When using this skill, report:

1. Which API functions you discovered or used
2. The source of the discovery (existing code, external repo, in-game exploration)
3. Any FFI declarations added
4. How to verify the data extraction works correctly

## Guardrails

- Always use `pcall` for FFI declarations to avoid redefinition errors
- Always use `pcall` for experimental API calls that might fail
- Never assume a function exists without checking existing patterns first
- Prefer Lua helper functions over FFI when both are available
- Log discoveries with `DebugError` for debugging, remove in production
- Match the existing code style in `game-mods/x4_dashboard_bridge/`