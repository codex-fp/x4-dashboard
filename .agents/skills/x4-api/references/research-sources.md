# X4 API Research Sources

Use this file when `x4-api` needs concrete sources, links, and a source-selection strategy.

## Priority Order

1. Local bridge widget code in this repository
2. Unpacked current game files plus shipped XSD and `scriptproperties.html`
3. Official Egosoft wiki pages
4. Public GitHub mods and tools with working call sites
5. Community gists and forum discussion

## Official Egosoft Sources

- Modding Support hub:
  [https://wiki.egosoft.com/X4%20Foundations%20Wiki/Modding%20Support/](https://wiki.egosoft.com/X4%20Foundations%20Wiki/Modding%20Support/)
  Use as the top-level map for tools, guides, and forum entry points.
- Breaking Changes:
  [https://wiki.egosoft.com/X4%20Foundations%20Wiki/Modding%20Support/Breaking%20Changes/](https://wiki.egosoft.com/X4%20Foundations%20Wiki/Modding%20Support/Breaking%20Changes/)
  Check before trusting older UI, FFI, or Protected UI assumptions.
- Mission Director Guide:
  [https://wiki.egosoft.com/X%20Rebirth%20Wiki/Modding%20support/Mission%20Director%20Guide/](https://wiki.egosoft.com/X%20Rebirth%20Wiki/Modding%20support/Mission%20Director%20Guide/)
  Use for MD syntax, cue semantics, expressions, and script structure. This is an X Rebirth page linked from X4 Modding Support, so verify feature availability against current X4 files.
- h2odragon's HOWTO-hackx4f:
  [https://wiki.egosoft.com/X4%20Foundations%20Wiki/Modding%20Support/ScriptingMD/Community%20Guides/h2odragon%27s%20HOWTO-hackx4f/](https://wiki.egosoft.com/X4%20Foundations%20Wiki/Modding%20Support/ScriptingMD/Community%20Guides/h2odragon%27s%20HOWTO-hackx4f/)
  Use for unpacking strategy, file structure, `libraries/*.xsd`, `scriptproperties.html`, and the best community entry points for UI / Lua discovery.
- Scripts and Modding forum board:
  [https://forum.egosoft.com/viewforum.php?f=181](https://forum.egosoft.com/viewforum.php?f=181)
  Use to search thread history for menu names, function names, Protected UI Mode, `ffi.cdef`, and older workarounds.
- G_Workaround thread:
  [https://forum.egosoft.com/viewtopic.php?t=363625](https://forum.egosoft.com/viewtopic.php?t=363625)
  Use for historical context on why many UI mods patch or hook Egosoft menus instead of relying on a fully mod-friendly `ui.xml` path.

## Community Indexes

- Event list:
  [https://gist.github.com/NodusCursorius/56f55f267a5f0f5509b6f46c6a1d3703](https://gist.github.com/NodusCursorius/56f55f267a5f0f5509b6f46c6a1d3703)
- VTable list:
  [https://gist.github.com/NodusCursorius/ac6bd44080ebee47662204c1ed983dcb](https://gist.github.com/NodusCursorius/ac6bd44080ebee47662204c1ed983dcb)
- Lua function list:
  [https://gist.github.com/NodusCursorius/b61f26177fdcb490d2456e353d57f363](https://gist.github.com/NodusCursorius/b61f26177fdcb490d2456e353d57f363)
- Initial function / FFI review:
  [https://gist.github.com/NodusCursorius/c8a97cc73a03fe6bdb466863e1a8ef84](https://gist.github.com/NodusCursorius/c8a97cc73a03fe6bdb466863e1a8ef84)

Use these gists to generate candidates and search terms. Do not treat them as final proof without matching code or official docs.

## Public GitHub Repositories

- `bvbohnen/x4-projects` - `sn_mod_support_apis` README:
  [https://github.com/bvbohnen/x4-projects/blob/ba199a43edfb046163a9f35a4ba8811b0933402b/extensions/sn_mod_support_apis/Readme.md](https://github.com/bvbohnen/x4-projects/blob/ba199a43edfb046163a9f35a4ba8811b0933402b/extensions/sn_mod_support_apis/Readme.md)
  Use for current practice around Lua loading, Protected UI Mode limits, named pipes, menu APIs, and inter-process patterns.
- `bvbohnen/x4-projects` - `Userdata_API.md`:
  [https://github.com/bvbohnen/x4-projects/blob/ba199a43edfb046163a9f35a4ba8811b0933402b/extensions/sn_mod_support_apis/documentation/Userdata_API.md](https://github.com/bvbohnen/x4-projects/blob/ba199a43edfb046163a9f35a4ba8811b0933402b/extensions/sn_mod_support_apis/documentation/Userdata_API.md)
  Use when checking save-persistent mod data patterns and cross-save storage constraints.
- `kuertee/x4-mod-ui-extensions` repository:
  [https://github.com/kuertee/x4-mod-ui-extensions](https://github.com/kuertee/x4-mod-ui-extensions)
  Use as a large body of working UI patches and callback-based extensions.
- `kuertee/x4-mod-ui-extensions` - `menu_playerinfo.xpl`:
  [https://github.com/kuertee/x4-mod-ui-extensions/blob/0be80c2815b24180d086df8e8dcad428d59d6be4/ui/addons/ego_detailmonitor/menu_playerinfo.xpl](https://github.com/kuertee/x4-mod-ui-extensions/blob/0be80c2815b24180d086df8e8dcad428d59d6be4/ui/addons/ego_detailmonitor/menu_playerinfo.xpl)
  Use for player info, inventory, logbook, transactions, and large FFI declaration examples.
- `kuertee/x4-mod-ui-extensions` - `menu_diplomacy.xpl`:
  [https://github.com/kuertee/x4-mod-ui-extensions/blob/0be80c2815b24180d086df8e8dcad428d59d6be4/ui/addons/ego_detailmonitor/menu_diplomacy.xpl](https://github.com/kuertee/x4-mod-ui-extensions/blob/0be80c2815b24180d086df8e8dcad428d59d6be4/ui/addons/ego_detailmonitor/menu_diplomacy.xpl)
  Use for diplomacy, agents, event operations, and menu-driven FFI structs that closely match the local `agents.lua` widget.
- `bvbohnen/X4_Customizer`:
  [https://github.com/bvbohnen/X4_Customizer](https://github.com/bvbohnen/X4_Customizer)
  Use for VFS-style inspection, diff patch understanding, enabled-extension overlay behavior, and fast comparison of patched versus vanilla XML.

## Local Project Anchors

- `game-mods/x4_dashboard_bridge/ui/ea.lua`
- `game-mods/x4_dashboard_bridge/ui/widgets/ship_status.lua`
- `game-mods/x4_dashboard_bridge/ui/widgets/target_info.lua`
- `game-mods/x4_dashboard_bridge/ui/widgets/inventory.lua`
- `game-mods/x4_dashboard_bridge/ui/widgets/active_mission.lua`
- `game-mods/x4_dashboard_bridge/ui/widgets/mission_offers.lua`
- `game-mods/x4_dashboard_bridge/ui/widgets/current_research.lua`
- `game-mods/x4_dashboard_bridge/ui/widgets/agents.lua`
- `game-mods/x4_dashboard_bridge/ui/widgets/transaction_log.lua`

Start here before leaving the repository. These files already prove which data surfaces X4 Dashboard uses today.

## Search Strategy By Data Domain

- Player ship, target, combat state:
  Start with local `ship_status.lua` and `target_info.lua`, then inspect `menu_playerinfo.xpl` and the function / FFI gist for nearby `GetPlayer...`, `GetDistanceBetween`, and loadout calls.
- Inventory, wares, logbook, transactions:
  Start with local `inventory.lua` and `transaction_log.lua`, then inspect `menu_playerinfo.xpl` for the same ware and message access patterns.
- Diplomacy and agents:
  Start with local `agents.lua`, then inspect `menu_diplomacy.xpl`. Prefer copying proven structs from menu code rather than reconstructing them from a gist.
- Missions and map-derived data:
  Start with `active_mission.lua` and `mission_offers.lua`, then follow `Helper.getMenu("MapMenu")`, `MissionBriefingMenu`, and their helper methods in unpacked UI files.
- Research and HQ:
  Start with `current_research.lua`, then inspect the related detail monitor menu and shipped research helpers.
- MD-only behavior or script properties:
  Start with unpacked `md/`, `libraries/*.xsd`, and `scriptproperties.html`, then use the Mission Director Guide for syntax clarification.

## Forum Search Terms

Use these when the wiki or local code is not enough:

- `GetComponentData`
- `Protected UI Mode`
- `ffi.cdef`
- `ui.xml`
- `MapMenu`
- `MissionBriefingMenu`
- `menu_playerinfo`
- `menu_diplomacy`
- `Named Pipes API`
- `G_Workaround`

## Decision Rule

Answer "can the dashboard extract this?" in one of three states:

- `confirmed`: located a real call site or authoritative doc
- `tentative`: found only an index entry, forum mention, or indirect clue
- `unavailable`: failed to find a supported path after checking local code, unpacked game files, official docs, and mod references
