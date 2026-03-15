local ffi = require("ffi")
local C = ffi.C

pcall(ffi.cdef, [[
    typedef uint64_t UniverseID;
    typedef struct {
        float HullValue;
        float ShieldValue;
        double ShieldDelay;
        float ShieldRate;
        float GroupedShieldValue;
        double GroupedShieldDelay;
        float GroupedShieldRate;
        float BurstDPS;
        float SustainedDPS;
        float TurretBurstDPS;
        float TurretSustainedDPS;
        float GroupedTurretBurstDPS;
        float GroupedTurretSustainedDPS;
        float ForwardSpeed;
        float BoostSpeed;
        float TravelSpeed;
        float YawSpeed;
        float PitchSpeed;
        float RollSpeed;
        float HorizontalStrafeSpeed;
        float VerticalStrafeSpeed;
        float ForwardAcceleration;
        float HorizontalStrafeAcceleration;
        float VerticalStrafeAcceleration;
        uint32_t NumDocksShipMedium;
        uint32_t NumDocksShipSmall;
        uint32_t ShipCapacityMedium;
        uint32_t ShipCapacitySmall;
        uint32_t CrewCapacity;
        uint32_t ContainerCapacity;
        uint32_t SolidCapacity;
        uint32_t LiquidCapacity;
        uint32_t UnitCapacity;
        uint32_t MissileCapacity;
        uint32_t CountermeasureCapacity;
        uint32_t DeployableCapacity;
        float RadarRange;
    } UILoadoutStatistics3;
    UniverseID GetPlayerOccupiedShipID(void);
    UniverseID GetPlayerControlledShipID(void);
    bool IsFlightAssistActive(void);
    bool IsShipAtExternalDock(UniverseID shipid);
    float GetBoostEnergyPercentage(void);
    bool IsSetaActive(void);
    const char* GetPlayerShipSize(void);
    UILoadoutStatistics3 GetCurrentLoadoutStatistics3(UniverseID shipid);
    int GetAlertLevel(UniverseID componentid);
    int GetNumAllAttackers(UniverseID componentid);
    int GetNumIncomingMissiles(UniverseID componentid);
]])

local output = {}

function output.handle()
    local shipId = C.GetPlayerOccupiedShipID()
    if shipId == 0 then
        return nil
    end

    local hull, shields = GetPlayerShipHullShield()
    local _, _, speedPerSecond, boosting, travelMode = GetPlayerSpeed()
    local maxSpeed = 0
    local maxBoostSpeed = 0
    local maxTravelSpeed = 0
    pcall(function()
        local loadout = C.GetCurrentLoadoutStatistics3(shipId)
        maxSpeed = tonumber(loadout.ForwardSpeed) or 0
        maxBoostSpeed = tonumber(loadout.BoostSpeed) or 0
        maxTravelSpeed = tonumber(loadout.TravelSpeed) or 0
    end)

    local alertLevel       = 0
    local attackerCount    = 0
    local incomingMissiles = 0
    pcall(function() alertLevel       = C.GetAlertLevel(shipId) end)
    pcall(function() attackerCount    = C.GetNumAllAttackers(shipId) end)
    pcall(function() incomingMissiles = C.GetNumIncomingMissiles(shipId) end)

    local shipName = GetComponentData(ConvertStringTo64Bit(tostring(shipId)), "name") or ""

    return {
        name         = shipName,
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
