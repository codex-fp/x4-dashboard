/**
 * Data Aggregator
 * Builds unified dashboard state from X4 External App data.
 *
 * Sources:
 * - playerProfile  → player name, credits, sector
 * - shipStatus     → hull, shields, speed, boost, travel drive, flight assist, docked, seta
 * - missionOffers, activeMission, logbook, currentResearch, factions, agents, inventory, transactionLog
 */

// Lua logbook widget returns a plain array; component expects { list: [...] }
function normalizeLogbook(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return { list: raw };
  return raw;
}

// Lua active_mission widget now returns a single object, but guard against
// legacy array format and empty-sentinel (name = "")
function normalizeActiveMission(raw) {
  if (!raw) return null;
  const obj = Array.isArray(raw) ? raw[0] : raw;
  if (!obj || !obj.name) return null;
  return obj;
}

// Lua mission_offers returns plot/coalition/other as flat arrays of mission objects.
// Component expects each group entry to be { id, name, missions: [...] }.
// Guild is already properly grouped.
function wrapMissionGroup(arr) {
  if (!arr || !arr.length) return arr;
  if (arr[0] && arr[0].missions !== undefined) return arr; // already grouped (guild)
  return [{ id: '0', name: null, missions: arr }];
}

function normalizeMissionOffers(raw) {
  if (!raw) return null;
  return {
    plot:      wrapMissionGroup(raw.plot),
    guild:     raw.guild,
    coalition: wrapMissionGroup(raw.coalition),
    other:     wrapMissionGroup(raw.other),
  };
}

class DataAggregator {
  constructor() {
    this.external = {};
    this.externalConnected = false;
  }

  updateExternal(data) {
    this.externalConnected = data._connected !== false;
    if (!this.externalConnected) return;
    const { _connected, ...rest } = data;
    // Merge so partial updates (e.g. ship-only ticks) don't wipe mission data
    this.external = { ...this.external, ...rest };
  }

  getState() {
    const ext = this.external;
    const es  = ext.shipStatus;
    const profile = ext.playerProfile;

    const hull    = es?.hull    ?? 100;
    const shields = es?.shields ?? 100;
    const speed   = es?.speed   ?? 0;

    const player = {
      name:        profile?.name        || 'UNKNOWN',
      faction:     profile?.factionname || '',
      credits:     profile?.credits     ?? 0,
      sector:      profile?.sectorname  || '',
      sectorOwner: profile?.sectorowner || '',
    };

    const ship = {
      name:             es?.name     || '',
      type:             es?.shipSize || '',
      hull:             Math.max(0, Math.min(100, hull)),
      shields:          Math.max(0, Math.min(100, shields)),
      isDockedOrLanded: es?.docked   ?? false,
    };

    const flight = {
      speed,
      maxSpeed:     es?.maxSpeed     ?? 0,
      boostEnergy:  es?.boostEnergy  ?? 100,
      boosting:     es?.boosting     ?? false,
      travelDrive:  es?.travelMode   ?? false,
      flightAssist: es?.flightAssist ?? true,
      seta:         es?.seta         ?? false,
    };

    const ti = ext.targetInfo;
    const combatTarget = (ti && ti.hasTarget) ? {
      name:        ti.name        || '',
      shipName:    ti.shipName    || '',
      hull:        Math.max(0, Math.min(100, ti.hull    ?? 100)),
      shields:     Math.max(0, Math.min(100, ti.shields ?? 100)),
      faction:     ti.faction     || '',
      legalStatus: ti.legalStatus || '',
      isHostile:   ti.isHostile   ?? false,
      distance:    ti.distance    ?? 0,
      combatRank:  ti.combatRank  || '',
      bounty:      ti.bounty      ?? 0,
    } : null;

    return {
      _meta: {
        timestamp:         new Date().toISOString(),
        externalConnected: this.externalConnected,
      },
      player,
      ship,
      flight,
      combat: {
        target: combatTarget,
      },
      missionOffers:   normalizeMissionOffers(ext.missionOffers),
      activeMission:   normalizeActiveMission(ext.activeMission),
      logbook:         normalizeLogbook(ext.logbook),
      currentResearch: ext.currentResearch || null,
      factions:        ext.factions        || null,
      agents:          ext.agents          || null,
      inventory:       ext.inventory       || null,
      transactionLog:  ext.transactionLog  || null,
    };
  }
}

module.exports = DataAggregator;
