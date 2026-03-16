export interface ConnectionMeta {
  timestamp: string;
  externalConnected: boolean;
  mockMode?: boolean;
}

export interface PlayerInfo {
  name: string;
  faction: string;
  credits: number;
  sector: string;
  sectorOwner: string;
}

export interface ShipStatus {
  name: string;
  type: string;         // ship_s / ship_m / ship_l / ship_xl
  hull: number;         // 0–100 %
  shields: number;      // 0–100 %
  isDockedOrLanded: boolean;
}

export interface FlightState {
  speed: number;          // current m/s
  maxSpeed: number;       // normal speed cap m/s
  maxBoostSpeed: number;  // boosted speed cap m/s (0 if unknown)
  maxTravelSpeed: number; // travel drive cap m/s (0 if unknown/auto-scale)
  boostEnergy: number;    // 0–100 %
  boosting: boolean;
  travelDrive: boolean;
  flightAssist: boolean;
  seta: boolean;
  autopilot: boolean;
  scanMode: boolean;
  longRangeScan: boolean;
}

export interface CombatTarget {
  name: string;
  shipName: string;
  hull: number;
  shields: number;
  faction: string;
  legalStatus: string;
  isHostile: boolean;
  distance: number;
  combatRank: string;
  bounty: number;
}

export interface CombatState {
  target: CombatTarget | null;
  alertLevel: number;       // 0 = none, 1 = alert (orange), 2 = combat (red)
  attackerCount: number;
  incomingMissiles: number;
}

export interface MissionEntry {
  name: string;
  rewardtext: string;
  difficulty: number;
  description: string;
  objectives: string[];
  reward: number;
  duration: number;
}

export interface MissionOffer {
  id: string;
  name: string | null;
  missions: Record<string, MissionEntry>;
}

export interface MissionOffers {
  plot?: MissionOffer[];
  guild?: MissionOffer[];
  other?: MissionOffer[];
  coalition?: MissionOffer[];
}

export interface ActiveMission {
  name: string;
  description: string;
  completed: boolean;
  reward: number;
  timeleft: number;
}

export interface ResearchResource {
  name: string;
  currentAmount: number;
  totalAmount: number;
}

export interface CurrentResearch {
  name: string | null;
  description: string;
  researchtime: number;
  percentageCompleted: number;
  precursors: Array<{ name: string }>;
  resources: ResearchResource[];
}

export interface LogbookEntry {
  title: string;
  text: string;
  factionname: string;
}

export interface GenericDataRecord {
  [key: string]: unknown;
}

export interface GenericListItem {
  [key: string]: unknown;
}

export interface GameState {
  _meta: ConnectionMeta;
  player: PlayerInfo;
  ship: ShipStatus;
  flight: FlightState;
  combat: CombatState;
  missionOffers: MissionOffers | null;
  activeMission: ActiveMission | null;
  logbook: { list: LogbookEntry[] } | null;
  currentResearch: CurrentResearch | null;
  factions: GenericDataRecord | null;
  agents: GenericListItem[] | null;
  inventory: GenericDataRecord | null;
  transactionLog: { list: GenericListItem[] } | null;
}

export interface KeyBinding {
  key: string;
  modifiers: string[];
  label: string;
  description: string;
}

export interface KeyBindings {
  description: string;
  note: string;
  bindings: Record<string, KeyBinding>;
}
