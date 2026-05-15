export interface ConnectionMeta {
  timestamp: string;
  externalConnected: boolean;
  mockMode?: boolean;
  dashboardStoreVersion?: number;
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
  hull: number;         // 0-100 %
  shields: number;      // 0-100 %
  isDockedOrLanded: boolean;
}

export interface ShipControlState {
  occupied: boolean;
  controlled: boolean;
}

export interface FlightState {
  speed: number;          // current m/s
  maxSpeed: number;       // normal speed cap m/s
  maxBoostSpeed: number;  // boosted speed cap m/s (0 if unknown)
  maxTravelSpeed: number; // travel drive cap m/s (0 if unknown/auto-scale)
  boostEnergy: number;    // 0-100 %
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
  alertLevel: number;       // compatibility field; missile states drive the warning widget
  attackerCount: number;
  incomingMissiles: number;
  missileIncoming: boolean;
  missileLockingOn: boolean;
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

export interface TransactionLogEntry {
  id: string;
  eventType: string;
  eventLabel: string;
  partnerName: string | null;
  itemName: string | null;
  amount: number | null;
  unitPrice: number | null;
  value: number | null;
  time: number | null;
  timeText: string | null;
  description: string;
  destroyedPartner: boolean;
}

export interface TransactionLog {
  list: TransactionLogEntry[];
}

export interface FactionStanding {
  id: string;
  name: string;
  shortName: string;
  relationLabel: string;
  relationValue: number | null;
  licenseLabels: string[];
}

export interface AgentShipAssignment {
  id: string | null;
  name: string | null;
  prestige: string | null;
}

export interface DiplomacyAgent {
  id: string;
  name: string;
  rank: string;
  originFactionId: string;
  originFactionName: string;
  originFactionNameShort: string;
  gender: string;
  icon: string;
  ship: AgentShipAssignment;
  negotiationLevel: string;
  espionageLevel: string;
}

export interface AgentMission {
  type: string;
  name: string;
  likelihoodOfSuccess: string | null;
  successChance: number | null;
  riskToAgent: string | null;
  rewards: string | null;
  target: string | null;
  startTime: number | null;
  endTime: number | null;
  timeLeftSeconds: number | null;
  timeLeftText: string | null;
}

export interface AgentEntry {
  agent: DiplomacyAgent;
  currentMission: AgentMission | null;
}

export interface InventoryCategory {
  id: string;
  name: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  amount: number;
  category: InventoryCategory | null;
  isIllegal: boolean;
  averagePrice: number | null;
}

export interface InventoryData {
  list: InventoryItem[];
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
  control: ShipControlState;
  ship: ShipStatus;
  flight: FlightState;
  combat: CombatState;
  missionOffers: MissionOffers | null;
  activeMission: ActiveMission | null;
  logbook: { list: LogbookEntry[] } | null;
  currentResearch: CurrentResearch | null;
  factions: FactionStanding[] | null;
  agents: AgentEntry[] | null;
  inventory: InventoryData | null;
  transactionLog: TransactionLog | null;
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
