import type { EntityStats } from '../../config/game/monsterSchema';
import type { BattleUnitInstance } from '../../types/battle/BattleUnit';
export type { Monster } from '../../config/game/monsterSchema';
export type { MonsterTrait, MonsterBaseStats, MonsterScalingProfile, ThreatType, BossIdentity, BossCounterGoal, CounterStatKey, EntityStats, ScalingProfileStats } from '../../config/game/monsterSchema';

export type BattlePhase =
  | 'player_input'
  | 'resolving'
  | 'enemy_turn'
  | 'finished';

export interface BattleAction {
  id: string;
  type: 'basic_attack' | 'skill' | 'passive';
  sourceId: string;
  targetIds: string[];
  payload?: Record<string, unknown>;
}

export type BattleLifecycleEvent =
  | {
      type: 'before_action';
      action: BattleAction;
      sourceId: string;
    }
  | {
      type: 'after_action';
      action: BattleAction;
      sourceId: string;
    }
  | {
      type: 'before_damage';
      sourceId: string;
      targetId: string;
    }
  | {
      type: 'after_damage';
      sourceId: string;
      targetId: string;
      amount: number;
    }
  | {
      type: 'on_kill';
      killerId: string;
      victimId: string;
    }
  | {
      type: 'on_turn_start';
      turn: number;
    };

export type ApplyDamageEvent = {
  type: 'apply_damage';
  sourceId: string;
  targetId: string;
  amount: number;
};

export type ApplyHealEvent = {
  type: 'apply_heal';
  sourceId: string;
  targetId: string;
  amount: number;
};

export type UnitDiedEvent = {
  type: 'unit_died';
  unitId: string;
  killerId?: string;
};

export type TurnEndEvent = {
  type: 'turn_end';
};

export type StatusAppliedEvent = {
  type: 'status_applied';
  targetId: string;
  statusId: string;
  statusType: 'dot' | 'hot' | 'buff' | 'debuff' | 'shield';
  stacks: number;
  duration: number;
  magnitude: number;
  element?: string;
  sourceId?: string;
};

export type StatusTickEvent = {
  type: 'status_tick';
  targetId: string;
  statusId: string;
};

export type ElementReactionEvent = {
  type: 'element_reaction';
  reaction: string;
  sourceId: string;
  targetId: string;
};

export type CastEvent = {
  type: 'on_cast';
  sourceId: string;
  skillId: string;
};

export type StatusExpiredEvent = {
  type: 'status_expired';
  targetId: string;
  statusId: string;
};

export type BattleEvent =
  | ApplyDamageEvent
  | ApplyHealEvent
  | UnitDiedEvent
  | TurnEndEvent         // 回合结束事件，指示当前回合结束，通常用于触发状态效果的持续时间减少、DOT/HOT生效等逻辑
  | BattleLifecycleEvent // 战斗生命周期事件（如技能释放前后、伤害应用前后、单位死亡、回合开始等）
  | StatusAppliedEvent   // 状态效果应用事件（如DOT/HOT/Buff/Debuff/Shield被施加）
  | StatusTickEvent      // 状态效果触发事件（如DOT/HOT每回合生效）
  | ElementReactionEvent // 元素反应事件
  | CastEvent            // 技能释放事件
  | StatusExpiredEvent;  // 状态过期事件

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

export type BattleSessionStatus = 'fighting' | 'victory' | 'defeat';

export interface BattleSession {
  id: string;            // 唯一标识符，格式为 "battle_timestamp"
  chapterId: string;     // 所属章节ID
  chapterName: string;   // 所属章节名称（冗余字段，便于快速访问）
  nodeId: string;        // 所属节点ID
  nodeName: string;      // 所属节点名称（冗余字段，便于快速访问）
  encounterType: string; // 遭遇类型（例如 "normal"、"elite"、"boss"），用于区分不同的战斗场景和规则
  turn: number;          // 当前回合数，从1开始递增
  phase: BattlePhase;
  player: BattleUnitInstance;
  enemies: BattleUnitInstance[];
  waveOrder: string[];         // 波次顺序列表，记录当前战斗中敌人所属的波次顺序，便于在战斗日志和界面上显示当前波次状态
  currentWaveIndex: number;    // 当前波次索引，指示玩家正在面对哪个波次的敌人，战斗过程中会根据敌人被击败的情况进行更新
  status: BattleSessionStatus; // 战斗状态，指示当前战斗是进行中、胜利、失败还是撤退，战斗过程中会根据玩家和敌人的状态进行更新
  events: BattleEvent[];
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
