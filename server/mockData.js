/**
 * Mock Data Source
 * Generates realistic evolving game state for dashboard preview.
 * Emits 'data' events matching X4 External App format (including shipStatus).
 *
 * Usage: node index.js --mock
 */

const EventEmitter = require('events');

// ── Static mock content ───────────────────────────────────────────────────────

const MOCK_MISSIONS_GUILD = [
  {
    id: 'g1', name: null,
    missions: {
      m1: { name: 'Eliminate Pirate Squadron', rewardtext: '320,000 Cr', difficulty: 4, reward: 320000,
            description: "A group of Xenon fighters has been spotted in Hewa's Twin. Destroy all hostiles.", objectives: ['Destroy 4 pirate fighters'], duration: 3600 },
      m2: { name: 'Courier: Teladi Station Supplies', rewardtext: '85,000 Cr', difficulty: 2, reward: 85000,
            description: 'Transport medical equipment from Argon Prime to Ianamus Zura.', objectives: ['Pick up cargo', 'Deliver to Ianamus Zura'], duration: 1800 },
    }
  }
];

const MOCK_MISSIONS_OTHER = [
  {
    id: 'o1', name: null,
    missions: {
      m1: { name: 'Emergency: Station Under Attack', rewardtext: '550,000 Cr', difficulty: 5, reward: 550000,
            description: 'Antigone Memorial is under attack by a Xenon fleet. Defend the station at all costs.', objectives: ['Destroy 12 Xenon ships', 'Protect station hull above 50%'], duration: 0 },
      m2: { name: 'Fetch Rare Components', rewardtext: '42,000 Cr', difficulty: 1, reward: 42000,
            description: 'Retrieve a crate of rare electronic components drifting in Getsu Fune.', objectives: ['Locate debris field', 'Retrieve container'], duration: 900 },
      m3: { name: 'Scan Unknown Anomaly', rewardtext: '110,000 Cr', difficulty: 3, reward: 110000,
            description: 'An unknown energy signature has been detected near the Xenon border.', objectives: ['Reach coordinates', 'Perform full scan'], duration: 2700 },
    }
  }
];

const MOCK_MISSIONS_PLOT = [
  {
    id: 'p1', name: 'Fires of Defeat',
    missions: {
      m1: { name: 'The Price of Freedom', rewardtext: 'Story progression', difficulty: 3, reward: 0,
            description: 'The SCA contact has gone silent. Travel to Eighteen Billion to investigate.', objectives: ['Travel to Eighteen Billion', 'Contact SCA operative'], duration: 0 },
    }
  }
];

const MOCK_LOGBOOK = [
  { title: 'Station construction complete', text: 'Your Teladi Trading Station in Ianamus Zura has finished construction.', factionname: 'Teladi Company' },
  { title: 'Trade route established', text: 'Automated trade route Alpha-7 has been set up between Argon Prime and Getsu Fune.', factionname: '' },
  { title: 'Combat report: Pirate base destroyed', text: 'Your forces eliminated the pirate base in Hewa\'s Twin. 12 ships destroyed.', factionname: 'Antigone Republic' },
  { title: 'Research unlocked: Plasma Weapons Mk3', text: 'Research into Plasma Weapons Mk3 has been completed.', factionname: '' },
  { title: 'Reputation increased: Argon Federation', text: 'Your standing with the Argon Federation has improved to Ally.', factionname: 'Argon Federation' },
];

const MOCK_RESEARCH = {
  name: 'Advanced Shield Generator',
  description: 'Improves shield regeneration rate by 35% and maximum capacity by 20% for all ships.',
  researchtime: 14400,
  percentageCompleted: 61.4,
  precursors: [{ name: 'Shield Technology II' }],
  resources: [
    { name: 'Silicon Wafers', currentAmount: 420, totalAmount: 600 },
    { name: 'Quantum Tubes',  currentAmount: 18,  totalAmount: 25  },
    { name: 'Energy Cells',   currentAmount: 1800, totalAmount: 2000 },
  ],
};

const MOCK_FACTIONS = [
  { id: 'antigone', name: 'Antigone Republic', shortName: 'ANT', relationLabel: 'Friend', relationValue: 12, licenseLabels: ['Police'] },
  { id: 'argon', name: 'Argon Federation', shortName: 'ARG', relationLabel: 'Ally', relationValue: 22, licenseLabels: ['Military', 'Police'] },
  { id: 'holy-order', name: 'Holy Order', shortName: 'HOP', relationLabel: 'Neutral', relationValue: 0, licenseLabels: [] },
  { id: 'khaak', name: "Kha'ak", shortName: 'KHK', relationLabel: 'Hostile', relationValue: -30, licenseLabels: [] },
  { id: 'teladi', name: 'Teladi Company', shortName: 'TEL', relationLabel: 'Friend', relationValue: 18, licenseLabels: ['Trade'] },
  { id: 'xenon', name: 'Xenon', shortName: 'XEN', relationLabel: 'Enemy', relationValue: -20, licenseLabels: [] },
];

