import type { EntityStats } from '../../config/game/monsterSchema';
export type { Monster } from '../../config/game/monsterSchema';
export type { MonsterTrait, MonsterBaseStats, MonsterScalingProfile, ThreatType, BossIdentity, BossCounterGoal, CounterStatKey, EntityStats, ScalingProfileStats } from '../../config/game/monsterSchema';

export interface PlayerStats extends EntityStats     {
  level: number;
  xp: number;
  critRate: string;
  damageBonus: number;
  lifesteal: number;
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

export interface BattleEnemySnapshot extends EntityStats {
  id: string;
  monsterId: string;
  name: string;
  icon: string;
  waveId: string;
  waveLabel?: string;
  maxHp: number;
  damageReduction: number;
  isBoss: boolean;
  dropdict?: Record<string, number>;
}

export type BattleSessionStatus = 'fighting' | 'victory' | 'defeat' | 'retreated';

export interface BattleSession {
  id: string;            // 唯一标识符，格式为 "battle_timestamp"
  chapterId: string;     // 所属章节ID
  chapterName: string;   // 所属章节名称（冗余字段，便于快速访问）
  nodeId: string;        // 所属节点ID
  nodeName: string;      // 所属节点名称（冗余字段，便于快速访问）
  encounterType: string; // 遭遇类型（例如 "normal"、"elite"、"boss"），用于区分不同的战斗场景和规则
  turn: number;          // 当前回合数，从1开始递增
  playerMaxHp: number;   // 玩家最大生命值，基于玩家属性和当前装备计算得出
  playerHp: number;      // 玩家当前生命值，战斗过程中会根据伤害和治疗效果进行更新
  player: BattlePlayerRuntimeStats; // 玩家战斗时的实时属性，包括攻击力、伤害减免、暴击率、吸血率等，基于玩家属性和当前装备计算得出
  enemies: BattleEnemySnapshot[];   // 敌人快照列表，每个敌人包含其属性、当前生命值、所属波次等信息，战斗过程中会根据伤害进行更新
  waveOrder: string[];         // 波次顺序列表，记录当前战斗中敌人所属的波次顺序，便于在战斗日志和界面上显示当前波次状态
  currentWaveIndex: number;    // 当前波次索引，指示玩家正在面对哪个波次的敌人，战斗过程中会根据敌人被击败的情况进行更新
  status: BattleSessionStatus; // 战斗状态，指示当前战斗是进行中、胜利、失败还是撤退，战斗过程中会根据玩家和敌人的状态进行更新
  logs: string[];              // 战斗日志，记录战斗过程中发生的事件和操作，便于回放和调试
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
