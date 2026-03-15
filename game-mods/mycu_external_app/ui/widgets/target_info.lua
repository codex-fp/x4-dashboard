local ffi = require("ffi")
local C = ffi.C

pcall(ffi.cdef, [[
    typedef uint64_t UniverseID;
    UniverseID GetPlayerTarget(void);
    UniverseID GetPlayerControlledShipID(void);
    bool IsHostile(UniverseID defensiveunitid, UniverseID offensiveunitid);
]])

local output = {}

-- distance changes every tick — exclude it from hash so we don't
-- spam updates while a target is locked but nothing else changed
output.hashExclusions = { "distance" }

function output.handle()
    local targetId = C.GetPlayerTarget()

    -- No target: return sentinel so aggregator can clear combat.target.
    -- We must NOT return nil here because the aggregator merge semantics
    -- would keep stale target data from the previous tick.
    if targetId == 0 then
        return { hasTarget = false }
    end

    local name = ffi.string(C.GetComponentName(targetId))
    local targetKey = ConvertStringTo64Bit(tostring(targetId))

    -- Hull: GetComponentData "hull" returns a 0-1 float in X4
    local hull = 0
    local hullRaw = GetComponentData(targetKey, "hull")
    if hullRaw then
        hull = math.floor(math.max(0, math.min(1, hullRaw)) * 100)
    end

    -- Shields: "shieldpercent" may return 0-1 or 0-100; normalise both
    local shields = 0
    local shieldsRaw = GetComponentData(targetKey, "shieldpercent")
    if shieldsRaw then
        if shieldsRaw <= 1 then
            shields = math.floor(shieldsRaw * 100)
        else
            shields = math.floor(shieldsRaw)
        end
    end

    -- Faction short name via owner component
    local faction = ""
    local owner = GetComponentData(targetKey, "owner")
    if owner and owner ~= "" then
        local ok, fname = pcall(GetFactionData, owner, "shortname")
        if ok and fname then faction = fname end
    end

    -- Hostility: is the target hostile to the player's ship?
    local isHostile = false
    local shipId = C.GetPlayerControlledShipID()
    if shipId ~= 0 then
        pcall(function() isHostile = C.IsHostile(shipId, targetId) end)
    end

    return {
        hasTarget   = true,
        name        = name,
        shipName    = "",
        hull        = hull,
        shields     = shields,
        faction     = faction,
        isHostile   = isHostile,
        legalStatus = "",
        combatRank  = "",
        bounty      = 0,
        distance    = 0,
    }
end

return output