function cloneMissionGroup(group, prefix, copies) {
  const result = [];

  for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
    for (const offer of group) {
      const nextOffer = {
        ...offer,
        id: `${prefix}-${copyIndex}-${offer.id}`,
        missions: {},
      };

      for (const [missionId, mission] of Object.entries(offer.missions || {})) {
        nextOffer.missions[`${missionId}-${copyIndex}`] = {
          ...mission,
          name: copyIndex === 0 ? mission.name : `${mission.name} [${copyIndex + 1}]`,
        };
      }

      result.push(nextOffer);
    }
  }

  return result;
}

function cloneLogbookEntries(entries, copies) {
  const result = [];

  for (let copyIndex = 0; copyIndex < copies; copyIndex += 1) {
    for (const entry of entries) {
      result.push({
        ...entry,
        title: copyIndex === 0 ? entry.title : `${entry.title} [${copyIndex + 1}]`,
      });
    }
  }

  return result;
}

function createGeneratedLogbookEntries(count, tick) {
  const result = [];

  for (let index = 0; index < count; index += 1) {
    result.push({
      title: `Incoming transmission ${index + 1}`,
      text: `Mock diagnostics packet ${tick}-${index + 1} received from sector relay. Review waypoint updates and command traffic for nearby operations.`,
      factionname: index % 2 === 0 ? 'Argon Federation' : 'Teladi Company',
    });
  }

  return result;
}

// ── State evolution ───────────────────────────────────────────────────────────

class MockDataSource extends EventEmitter {
  constructor() {
    super();

    // Ship state
    this.hull        = 98;
    this.shields     = 100;
    this.speed       = 0;
    this.boostEnergy = 100;
    this.credits     = 3_254_000;

    // System flags
    this.flightAssist = true;
    this.seta         = false;
    this.travelDrive  = false;
    this.autopilot    = false;
    this.scanMode     = false;
    this.longRangeScan = false;
    this.boosting     = false;
    this.occupied     = true;
    this.controlled   = true;

    // Flight phase — driven by mock buttons only (no auto-transitions into boost/travel)
    this.flightPhase = 'normal';
    this.phaseTick   = 0;

    // Combat
    this.alertLevel       = 0;
    this.attackerCount    = 0;
    this.targetHull       = 100;
    this.targetShields    = 100;
    this.incomingMissiles = 0;
    this.missileIncoming  = false;
    this.missileLockingOn = false;

    // Misc
    this.tick                  = 0;
    this.sector                = 'Segaris Pioneer';
    this.activeMissionTimeLeft = 5400;
    this.intervals             = [];
    this.missionOfferDensity   = 1;
    this.logbookDensity        = 1;
  }

  emit_data(shipOnly = false) {
    const payload = {
      _connected: true,
      playerProfile: {
        name:        'CAP. RAMIREZ',
        factionname: 'Argon Federation',
        credits:     Math.round(this.credits),
        sectorname:  this.sector,
        sectorowner: 'Teladi Company',
      },
      targetInfo: this.alertLevel >= 2 ? {
        hasTarget:   true,
        name:        'XEN-SCOUT-041',
        shipName:    'Xenon S',
        hull:        Math.round(this.targetHull),
        shields:     Math.round(this.targetShields),
        faction:     'Xenon',
        isHostile:   true,
        legalStatus: '',
        combatRank:  '',
        bounty:      0,
        distance:    Math.round(800 + Math.random() * 400),
      } : { hasTarget: false },
      shipStatus: {
        occupied:      this.occupied,
        controlled:    this.controlled,
        hull:          Math.round(this.hull),
        shields:       Math.round(this.shields),
        speed:         Math.round(this.speed),
        maxSpeed:      480,
        maxBoostSpeed: 960,
        maxTravelSpeed: 5200,
        boosting:      this.boosting,
        travelMode:    this.travelDrive,
        flightAssist:  this.flightAssist,
        boostEnergy:   Math.round(this.boostEnergy),
        docked:        false,
        seta:          this.seta,
        autopilot:     this.autopilot,
        scanMode:      this.scanMode,
        longRangeScan: this.longRangeScan,
        shipSize:      'ship_s',
        alertLevel:       this.alertLevel,
        attackerCount:    this.attackerCount,
        incomingMissiles: this.incomingMissiles,
        missileIncoming:  this.missileIncoming,
        missileLockingOn: this.missileLockingOn,
      },
    };

    if (!shipOnly) {
      Object.assign(payload, {
        missionOffers: {
          plot:  cloneMissionGroup(MOCK_MISSIONS_PLOT, 'plot', this.missionOfferDensity),
          guild: cloneMissionGroup(MOCK_MISSIONS_GUILD, 'guild', this.missionOfferDensity),
          other: cloneMissionGroup(MOCK_MISSIONS_OTHER, 'other', this.missionOfferDensity),
        },
        activeMission: {
          name:        'Eliminate Pirate Squadron',
          description: "A group of Xenon fighters has been spotted in Hewa's Twin. Destroy all hostiles before they reach the convoy.",
          completed:   false,
          reward:      320_000,
          timeleft:    Math.round(this.activeMissionTimeLeft),
        },
        logbook:        {
          list: [
            ...cloneLogbookEntries(MOCK_LOGBOOK, this.logbookDensity),
            ...createGeneratedLogbookEntries(this.logbookDensity * 8, this.tick),
          ],
        },
        currentResearch: {
          ...MOCK_RESEARCH,
          percentageCompleted: Math.min(99.9, MOCK_RESEARCH.percentageCompleted + this.tick * 0.001),
        },
        factions: MOCK_FACTIONS,
      });
    }

    this.emit('data', payload);
  }

