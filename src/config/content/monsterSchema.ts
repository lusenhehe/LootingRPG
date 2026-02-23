import type { MonsterTrait } from '../../types/game';

export interface RawMonsterBaseStats {
  hp?: number;
  attack?: number;
  defense?: number;
}

export interface RawMonsterPhase {
  id?: string;
  label?: string;
  labelKey?: string;
  interval?: number;
  action?: string;
}

export interface RawBossCounterGoal {
  title?: string;
  titleKey?: string;
  stat?: string;
  threshold?: number;
  successText?: string;
  successTextKey?: string;
  failText?: string;
  failTextKey?: string;
}

export interface RawMonsterData {
  id?: string;
  name?: string;
  nameKey?: string;
  icon?: string;
  level?: number;
  tier?: string;
  isBoss?: boolean;
  elite?: boolean;
  baseStats?: RawMonsterBaseStats;
  scalingProfile?: string;
  tags?: string[];
  skillSet?: string[];
  traits?: MonsterTrait[];
  uniqueTraits?: MonsterTrait[];
  phases?: RawMonsterPhase[];
  threatTypes?: string[];
  background?: string;
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
  boss: RawMonsterData[];
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const ensureMonsterArray = (value: unknown, key: 'normal' | 'boss'): RawMonsterData[] => {
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
  });

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
