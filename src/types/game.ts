export interface PlayerStats {
  等级: number;
  经验: number;
  攻击力: number;
  生命值: number;
  防御力: number;
  暴击率: string;
  伤害加成: number;
  吸血: number;
  反伤: number;
  元素伤害: number;
  攻击速度: number;
  金币: number;
}

export type EquipmentAffix = 'crit_chance' | 'lifesteal' | 'damage_bonus' | 'thorns' | 'hp_bonus';

export interface EquipmentAffixValue {
  type: EquipmentAffix;
  value: number;
}

export interface Equipment {
  id: string;
  icon: string;
  等级: number;
  名称: string;
  品质: string;
  部位: string;
  属性: Record<string, number>;
  特殊效果?: string;
  affixes: EquipmentAffixValue[];
  强化等级: number;
  主属性: string;
  已装备: boolean;
}

export interface GameState {
  玩家状态: PlayerStats;
  战斗结果: string;
  掉落装备: Equipment | null;
  背包: Equipment[];
  系统消息: string;
  当前装备: Record<string, Equipment | null>;
  保底计数: {
    传说: number;
    神话: number;
  };
}

export type MonsterTier = 'normal' | 'boss';

export type MonsterTrait =
  | 'thorns'
  | 'lifesteal'
  | 'double_attack'
  | 'shield_on_start'
  | 'rage_on_low_hp';

export type ThreatType = 'burst_punish' | 'sustain_pressure' | 'tank_breaker' | 'attrition';

export type BossTheme = 'abyss' | 'dragonfire' | 'iron' | 'necro' | 'storm' | 'blood' | 'void' | 'clockwork';

export interface BossIdentity {
  theme: BossTheme;
  introLine: string;
  battleLogLine: string;
  phasePrompts?: Partial<Record<'entering' | 'fighting' | 'dying' | 'dropping', string>>;
}

export type CounterStatKey = '攻击力' | '防御力' | '生命值' | '元素伤害' | '吸血' | '反伤' | '攻击速度';

export interface BossCounterGoal {
  title: string;
  stat: CounterStatKey;
  threshold: number;
  successText: string;
  failText: string;
}

export type MonsterPhaseAction = 'drain_soul' | 'reconstruct' | 'annihilation';

export interface MonsterPhase {
  id: string;
  label: string;
  interval: number;
  action: MonsterPhaseAction;
}

export interface Monster {
  id: string;
  name: string;
  icon: string;
  等级: number;
  tier: MonsterTier;
  isBoss?: boolean;
  elite?: boolean;
  maxHp: number;
  attack: number;
  defense: number;
  traits?: MonsterTrait[];
  uniqueTraits?: MonsterTrait[];
  phases?: MonsterPhase[];
  threatTypes?: ThreatType[];
  background?: string;
  bossIdentity?: BossIdentity;
  counterGoal?: BossCounterGoal;
  counterGoalLabel?: string;
  counterGoalPassed?: boolean;
}

export type BattlePhase = 'idle' | 'entering' | 'fighting' | 'dying' | 'dropping';

export interface BattleState {
  phase: BattlePhase;
  currentMonster: Monster | null;
  isBossBattle: boolean;
  playerHpPercent: number;
  monsterHpPercent: number;
  showAttackFlash: boolean;
  playerDamageLabel: string | null;
  monsterDamageLabel: string | null;
  playerStatusLabel: string | null;
  monsterStatusLabel: string | null;
  elementLabel: string | null;
  showDropAnimation: boolean;
  dropLabel: string | null;
  encounterCount: number;
}

export interface BattleFrame {
  playerHpPercent: number;
  monsterHpPercent: number;
  showAttackFlash: boolean;
  playerDamageLabel?: string;
  monsterDamageLabel?: string;
  playerStatusLabel?: string;
  monsterStatusLabel?: string;
  elementLabel?: string;
  combatLogs?: string[];
}

export type ActiveTab = 'status' | 'map' | 'inventory' | 'forge' | 'codex';

export interface SaveProfile {
  id: string;
  name: string;
  updatedAt: number;
}

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
