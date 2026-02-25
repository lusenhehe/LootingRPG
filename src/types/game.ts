import { Monster } from '../config/content/monsterSchema';
export type { Monster } from '../config/content/monsterSchema';
export type { MonsterTrait, MonsterBaseStats, MonsterScalingProfile, ThreatType, BossIdentity, BossCounterGoal, CounterStatKey, MonsterPhase } from '../config/content/monsterSchema';
export { ALL_MONSTER_TRAITS } from '../config/content/monsterSchema';
export interface PlayerStats {
  level: number; xp: number; attack: number; hp: number;
  defense: number; critRate: string; damageBonus: number; lifesteal: number;
  thorns: number;
  elemental: number;
  attackSpeed: number;
  gold: number;
}
export type EquipmentAffix = 'crit_chance' | 'lifesteal' | 'damage_bonus' | 'thorns' | 'hp_bonus';
export interface EquipmentAffixValue {
  type: EquipmentAffix;
  value: number;
}
export interface Equipment {
  id: string;
  icon: string;
  level: number;
  name: string;
  quality: string;
  slot: string;
  attributes: Record<string, number>;
  special?: string;
  affixes: EquipmentAffixValue[];
  enhancementLevel: number;
  mainStat: string;
  equipped: boolean;
  localeNames?: {
    zh?: string;
    en?: string;
  };
}

export interface BattlePlayerRuntimeStats {
  attack: number;
  damageReduction: number;
  critRate: number;
  lifestealRate: number;
  thornsRate: number;
  elementalBonus: number;
}

export interface BattleEnemySnapshot {
  id: string;
  monsterId: string;
  name: string;
  icon: string;
  waveId: string;
  waveLabel?: string;
  maxHp: number;
  hp: number;
  attack: number;
  damageReduction: number;
  isBoss: boolean;
  dropdict?: Record<string, number>;
}

export type BattleSessionStatus = 'fighting' | 'victory' | 'defeat' | 'retreated';

export interface BattleSession {
  id: string;
  chapterId: string;
  chapterName: string;
  nodeId: string;
  nodeName: string;
  encounterType: string;
  turn: number;
  playerMaxHp: number;
  playerHp: number;
  player: BattlePlayerRuntimeStats;
  enemies: BattleEnemySnapshot[];
  waveOrder: string[];
  currentWaveIndex: number;
  status: BattleSessionStatus;
  logs: string[];
}

export interface BattleResult {
  sessionId: string;
  chapterId: string;
  nodeId: string;
  won: boolean;
  turns: number;
  xpGained: number;
  goldGained: number;
  finishedAt: number;
}

export interface BattleState {
  activeSession: BattleSession | null;
  history: BattleResult[];
}

export interface GameState {
  playerStats: PlayerStats;
  droppedEquipment: Equipment | null;
  backpack: Equipment[];
  systemMessage: string;
  currentEquipment: Record<string, Equipment | null>;
  pityCounts: {
    legendary: number;
    mythic: number;
  };
  battle: BattleState;
}
export type ActiveTab = 'map' | 'inventory' | 'forge' | 'codex';
export interface SaveProfile { id: string; name: string; updatedAt: number}

export interface MapProgressState {
  selectedChapterId: string;
  unlockedChapters: string[];
  unlockedNodes: string[];
  clearedNodes: string[];
  failedAttempts: Record<string, number>;
}

export interface SavePayload {
  gameState: GameState;
  logs: string[];
  autoSellQualities?: Record<string, boolean>;
  mapProgress?: MapProgressState;
}
