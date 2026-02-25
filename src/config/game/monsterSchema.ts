export type MonsterType = 'normal' | 'elite' | 'boss';
import monsterConfig from '@data/config/game/monsterConfig.json';

export type MonsterTrait = typeof monsterConfig.traits[number];
export interface RawMonsterBaseStats { hp?: number; attack?: number; defense?: number;}

export interface RawMonsterPhase {
  id?: string; label?: string; labelKey?: string; interval?: number;
  action?: string;}

export interface RawBossCounterGoal {
  title?: string; titleKey?: string;
  stat?: string; threshold?: number;
  successText?: string; successTextKey?: string;
  failText?: string; failTextKey?: string;
}

/**
 * 只包含普通怪共有的字段
 */
export interface RawMonsterData {
  id?: string;
  icon?: string;
  monsterType?: MonsterType;
  baseStats?: RawMonsterBaseStats;
  scalingProfile?: string;
  skillSet?: string[];
  traits?: MonsterTrait[];
  uniqueTraits?: MonsterTrait[];
  phases?: RawMonsterPhase[];
  threatTypes?: string[];
  background?: string;
  dropdict?: Record<string, number>;
}

/**
 * boss 构造时的额外字段
 */
export interface RawBossData extends RawMonsterData {
  bossIdentity?: {
    theme?: string;
    introLine?: string;
    introLineKey?: string;
    battleLogLine?: string;
    battleLogLineKey?: string;
    phasePrompts?: Record<string, string>;
  };
  counterGoal?: RawBossCounterGoal;
  counterGoalLabel?: string;
}

export interface MonsterConfigData {
  normal: RawMonsterData[];
  boss:   RawBossData[];
}

export type MonsterPhaseAction = 'drain_soul' | 'reconstruct' | 'annihilation';

export interface MonsterPhase {
  id: string;
  label: string;
  interval: number;
  action: MonsterPhaseAction;
}
export type MonsterScalingProfile = 'normal' | 'tank' | 'glass' | 'bruiser' | 'striker' | 'boss';
export interface MonsterBaseStats { hp: number; attack: number; defense: number;}
export type ThreatType = 'burst_punish' | 'sustain_pressure' | 'tank_breaker' | 'attrition';
export interface BossIdentity {
  theme: string;
  introLine: string;
  battleLogLine: string;
  phasePrompts?: Partial<Record<'entering' | 'fighting' | 'dying' | 'dropping', string>>;
}
export type CounterStatKey = typeof monsterConfig.strategy.counterGoalScoreMap[keyof typeof monsterConfig.strategy.counterGoalScoreMap];
export interface BossCounterGoal {
  title: string;
  stat: CounterStatKey;
  threshold: number;
  successText: string;
  failText: string;
}
//战术标签（策略推荐方向）
export type StrategyTag = typeof monsterConfig.strategy.tag[number];
//词条评分映射表
export const traitScoreMap: Record<MonsterTrait, Partial<Record<StrategyTag, number>>> = monsterConfig.strategy.traitScoreMap;
//**对抗目标计分表
export const counterGoalScoreMap: Record<string, StrategyTag> = monsterConfig.strategy.counterGoalScoreMap;
export interface Monster {
  id:    string;     // 唯一标识符
  name:  string;     // 显示名称
  icons: string[];   // 图标列表，至少一个
  level: number;     // 怪物等级，影响属性和掉落
  monsterType:    MonsterType;          /// 怪物类型
  baseStats:      MonsterBaseStats;     /// 基础属性，包含hp、attack和defense
  scalingProfile: MonsterScalingProfile;/// 属性成长类型，影响属性随等级的增长方式
  skillSet?: string[];   /// 
  maxHp: number;/// 
  attack: number;/// 
  defense: number;/// 
  traits?: MonsterTrait[];/// 
  uniqueTraits?: MonsterTrait[];/// 
  phases?: MonsterPhase[];
  threatTypes?: ThreatType[];
  /// 怪物背景故事文本，仅用于UI显示，不影响游戏逻辑
  background?: string;  
  bossIdentity?: BossIdentity;  ///> 仅Boss怪物拥有的身份信息，包括主题、介绍语和战斗日志语
  counterGoal?:  BossCounterGoal;
  ///> 怪物特定的计数目标达成状态，仅用于UI显示，实际逻辑仍以玩家stats为准
  counterGoalLabel?: string;
  ///> 怪物特定的计数目标达成状态，仅用于UI显示，实际逻辑仍以玩家stats为准
  counterGoalPassed?: boolean;
  ///> 怪物特定的掉落字典，格式为 { [equipmentTemplateId]: chance }，用于覆盖默认掉落逻辑
  dropdict?: Record<string, number>;
}
const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};


function ensureMonsterArray<K extends 'normal' | 'boss'>(value: unknown, key: K): K extends 'boss' ? RawBossData[] : RawMonsterData[] {
  if (!Array.isArray(value)) {
    throw new Error(`[monsterSchema] '${key}' must be an array`);
  }

  value.forEach((entry, index) => {
    if (!isObject(entry)) {
      throw new Error(`[monsterSchema] '${key}[${index}]' must be an object`);
    }
    if (typeof entry.id !== 'string' || !entry.id.trim()) {
      throw new Error(`[monsterSchema] '${key}[${index}].id' is required`);
    }
    if (typeof entry.icon !== 'string' || !entry.icon.trim()) {
      throw new Error(`[monsterSchema] '${key}[${index}].icon' is required`);
    }
    if (!isObject(entry.baseStats)) {
      throw new Error(`[monsterSchema] '${key}[${index}].baseStats' is required`);
    }
    if (typeof entry.monsterType !== 'string' || !['normal', 'elite', 'boss'].includes(entry.monsterType)) {
      throw new Error(`[monsterSchema] '${key}[${index}].monsterType' must be one of: normal, elite, boss`);
    }
    if (key === 'boss' && entry.monsterType !== 'boss') {
      throw new Error(`[monsterSchema] '${key}[${index}].monsterType' must be 'boss' in boss section`);
    }
    if (entry.dropdict !== undefined) {
      if (!isObject(entry.dropdict)) {
        throw new Error(`[monsterSchema] '${key}[${index}].dropdict' must be an object if provided`);
      }
      Object.entries(entry.dropdict).forEach(([dropId, chance]) => {
        if (!dropId.trim()) {
          throw new Error(`[monsterSchema] '${key}[${index}].dropdict' contains an empty item id`);
        }
        const chanceValue = Number(chance);
        if (!Number.isFinite(chanceValue) || chanceValue <= 0) {
          throw new Error(`[monsterSchema] '${key}[${index}].dropdict.${dropId}' must be a positive number`);
        }
      });
    }
  });

  if (key === 'boss') {
    return value as RawBossData[];
  }
  return value as RawMonsterData[];
};

export const validateMonsterConfigData = (value: unknown): MonsterConfigData => {
  if (!isObject(value)) {
    throw new Error('[monsterSchema] root must be an object');
  }

  const normal = ensureMonsterArray(value.normal, 'normal');
  const boss = ensureMonsterArray(value.boss, 'boss');

  return { normal, boss };
};
