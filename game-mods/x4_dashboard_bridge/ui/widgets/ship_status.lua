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
    bool IsAutoPilotActive(void);
    const char* GetPlayerShipSize(void);
    UILoadoutStatistics3 GetCurrentLoadoutStatistics3(UniverseID shipid);
    bool IsMissileIncoming(void);
    bool IsMissileLockingOn(void);
]])

local output = {}
function output.handle()
    local occupiedShipId = C.GetPlayerOccupiedShipID()
    local controlledShipId = C.GetPlayerControlledShipID()
    local hasOccupiedShip = occupiedShipId ~= 0
    local hasControlledShip = controlledShipId ~= 0

    if not hasControlledShip then
        return {
            occupied = hasOccupiedShip,
            controlled = false,
        }
    end

    local shipId = controlledShipId

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

    local missileIncoming = false
    local missileLockingOn = false
    local autopilot = false
    pcall(function() missileIncoming  = C.IsMissileIncoming() end)
    pcall(function() missileLockingOn = C.IsMissileLockingOn() end)
    pcall(function() autopilot        = C.IsAutoPilotActive() end)

    local missileWarningLevel = 0
    if missileIncoming then
        missileWarningLevel = 2
    elseif missileLockingOn then
        missileWarningLevel = 1
    end

    local shipName = GetComponentData(ConvertStringTo64Bit(tostring(shipId)), "name") or ""
    local playerActivity = GetPlayerActivity() or "none"

    return {
        occupied      = hasOccupiedShip,
        controlled    = true,
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
        docked       = C.IsShipAtExternalDock(shipId),
        seta         = C.IsSetaActive(),
        autopilot    = autopilot,
        scanMode     = playerActivity == "scan",
        longRangeScan = playerActivity == "scan_longrange",
        shipSize     = ffi.string(C.GetPlayerShipSize()),
        alertLevel        = missileWarningLevel,
        attackerCount     = 0,
        incomingMissiles  = missileIncoming and 1 or 0,
        missileIncoming   = missileIncoming,
        missileLockingOn  = missileLockingOn,
    }
end

return output
