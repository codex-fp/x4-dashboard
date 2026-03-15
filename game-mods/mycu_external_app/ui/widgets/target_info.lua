local ffi = require("ffi")
local C = ffi.C

pcall(ffi.cdef, [[
    typedef uint64_t UniverseID;
    UniverseID GetPlayerOccupiedShipID(void);
    UniverseID GetPlayerControlledShipID(void);
    float GetDistanceBetween(UniverseID component1id, UniverseID component2id);
]])

local output = {}

-- distance changes every tick — exclude it from hash so we don't
-- spam updates while a target is locked but nothing else changed
output.hashExclusions = { "distance" }

function output.handle()
    local targetId = 0
    local rawTargetId = GetPlayerTarget()
    if rawTargetId then
        targetId = ConvertIDTo64Bit(rawTargetId) or 0
    end

    -- No target: return sentinel so aggregator can clear combat.target.
    -- We must NOT return nil here because the aggregator merge semantics
    -- would keep stale target data from the previous tick.
    if targetId == 0 then
        return { hasTarget = false }
    end

    local name, uiName, owner, ownerShortName, isEnemy, wantedMoney = GetComponentData(
        targetId,
        "name",
        "uiname",
        "owner",
        "ownershortname",
        "isenemy",
        "wantedmoney"
    )

    -- Hull and shield percent may return 0-1 or 0-100 depending on context.
    local hull = 0
    local hullRaw = GetComponentData(targetId, "hullpercent")
    if hullRaw then
        if hullRaw <= 1 then
            hull = math.floor(math.max(0, math.min(1, hullRaw)) * 100)
        else
            hull = math.floor(math.max(0, math.min(100, hullRaw)))
        end
    end

    local shields = 0
    local shieldsRaw = GetComponentData(targetId, "shieldpercent")
    if shieldsRaw then
        if shieldsRaw <= 1 then
            shields = math.floor(shieldsRaw * 100)
        else
            shields = math.floor(shieldsRaw)
        end
    end

    -- Faction short name via owner component
    local faction = ownerShortName or ""
    if faction == "" and owner and owner ~= "" then
        local ok, fname = pcall(GetFactionData, owner, "shortname")
        if ok and fname then faction = fname end
    end

    local isHostile = isEnemy == true or isEnemy == 1
    local bounty = tonumber(wantedMoney) or 0
    local legalStatus = bounty > 0 and "Wanted" or ""

    local distance = 0
    local shipId = C.GetPlayerOccupiedShipID()
    if shipId ~= 0 and targetId ~= shipId then
        pcall(function()
            distance = math.floor(C.GetDistanceBetween(shipId, targetId) or 0)
        end)
    end

    return {
        hasTarget   = true,
        name        = name or "",
        shipName    = (uiName and uiName ~= name) and uiName or "",
        hull        = hull,
        shields     = shields,
        faction     = faction,
        isHostile   = isHostile,
        legalStatus = legalStatus,
        combatRank  = "",
        bounty      = math.floor(bounty),
        distance    = distance,
    }
end

return output
