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

export interface GameState {
  playerStats: PlayerStats;
  battleResult: string;
  droppedEquipment: Equipment | null;
  backpack: Equipment[];
  systemMessage: string;
  currentEquipment: Record<string, Equipment | null>;
  pityCounts: {
    legendary: number;
    mythic: number;
  };
}

export type MonsterTier = 'normal' | 'boss';

export type MonsterScalingProfile = 'normal' | 'tank' | 'glass' | 'bruiser' | 'striker' | 'boss';

export interface MonsterBaseStats {
  hp: number;
  attack: number;
  defense: number;
}

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

export type CounterStatKey =
  'attack' | 'defense' | 'hp' |
  'elemental' | 'lifesteal' |
  'thorns' | 'attackSpeed';

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
  icons: string[];
  level: number;
  tier: MonsterTier;
  isBoss?: boolean;
  elite?: boolean;
  baseStats: MonsterBaseStats;
  scalingProfile: MonsterScalingProfile;
  tags?: string[];
  skillSet?: string[];
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
  currentMonsters: Monster[];
  monsterHpPercents: number[];
  currentMonster: Monster | null;
  isBossBattle: boolean;
  playerHpPercent: number;
  monsterHpPercent: number;
  showAttackFlash: boolean;
  waveContext?: {
    currentWave: number;
    totalWaves: number;
    remainingInWave: number;
    remainingTotal: number;
  };
  monsterDamageLabels: string[];
  monsterStatusLabels: string[];
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
  monsterHpPercents?: number[];
  showAttackFlash: boolean;
  playerDamageLabel?: string;
  monsterDamageLabel?: string;
  monsterDamageLabels?: string[];
  playerStatusLabel?: string;
  monsterStatusLabel?: string;
  monsterStatusLabels?: string[];
  elementLabel?: string;
  combatLogs?: string[];
}

export type ActiveTab = 'status' | 'map' | 'inventory' | 'forge' | 'codex';
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
