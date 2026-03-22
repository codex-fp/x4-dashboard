/**
 * Data Aggregator
 * Builds unified dashboard state from X4 External App data.
 *
 * Sources:
 * - playerProfile  -> player name, credits, sector
 * - shipStatus     -> hull, shields, speed, boost, travel drive, flight assist, docked, seta, scan states
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

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function getFiniteNumber(...candidates) {
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function getOptionalFiniteNumber(...candidates) {
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === '') continue;

    const value = Number(candidate);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function getBoolean(...candidates) {
  for (const candidate of candidates) {
    if (typeof candidate === 'boolean') {
      return candidate;
    }

    if (candidate === 1 || candidate === '1') return true;
    if (candidate === 0 || candidate === '0') return false;
  }

  return null;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeCombatPayload(raw) {
  const shipStatus = raw && typeof raw === 'object' ? raw : {};
  const nestedCombat = shipStatus.combat && typeof shipStatus.combat === 'object' ? shipStatus.combat : {};

  const alertLevel = getFiniteNumber(
    shipStatus.alertLevel,
    shipStatus.alertlevel,
    nestedCombat.alertLevel,
    nestedCombat.alertlevel,
    nestedCombat.level,
    nestedCombat.state
  );
  const attackerCount = getFiniteNumber(
    shipStatus.attackerCount,
    shipStatus.attackers,
    shipStatus.numAttackers,
    shipStatus.attackercount,
    nestedCombat.attackerCount,
    nestedCombat.attackers,
    nestedCombat.numAttackers,
    nestedCombat.attackercount
  );
  const incomingMissiles = getFiniteNumber(
    shipStatus.incomingMissiles,
    shipStatus.missiles,
    shipStatus.missileCount,
    shipStatus.numIncomingMissiles,
    shipStatus.incomingmissiles,
    nestedCombat.incomingMissiles,
    nestedCombat.missiles,
    nestedCombat.missileCount,
    nestedCombat.numIncomingMissiles,
    nestedCombat.incomingmissiles
  );
  const missileIncoming = getBoolean(
    shipStatus.missileIncoming,
    shipStatus.missileincoming,
    nestedCombat.missileIncoming,
    nestedCombat.missileincoming
  );
  const missileLockingOn = getBoolean(
    shipStatus.missileLockingOn,
    shipStatus.missileLocking,
    shipStatus.missilelockingon,
    shipStatus.lockingOn,
    nestedCombat.missileLockingOn,
    nestedCombat.missileLocking,
    nestedCombat.missilelockingon,
    nestedCombat.lockingOn
  );
  const hasMissileIncoming = missileIncoming ?? (incomingMissiles ?? 0) > 0;
  const hasMissileLockingOn = missileLockingOn ?? false;
  const normalizedAlertLevel = hasMissileIncoming
    ? 2
    : hasMissileLockingOn
      ? 1
      : Math.round(alertLevel ?? 0);

  return {
    alertLevel: clampNumber(normalizedAlertLevel, 0, 2),
    attackerCount: Math.max(0, Math.round(attackerCount ?? 0)),
    incomingMissiles: hasMissileIncoming ? Math.max(1, Math.round(incomingMissiles ?? 0)) : 0,
    missileIncoming: hasMissileIncoming,
    missileLockingOn: hasMissileLockingOn,
  };
}

function normalizeShipControlPayload(raw) {
  const shipStatus = raw && typeof raw === 'object' ? raw : {};
  const occupied = getBoolean(
    shipStatus.occupied,
    shipStatus.hasOccupiedShip,
    shipStatus.playerOccupied,
    shipStatus.playeroccupied
  );
  const controlled = getBoolean(
    shipStatus.controlled,
    shipStatus.hasControlledShip,
    shipStatus.playerControlled,
    shipStatus.playercontrolled
  );

  return {
    occupied: occupied ?? false,
    controlled: controlled ?? false,
  };
}

function mergeShipStatus(previous, next) {
  const prevShipStatus = previous && typeof previous === 'object' ? previous : {};
  const nextShipStatus = next && typeof next === 'object' ? next : {};
  const merged = { ...prevShipStatus, ...nextShipStatus };
  const combat = normalizeCombatPayload(nextShipStatus);
  const nextOccupied = getBoolean(
    nextShipStatus.occupied,
    nextShipStatus.hasOccupiedShip,
    nextShipStatus.playerOccupied,
    nextShipStatus.playeroccupied
  );
  const nextControlled = getBoolean(
    nextShipStatus.controlled,
    nextShipStatus.hasControlledShip,
    nextShipStatus.playerControlled,
    nextShipStatus.playercontrolled
  );

  merged.alertLevel = combat.alertLevel;
  merged.attackerCount = combat.attackerCount;
  merged.incomingMissiles = combat.incomingMissiles;
  merged.missileIncoming = combat.missileIncoming;
  merged.missileLockingOn = combat.missileLockingOn;
  merged.occupied = nextOccupied ?? prevShipStatus.occupied ?? false;
  merged.controlled = nextControlled ?? prevShipStatus.controlled ?? false;

  return merged;
}

function formatLabel(value) {
  const normalized = normalizeText(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRelationValue(faction) {
  const candidates = [faction?.relationValue, faction?.relationvalue, faction?.relation, faction?.standing];

  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getRelationLabel(faction, relationValue) {
  const directLabel = normalizeText(faction?.relationLabel)
    || normalizeText(faction?.relationText)
    || normalizeText(faction?.relationName);

  if (directLabel) return formatLabel(directLabel);
  if (typeof faction?.relation === 'string') return formatLabel(faction.relation);
  if (faction?.isHostile || faction?.ishostile) return 'Hostile';
  if (faction?.isEnemy || faction?.isenemy) return 'Enemy';

  if (typeof relationValue === 'number') {
    if (relationValue >= 20) return 'Ally';
    if (relationValue >= 10) return 'Friend';
    if (relationValue > -10) return 'Neutral';
    if (relationValue > -20) return 'Enemy';
    return 'Hostile';
  }

  return 'Unknown';
}

function getLicenseLabels(faction) {
  const labels = [];
  const rawLabels = [];

  if (Array.isArray(faction?.licences)) rawLabels.push(...faction.licences);
  if (Array.isArray(faction?.licenceLabels)) rawLabels.push(...faction.licenceLabels);
  if (Array.isArray(faction?.licenses)) rawLabels.push(...faction.licenses);
  if (Array.isArray(faction?.licenseLabels)) rawLabels.push(...faction.licenseLabels);
  if (typeof faction?.licence === 'string') rawLabels.push(faction.licence);
  if (typeof faction?.license === 'string') rawLabels.push(faction.license);

  for (const label of rawLabels) {
    const formatted = formatLabel(label);
    if (formatted) labels.push(formatted);
  }

  if (faction?.hasPoliceLicence || faction?.hasPoliceLicense) labels.push('Police');
  if (faction?.hasMilitaryLicence || faction?.hasMilitaryLicense) labels.push('Military');
  if (faction?.hasCapitalLicence || faction?.hasCapitalLicense) labels.push('Capital');

  return Array.from(new Set(labels));
}

function normalizeFactionEntry(faction, fallbackId) {
  if (!faction || typeof faction !== 'object') return null;

  const id = normalizeText(faction.id) || fallbackId;
  const name = normalizeText(faction.name) || normalizeText(faction.shortName) || normalizeText(faction.shortname) || formatLabel(fallbackId) || 'Unknown Faction';
  const shortName = normalizeText(faction.shortName) || normalizeText(faction.shortname) || name;
  const relationValue = getRelationValue(faction);

  return {
    id,
    name,
    shortName,
    relationLabel: getRelationLabel(faction, relationValue),
    relationValue,
    licenseLabels: getLicenseLabels(faction),
  };
}

function normalizeFactions(raw) {
  if (!raw) return null;

  const entries = Array.isArray(raw)
    ? raw.map((faction, index) => normalizeFactionEntry(faction, `faction-${index + 1}`))
    : Object.entries(raw).map(([id, faction]) => normalizeFactionEntry(faction, id));

  const factions = entries.filter(Boolean);

  if (!factions.length) return null;

  return factions.sort((a, b) => a.name.localeCompare(b.name));
}

function formatElapsedTime(seconds) {
  const value = getOptionalFiniteNumber(seconds);

  if (value === null || value < 0) return null;

  const totalSeconds = Math.round(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) return `T+${hours}h ${minutes}m`;
  if (minutes > 0) return `T+${minutes}m ${remainingSeconds}s`;
  return `T+${remainingSeconds}s`;
}

function normalizeTransactionEntry(entry, index) {
  if (!entry || typeof entry !== 'object') return null;

  const id = normalizeText(entry.id) || normalizeText(entry.entryid) || `transaction-${index + 1}`;
  const rawEventType = normalizeText(entry.eventType) || normalizeText(entry.eventtype) || normalizeText(entry.type);
  const rawEventLabel = normalizeText(entry.eventLabel) || normalizeText(entry.eventlabel) || normalizeText(entry.eventtypename);
  const partnerName = normalizeText(entry.partnerName) || normalizeText(entry.partnername) || normalizeText(entry.partnerLabel) || normalizeText(entry.partnerlabel);
  const itemName = normalizeText(entry.itemName) || normalizeText(entry.itemname) || normalizeText(entry.wareName) || normalizeText(entry.warename) || normalizeText(entry.ware);
  const description = normalizeText(entry.description);
  const time = getOptionalFiniteNumber(entry.time, entry.timestamp, entry.gameTime, entry.gametime);
  const timeText = normalizeText(entry.timeText) || normalizeText(entry.timetext) || normalizeText(entry.timeLabel) || normalizeText(entry.timelabel) || formatElapsedTime(time);
  const value = getOptionalFiniteNumber(entry.value, entry.money, entry.credits);
  const amount = getOptionalFiniteNumber(entry.amount, entry.quantity);
  const unitPrice = getOptionalFiniteNumber(entry.unitPrice, entry.unitprice, entry.price);
  const destroyedPartner = getBoolean(entry.destroyedPartner, entry.destroyedpartner) ?? false;

  return {
    id,
    eventType: rawEventType ? rawEventType.toLowerCase() : 'transaction',
    eventLabel: rawEventLabel || formatLabel(rawEventType) || 'Transaction',
    partnerName: partnerName || null,
    itemName: itemName || null,
    amount,
    unitPrice,
    value,
    time,
    timeText: timeText || null,
    description,
    destroyedPartner,
  };
}

function normalizeTransactionLog(raw) {
  if (!raw) return null;

  const source = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.list)
      ? raw.list
      : [];

  const list = source
    .map((entry, index) => normalizeTransactionEntry(entry, index))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.time === null && b.time === null) return 0;
      if (a.time === null) return 1;
      if (b.time === null) return -1;
      return b.time - a.time;
    });

  if (!list.length) return null;

  return { list };
}

function normalizeAgentShip(rawShip) {
  const ship = rawShip && typeof rawShip === 'object' ? rawShip : {};

  const id = ship.id === 0 ? '' : normalizeStringValue(ship.id);
  const name = normalizeText(ship.name);
  const prestige = normalizeText(ship.prestige);

  return {
    id: id || null,
    name: name || null,
    prestige: prestige || null,
  };
}

function normalizeAgentMission(rawMission) {
  if (!rawMission || typeof rawMission !== 'object') return null;

  const name = normalizeText(rawMission.name);

  if (!name) return null;

  const type = normalizeText(rawMission.type);
  const likelihoodOfSuccess = normalizeText(rawMission.likelihoodOfSuccess);
  const riskToAgent = normalizeText(rawMission.riskToAgent);
  const rewards = normalizeText(rawMission.rewards);
  const target = normalizeText(rawMission.target);

  return {
    type: type || 'mission',
    name,
    likelihoodOfSuccess: likelihoodOfSuccess || null,
    successChance: getOptionalFiniteNumber(rawMission.successChance),
    riskToAgent: riskToAgent || null,
    rewards: rewards || null,
    target: target || null,
    startTime: getOptionalFiniteNumber(rawMission.startTime),
    endTime: getOptionalFiniteNumber(rawMission.endTime),
    timeLeftSeconds: getOptionalFiniteNumber(rawMission.timeLeftSeconds),
    timeLeftText: normalizeText(rawMission.timeLeftText) || null,
  };
}

function normalizeAgentEntry(entry, index) {
  if (!entry || typeof entry !== 'object') return null;

  const rawAgent = entry.agent && typeof entry.agent === 'object' ? entry.agent : {};
  const id = normalizeStringValue(rawAgent.id) || `agent-${index + 1}`;
  const name = normalizeText(rawAgent.name) || 'Unknown Agent';
  const rank = normalizeText(rawAgent.rank) || 'Unranked';
  const originFactionId = normalizeText(rawAgent.originFactionId) || 'unknown';
  const originFactionName = normalizeText(rawAgent.originFactionName) || normalizeText(rawAgent.originFactionNameShort) || 'Unknown Faction';
  const originFactionNameShort = normalizeText(rawAgent.originFactionNameShort) || originFactionName;
  const gender = normalizeText(rawAgent.gender) || 'unknown';
  const icon = normalizeText(rawAgent.icon);
  const negotiationLevel = normalizeText(rawAgent.negotiationLevel) || 'Unknown';
  const espionageLevel = normalizeText(rawAgent.espionageLevel) || 'Unknown';

  return {
    agent: {
      id,
      name,
      rank,
      originFactionId,
      originFactionName,
      originFactionNameShort,
      gender,
      icon,
      ship: normalizeAgentShip(rawAgent.ship),
      negotiationLevel,
      espionageLevel,
    },
    currentMission: normalizeAgentMission(entry.currentMission),
  };
}

function normalizeAgents(raw) {
  if (!raw) return null;
  if (!Array.isArray(raw)) return null;

  const agents = raw
    .map((entry, index) => normalizeAgentEntry(entry, index))
    .filter(Boolean)
    .sort((a, b) => {
      const aActive = a.currentMission ? 1 : 0;
      const bActive = b.currentMission ? 1 : 0;

      if (aActive !== bActive) return bActive - aActive;
      return a.agent.name.localeCompare(b.agent.name);
    });

  if (!agents.length) return [];

  return agents;
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
    const previousShipStatus = this.external.shipStatus;
    const normalizedAgents = rest.agents !== undefined ? (normalizeAgents(rest.agents) ?? []) : undefined;
    // Merge so partial updates (e.g. ship-only ticks) don't wipe mission data
    this.external = { ...this.external, ...rest };

    if (rest.shipStatus !== undefined) {
      this.external.shipStatus = mergeShipStatus(previousShipStatus, rest.shipStatus);
    }

    if (normalizedAgents !== undefined) {
      this.external.agents = normalizedAgents;
    }
  }

  getState() {
    const ext = this.external;
    const es  = ext.shipStatus;
    const profile = ext.playerProfile;
    const control = normalizeShipControlPayload(es);
    const hasLiveShipTelemetry = control.controlled;

    const hull    = hasLiveShipTelemetry ? (es?.hull ?? 100) : 0;
    const shields = hasLiveShipTelemetry ? (es?.shields ?? 100) : 0;
    const speed   = hasLiveShipTelemetry ? (es?.speed ?? 0) : 0;

    const player = {
      name:        profile?.name        || 'UNKNOWN',
      faction:     profile?.factionname || '',
      credits:     profile?.credits     ?? 0,
      sector:      profile?.sectorname  || '',
      sectorOwner: profile?.sectorowner || '',
    };

    const ship = {
      name:             hasLiveShipTelemetry ? (es?.name || '') : '',
      type:             hasLiveShipTelemetry ? (es?.shipSize || '') : '',
      hull:             Math.max(0, Math.min(100, hull)),
      shields:          Math.max(0, Math.min(100, shields)),
      isDockedOrLanded: hasLiveShipTelemetry ? (es?.docked ?? false) : false,
    };

    const flight = {
      speed,
      maxSpeed:      hasLiveShipTelemetry ? (es?.maxSpeed ?? 0) : 0,
      maxBoostSpeed: hasLiveShipTelemetry ? (es?.maxBoostSpeed ?? 0) : 0,
      maxTravelSpeed: hasLiveShipTelemetry ? (es?.maxTravelSpeed ?? 0) : 0,
      boostEnergy:   hasLiveShipTelemetry ? (es?.boostEnergy ?? 100) : 0,
      boosting:      hasLiveShipTelemetry ? (es?.boosting ?? false) : false,
      travelDrive:   hasLiveShipTelemetry ? (es?.travelMode ?? false) : false,
      flightAssist:  hasLiveShipTelemetry ? (es?.flightAssist ?? true) : false,
      seta:          hasLiveShipTelemetry ? (es?.seta ?? false) : false,
      autopilot:     hasLiveShipTelemetry ? (es?.autopilot ?? false) : false,
      scanMode:      hasLiveShipTelemetry ? (es?.scanMode ?? false) : false,
      longRangeScan: hasLiveShipTelemetry ? (es?.longRangeScan ?? false) : false,
    };

    const ti = ext.targetInfo;
    const combatTarget = (hasLiveShipTelemetry && ti && ti.hasTarget) ? {
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

    const combat = hasLiveShipTelemetry
      ? normalizeCombatPayload(es)
      : {
          alertLevel: 0,
          attackerCount: 0,
          incomingMissiles: 0,
          missileIncoming: false,
          missileLockingOn: false,
        };

    return {
      _meta: {
        timestamp:         new Date().toISOString(),
        externalConnected: this.externalConnected,
      },
      player,
      control,
      ship,
      flight,
      combat: {
        target:           combatTarget,
        alertLevel:       combat.alertLevel,
        attackerCount:    combat.attackerCount,
        incomingMissiles: combat.incomingMissiles,
        missileIncoming:  combat.missileIncoming,
        missileLockingOn: combat.missileLockingOn,
      },
      missionOffers:   normalizeMissionOffers(ext.missionOffers),
      activeMission:   normalizeActiveMission(ext.activeMission),
      logbook:         normalizeLogbook(ext.logbook),
      currentResearch: ext.currentResearch || null,
      factions:        normalizeFactions(ext.factions),
      agents:          Array.isArray(ext.agents) ? ext.agents : normalizeAgents(ext.agents),
      inventory:       ext.inventory       || null,
      transactionLog:  normalizeTransactionLog(ext.transactionLog),
    };
  }
}

module.exports = DataAggregator;
