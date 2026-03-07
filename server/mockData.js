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

const MOCK_FACTIONS = {
  argon:    { name: 'Argon Federation',  relation: 'ally',    licences: ['military', 'police'] },
  teladi:   { name: 'Teladi Company',    relation: 'friend',  licences: ['trade'] },
  paranid:  { name: 'Holy Order',        relation: 'neutral', licences: [] },
  xenon:    { name: 'Xenon',             relation: 'enemy',   licences: [] },
  khaak:    { name: "Kha'ak",            relation: 'enemy',   licences: [] },
  antielid: { name: 'Antigone Republic', relation: 'friend',  licences: [] },
};

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

    // Combat
    this.inCombat       = false;
    this.combatTimer    = null;
    this.combatCooldown = false;

    // Misc
    this.tick                  = 0;
    this.sector                = 'Segaris Pioneer';
    this.activeMissionTimeLeft = 5400;
    this.intervals             = [];
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
      shipStatus: {
        hull:        Math.round(this.hull),
        shields:     Math.round(this.shields),
        speed:       Math.round(this.speed),
        maxSpeed:    480,
        boosting:    false,
        travelMode:  this.travelDrive,
        flightAssist: this.flightAssist,
        boostEnergy: Math.round(this.boostEnergy),
        docked:      false,
        seta:        this.seta,
        shipSize:    'ship_s',
      },
    };

    if (!shipOnly) {
      Object.assign(payload, {
        missionOffers: {
          plot:  MOCK_MISSIONS_PLOT,
          guild: MOCK_MISSIONS_GUILD,
          other: MOCK_MISSIONS_OTHER,
        },
        activeMission: {
          name:        'Eliminate Pirate Squadron',
          description: "A group of Xenon fighters has been spotted in Hewa's Twin. Destroy all hostiles before they reach the convoy.",
          completed:   false,
          reward:      320_000,
          timeleft:    Math.round(this.activeMissionTimeLeft),
        },
        logbook:        { list: MOCK_LOGBOOK },
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

    if (this.inCombat) {
      this.hull    = Math.max(18, this.hull    - 0.4 - Math.random() * 0.8);
      this.shields = Math.max(0,  this.shields - 1.2 - Math.random() * 1.5);
      this.speed   = 300 + Math.sin(t * 3) * 200;
    } else {
      this.shields = Math.min(100, this.shields + 0.25);
      this.hull    = Math.min(100, this.hull    + 0.02);
      this.speed   = Math.max(0, 250 + Math.sin(t * 0.7) * 250 + Math.cos(t * 0.3) * 80);
    }

    this.boostEnergy = Math.min(100, this.boostEnergy + 0.5);
    if (this.tick % 10 === 0) this.credits += Math.random() * 1200;
    if (this.tick % 5  === 0) this.activeMissionTimeLeft = Math.max(0, this.activeMissionTimeLeft - 1);

    this.emit_data(true);
  }

  startCombat() {
    if (this.inCombat || this.combatCooldown) return;
    this.inCombat = true;
    console.log('[Mock] ⚠ COMBAT STARTED');

    this.combatTimer = setTimeout(() => {
      this.inCombat = false;
      this.combatCooldown = true;
      console.log('[Mock] Combat ended, hull:', Math.round(this.hull), 'shields:', Math.round(this.shields));
      setTimeout(() => { this.combatCooldown = false; }, 30000);
    }, 15000);
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

    // Combat every 45s
    this.intervals.push(setInterval(() => this.startCombat(), 45000));
  }

  stop() {
    for (const i of this.intervals) clearInterval(i);
    if (this.combatTimer) clearTimeout(this.combatTimer);
    this.intervals = [];
  }
}

module.exports = MockDataSource;
