---
name: x4-api
description: 'Discover, verify, and use X4: Foundations game APIs and data surfaces across the dashboard bridge, unpacked game files, Mission Director docs, Lua UI/FFI patterns, and community mod references. Use when Codex needs to decide whether a game datum can be extracted for X4 Dashboard, add or debug bridge widgets, trace an unfamiliar `C.*`, `GetComponentData(...)`, `Helper.getMenu(...)`, or MD property, or research UI / Protected UI / breaking-change constraints before changing the bridge.'
---

# X4 API

## Workflow

1. Start from the target datum or dashboard behavior, not from a guessed API name:
   - define the exact field the dashboard needs
   - classify it as player ship, target, inventory, mission, faction, diplomacy, research, transaction/logbook, map/menu helper, or MD-only state
2. Check the local bridge first; treat it as the fastest project-specific proof:
   - `game-mods/x4_dashboard_bridge/ui/widgets/ship_status.lua`
   - `game-mods/x4_dashboard_bridge/ui/widgets/target_info.lua`
   - `game-mods/x4_dashboard_bridge/ui/widgets/inventory.lua`
   - `game-mods/x4_dashboard_bridge/ui/widgets/mission_offers.lua`
   - `game-mods/x4_dashboard_bridge/ui/widgets/active_mission.lua`
   - `game-mods/x4_dashboard_bridge/ui/widgets/current_research.lua`
   - `game-mods/x4_dashboard_bridge/ui/widgets/agents.lua`
   - `game-mods/x4_dashboard_bridge/ui/widgets/transaction_log.lua`
3. Search by usage pattern before inventing code:
   - search for the exact `GetComponentData` key string
   - search for matching `C.Get...`, `C.Is...`, `Get...` helper names
   - search for `ffi.cdef`, `ffi.new`, `Helper.ffiVLA`, and `Helper.getMenu(...)`
4. Inspect the corresponding vanilla game UI or scripts after unpacking the game files if the local bridge does not already expose the datum:
   - unpack catalogs with the official X Catalog Tool or inspect through X4 Customizer / VFS
   - treat unpacked game files as the ground truth for current signatures and data flow
   - prioritize `ui/addons/ego_*/*.xpl`, `md/`, `aiscripts/`, `libraries/*.xsd`, and `scriptproperties.html`
5. Trace visible game screens back to their menu files when doing UI or FFI discovery:
   - player info, inventory, logbook, transactions -> `ego_detailmonitor/menu_playerinfo.xpl`
   - diplomacy, agents, events -> `ego_detailmonitor/menu_diplomacy.xpl`
   - research / HQ -> `ego_detailmonitor/menu_research.xpl`
   - mission / map behavior -> `MapMenu`, `MissionBriefingMenu`, and nearby helpers
6. Cross-check findings with the curated external references in `references/research-sources.md`:
   - use official wiki pages for rules, tools, and compatibility
   - use community gists for fast candidate discovery
   - use public mod repos for working examples and current patterns
7. Mark a datum as confirmed only after finding at least one strong proof:
   - working vanilla or mod code that reads it
   - authoritative MD / XSD / script property documentation
   - a matching FFI signature copied from a shipped or battle-tested menu
8. Treat weaker evidence as tentative:
   - a gist entry alone means `candidate`, not `confirmed`
   - a forum claim without code or docs is a lead, not proof
   - a value visible in the UI is not enough until you trace how that UI obtains it
9. Implement with low-risk probing:
   - copy existing FFI struct and function declarations instead of inventing them
   - wrap exploratory `ffi.cdef` and risky calls in `pcall(...)`
   - use temporary `DebugError(...)` only while probing and remove it before handoff
10. Report provenance in the handoff:
   - local file or external URL used
   - exact function, property, struct, or key names
   - whether the datum is `confirmed`, `tentative`, or `unavailable`

## Source Priority

1. Current local bridge widget code
2. Current unpacked X4 game files plus shipped XSD / `scriptproperties.html`
3. Official Egosoft wiki pages, especially `Modding Support` and `Breaking Changes`
4. Battle-tested public mods that show working call sites
5. Community function indexes and gists
6. Forum discussion without accompanying code

## Heuristics

- Prefer menu-derived FFI over guesswork. If a widget like `agents.lua` copied a struct from a vanilla menu, follow the same pattern.
- Expect `C.GetNumX()` plus `C.GetX(buffer, len)` pairs for collection-style data; use `ffi.new` or `Helper.ffiVLA`.
- Treat `GetComponentData(component, "key")` keys as discoverable strings; verify the key in real code before relying on it.
- Treat `Helper.getMenu("...")` and `menu.someHelper(...)` calls as UI-layer helpers, not generic global APIs.
- Use the X Rebirth Mission Director guide for language syntax and cue semantics, then verify X4 feature availability against shipped X4 files and the Breaking Changes page.
- Re-check Protected UI Mode and recent breaking changes before relying on `require`, loose Lua loading, or older UI patching strategies.
- Start from the screen where the player sees the data. The fastest path is usually `visible menu -> menu file -> helper / FFI / GetComponentData path`.

## Read Next

- Read `references/research-sources.md` when you need concrete URLs, source selection guidance, or the next place to look for a specific API surface.

## Guardrails

- Do not assume a function or key exists because its name sounds plausible.
- Do not treat community indexes as authoritative without code or doc confirmation.
- Do not forget version drift: UI modding is unstable and signatures can change between X4 releases.
- Keep bridge payload changes compatible with the server normalization and aggregation flow.
- Avoid speculative refactors while doing API discovery.
