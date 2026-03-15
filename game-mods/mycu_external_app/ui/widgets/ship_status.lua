local ffi = require("ffi")
local C = ffi.C

pcall(ffi.cdef, [[
    typedef uint64_t UniverseID;
    UniverseID GetPlayerOccupiedShipID(void);
    UniverseID GetPlayerControlledShipID(void);
    bool IsFlightAssistActive(void);
    bool IsShipAtExternalDock(UniverseID shipid);
    float GetBoostEnergyPercentage(void);
    bool IsSetaActive(void);
    const char* GetPlayerShipSize(void);
    float GetObjectMaxForwardSpeed(UniverseID objectid, bool includeboost);
    int GetAlertLevel(UniverseID componentid);
    int GetNumAllAttackers(UniverseID componentid);
    int GetNumIncomingMissiles(UniverseID componentid);
]])

-- GetObjectMaxTravelSpeed may not exist in all X4 versions; load separately so
-- a missing symbol doesn't break the block above.
pcall(ffi.cdef, [[
    float GetObjectMaxTravelSpeed(UniverseID objectid);
]])

local output = {}

function output.handle()
    local shipId = C.GetPlayerOccupiedShipID()
    if shipId == 0 then
        return nil
    end

    local hull, shields = GetPlayerShipHullShield()
    local _, _, speedPerSecond, boosting, travelMode = GetPlayerSpeed()
    local maxSpeed      = C.GetObjectMaxForwardSpeed(shipId, false)
    local maxBoostSpeed = C.GetObjectMaxForwardSpeed(shipId, true)
    local maxTravelSpeed = 0
    pcall(function() maxTravelSpeed = C.GetObjectMaxTravelSpeed(shipId) end)

    local alertLevel       = 0
    local attackerCount    = 0
    local incomingMissiles = 0
    pcall(function() alertLevel       = C.GetAlertLevel(shipId) end)
    pcall(function() attackerCount    = C.GetNumAllAttackers(shipId) end)
    pcall(function() incomingMissiles = C.GetNumIncomingMissiles(shipId) end)

    return {
        name         = ffi.string(C.GetComponentName(shipId)),
        hull         = hull or 0,
        shields      = shields or 0,
        speed         = math.floor(speedPerSecond or 0),
        maxSpeed      = math.floor(maxSpeed      or 0),
        maxBoostSpeed = math.floor(maxBoostSpeed  or 0),
        maxTravelSpeed = math.floor(maxTravelSpeed or 0),
        boosting      = boosting or false,
        travelMode   = travelMode or false,
        flightAssist = C.IsFlightAssistActive(),
        boostEnergy  = math.floor(C.GetBoostEnergyPercentage()),
        docked       = C.IsShipAtExternalDock(C.GetPlayerControlledShipID()),
        seta         = C.IsSetaActive(),
        shipSize     = ffi.string(C.GetPlayerShipSize()),
        alertLevel        = tonumber(alertLevel)       or 0,
        attackerCount     = tonumber(attackerCount)    or 0,
        incomingMissiles  = tonumber(incomingMissiles) or 0,
    }
end

return output
