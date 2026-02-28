import monsterConfig from '@data/config/game/monsterConfig.json';
export type MonsterTrait          = typeof monsterConfig.traits[number];
export type ThreatType            = typeof monsterConfig.threatTypes[number];
export type MonsterType           = typeof monsterConfig.monsterTypes[number];
export type MonsterScalingProfile = keyof typeof monsterConfig.scalingProfileStats;
export type ScalingProfileStats = { [key in MonsterScalingProfile]: EntityStats };
export type StrategyTag           = typeof monsterConfig.strategy.tag[number];
export type CounterStatKey        = typeof monsterConfig.strategy.counterGoalScoreMap[keyof typeof monsterConfig.strategy.counterGoalScoreMap];
export const SCALING_PROFILES: ScalingProfileStats = monsterConfig.scalingProfileStats as ScalingProfileStats;
export interface RawMonsterBaseStats { hp?: number; attack?: number; defense?: number}
// 基础生命/攻击/防御三围，可供玩家和怪物统一使用
// 优先从静态配置文件读取，若配置缺失则使用内置回退值
export const BASELINE_STATS: {
  hp: { baseline: number; levelAdder: number };
  attack: { baseline: number; levelAdder: number };
  defense: { baseline: number; levelAdder: number };
} = monsterConfig.baselineStats;
export interface EntityStats { hp: number; attack: number; defense: number; }
export interface RawBossCounterGoal {
  title?: string; titleKey?: string;
  stat?: string; threshold?: number;
  successText?: string; successTextKey?: string;
  failText?: string; failTextKey?: string
}
export interface RawMonsterData {
  id?: string;
  icon?: string;
  monsterType?: MonsterType;
  baseStats?: RawMonsterBaseStats;
  scalingProfile?: string;
  skillSet?: string[];
  traits?: MonsterTrait[];
  uniqueTraits?: MonsterTrait[];
  threatTypes?: string[];
  background?: string;
  dropdict?: Record<string, number>;
}
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
export type MonsterBaseStats = EntityStats;
export interface BossIdentity {
  theme: string;
  introLine: string;
  battleLogLine: string;
  phasePrompts?: Partial<Record<'entering' | 'fighting' | 'dying' | 'dropping', string>>;
}
export interface BossCounterGoal {
  title: string;
  stat: CounterStatKey;
  threshold: number;
  successText: string;
  failText: string;
}
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
  maxHp: number;  /// 
  attack: number; /// 
  defense: number;/// 
  traits?: MonsterTrait[];/// 
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