  tick_ship() {
    this.tick++;
    const t = this.tick * 0.05;

    if (this.alertLevel >= 2) {
      this.hull          = Math.max(18, this.hull          - 0.4 - Math.random() * 0.8);
      this.shields       = Math.max(0,  this.shields       - 1.2 - Math.random() * 1.5);
      this.targetHull    = Math.max(0,  this.targetHull    - 1.5 - Math.random() * 2.0);
      this.targetShields = Math.max(0,  this.targetShields - 2.0 - Math.random() * 2.5);
      this.boosting    = false;
      this.travelDrive = false;
      this.speed       = 300 + Math.sin(t * 3) * 200;
      this.boostEnergy = Math.min(100, this.boostEnergy + 0.3);
    } else if (this.alertLevel === 1) {
      this.shields = Math.max(72, this.shields - 0.15 - Math.random() * 0.3);
      this.hull    = Math.min(100, this.hull + 0.01);
      this.speed   = Math.max(0, 180 + Math.sin(t * 1.2) * 70);
      this.boosting = false;
      this.travelDrive = false;
      this.boostEnergy = Math.min(100, this.boostEnergy + 0.4);
    } else {
      this.shields = Math.min(100, this.shields + 0.25);
      this.hull    = Math.min(100, this.hull    + 0.02);
      this._advanceFlightPhase(t);
    }

    if (this.tick % 10 === 0) this.credits += Math.random() * 1200;
    if (this.tick % 5  === 0) this.activeMissionTimeLeft = Math.max(0, this.activeMissionTimeLeft - 1);

    this.emit_data(true);
  }

  // Flight phases driven entirely by manual toggles (travel/boost buttons).
  // Phases never auto-transition into boost or travel — only the mock buttons do that.
  // boost → recover → normal (wind-down only); travel_stop → normal (wind-down only).
  _advanceFlightPhase(t) {
    this.phaseTick++;
    switch (this.flightPhase) {
      case 'normal': {
        this.boosting    = false;
        this.travelDrive = false;
        this.speed       = Math.max(0, 250 + Math.sin(t * 0.7) * 220 + Math.cos(t * 0.3) * 60);
        this.boostEnergy = Math.min(100, this.boostEnergy + 0.5);
        // no auto-transition — stays in normal until a button is pressed
        break;
      }
      case 'boost': {
        this.boosting    = true;
        this.travelDrive = false;
        const bp = Math.min(1, this.phaseTick / 14);
        this.speed       = 480 + bp * 480 + Math.sin(t * 5) * 30;
        this.boostEnergy = Math.max(0, this.boostEnergy - 3.2);
        if (this.phaseTick >= 24) { this.flightPhase = 'recover'; this.phaseTick = 0; this.boosting = false; }
        break;
      }
      case 'recover': {
        this.boosting    = false;
        this.travelDrive = false;
        this.speed       = Math.max(0, 250 + Math.sin(t * 0.7) * 220 + Math.cos(t * 0.3) * 60);
        this.boostEnergy = Math.min(100, this.boostEnergy + 0.9);
        if (this.phaseTick >= 60) { this.flightPhase = 'normal'; this.phaseTick = 0; }
        // no auto-transition to travel — only the travel button does that
        break;
      }
      case 'travel': {
        this.boosting    = false;
        this.travelDrive = true;
        const tp = Math.min(1, this.phaseTick / 40);
        this.speed       = 480 + tp * tp * 4600 + Math.sin(t * 2) * 120;
        this.boostEnergy = Math.min(100, this.boostEnergy + 0.3);
        // no auto-transition — stays in travel until the travel button is pressed again
        break;
      }
      case 'travel_stop': {
        this.boosting    = false;
        this.travelDrive = false;
        this.speed       = Math.max(0, this.speed * 0.84 - 40);
        this.boostEnergy = Math.min(100, this.boostEnergy + 0.5);
        if (this.phaseTick >= 40 || this.speed < 10) { this.flightPhase = 'normal'; this.phaseTick = 0; }
        break;
      }
    }
  }

  startCombat() {
    if (this.alertLevel >= 2) return;
    this.alertLevel       = 2;
    this.attackerCount    = 1;
    this.targetHull       = 100;
    this.targetShields    = 100;
    this.incomingMissiles = 0;
    this.missileIncoming  = false;
    this.missileLockingOn = false;
    console.log('[Mock] ⚠ COMBAT STARTED');
  }

  startAlert() {
    if (this.alertLevel === 1) return;
    this.alertLevel = 1;
    this.attackerCount = 1;
    this.incomingMissiles = 0;
    this.missileIncoming = false;
    this.missileLockingOn = false;
    console.log('[Mock] ! ALERT ACTIVE');
  }

  clearCombatState() {
    this.alertLevel = 0;
    this.attackerCount = 0;
    this.incomingMissiles = 0;
    this.missileIncoming = false;
    this.missileLockingOn = false;
    this.targetHull = 100;
    this.targetShields = 100;
  }

  toggleTravel() {
    if (this.alertLevel >= 2) return; // combat overrides flight state
    if (this.travelDrive) {
      // Disengage travel drive
      this.flightPhase = 'travel_stop';
      this.phaseTick   = 0;
      console.log('[Mock] Travel drive disengaged manually');
    } else {
      // Engage travel drive; skip boost/recover phases
      this.flightPhase = 'travel';
      this.phaseTick   = 0;
      this.boosting    = false;
    }
    this.emit_data(true);
  }

  toggleBoost() {
    if (this.alertLevel >= 2) return; // combat overrides flight state
    if (this.boosting) {
      // Stop boosting, go to recover
      this.flightPhase = 'recover';
      this.phaseTick   = 0;
      this.boosting    = false;
      console.log('[Mock] Boost disengaged manually');
    } else {
      // Start boost; interrupt travel if active
      this.flightPhase = 'boost';
      this.phaseTick   = 0;
      this.travelDrive = false;
      console.log('[Mock] Boost engaged manually');
    }
    this.emit_data(true);
  }

  toggleCombat() {
    if (this.alertLevel === 0) {
      this.startAlert();
    } else if (this.alertLevel === 1) {
      this.startCombat();
    } else {
      this.clearCombatState();
      console.log('[Mock] Combat ended manually');
    }
    this.emit_data(true);
  }

  toggleMissileLock() {
    if (!this.missileLockingOn && !this.missileIncoming) {
      this.missileLockingOn = true;
      this.missileIncoming = false;
      this.incomingMissiles = 0;
      console.log('[Mock] ⇢ MISSILE LOCK CREATED');
    } else if (this.missileLockingOn) {
      this.missileLockingOn = false;
      this.missileIncoming = true;
      this.incomingMissiles = 1;
      console.log('[Mock] ⇢ MISSILE INCOMING');
    } else {
      this.missileLockingOn = false;
      this.missileIncoming = false;
      this.incomingMissiles = 0;
      console.log('[Mock] Missile warning cleared');
    }
    this.emit_data(true);
  }

  adjustContentDensity(delta) {
    this.missionOfferDensity = Math.max(1, Math.min(5, this.missionOfferDensity + delta));
    this.logbookDensity = Math.max(1, Math.min(5, this.logbookDensity + delta));
    console.log(`[Mock] Mission density ${this.missionOfferDensity}, logbook density ${this.logbookDensity}`);
    this.emit_data(false);
  }

  start() {
    console.log('\n[Mock] ══════════════════════════════════');
    console.log('[Mock]  MOCK DATA MODE ACTIVE');
    console.log('[Mock]  Dashboard preview at http://localhost:3001');
    console.log('[Mock] ══════════════════════════════════\n');

    // Initial full data burst
    this.emit_data(false);

    // Ship state every 250ms
    this.intervals.push(setInterval(() => this.tick_ship(), 250));

    // Full external data (missions, logbook, etc.) every 3s
    this.intervals.push(setInterval(() => this.emit_data(false), 3000));
  }

  stop() {
    for (const i of this.intervals) clearInterval(i);
    this.intervals = [];
  }
}

module.exports = MockDataSource;
