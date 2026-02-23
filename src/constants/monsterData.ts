import type { Monster, MonsterBaseStats, MonsterScalingProfile, MonsterTrait, BossIdentity, MonsterPhase } from '../types/game';
import { getMapMonsterBaselineByLevel, resolveMonsterTemplateStats } from './monsterScaling';

// main.tsx already initializes i18n; keep this file pure and only import `t`
import { t } from 'i18next';

// load static configuration from JSON; names are handled via i18n keys
import monsterConfig from '../config/monsters.json';

// Define strict types for raw JSON data
interface RawMonsterBaseStats {
  hp?: number;
  attack?: number;
  defense?: number;
}

interface RawMonsterPhase {
  id?: string;
  label?: string;
  labelKey?: string;
  interval?: number;
  action?: string;
}

interface RawBossCounterGoal {
  title?: string;
  titleKey?: string;
  stat?: string;
  threshold?: number;
  successText?: string;
  successTextKey?: string;
  failText?: string;
  failTextKey?: string;
}

interface RawMonsterData {
  id?: string;
  name?: string;
  nameKey?: string;
  icons?: string[];
  icon?: string; // legacy support
  等级?: number;
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
  // Legacy fields for backward compatibility
  maxHp?: number;
  attack?: number;
  defense?: number;
}

const { normal: rawNormal, boss: rawBoss } = monsterConfig as { normal: RawMonsterData[]; boss: RawMonsterData[] };

// helper that converts optional key fields (labelKey, titleKey, etc) using t()
const localizeAdditionalFields = (m: RawMonsterData): RawMonsterData => {
  const result = { ...m };

  if (m.phases) {
    result.phases = m.phases.map((p: RawMonsterPhase) => ({
      ...p,
      label: p.labelKey ? t(p.labelKey) : p.label || '',
    })) as RawMonsterPhase[];
  }

  if (m.counterGoal) {
    result.counterGoal = {
      ...m.counterGoal,
      title: m.counterGoal.titleKey ? t(m.counterGoal.titleKey) : m.counterGoal.title,
      successText: m.counterGoal.successTextKey ? t(m.counterGoal.successTextKey) : m.counterGoal.successText,
      failText: m.counterGoal.failTextKey ? t(m.counterGoal.failTextKey) : m.counterGoal.failText,
    };
  }

  if (m.bossIdentity) {
    result.bossIdentity = {
      ...m.bossIdentity,
      introLine: m.bossIdentity.introLineKey ? t(m.bossIdentity.introLineKey) : m.bossIdentity.introLine,
      battleLogLine: m.bossIdentity.battleLogLineKey ? t(m.bossIdentity.battleLogLineKey) : m.bossIdentity.battleLogLine,
    };
  }

  return result;
};

const TRAIT_TO_SKILL: Record<string, string> = {
  lifesteal: 'lifeSteal',
  double_attack: 'doubleStrike',
  thorns: 'thornAura',
  shield_on_start: 'shieldStart',
  rage_on_low_hp: 'rageMode',
};

const normalizeBaseStats = (m: RawMonsterData): MonsterBaseStats => {
  if (m.baseStats) {
    return {
      hp: Number(m.baseStats.hp) || 1,
      attack: Number(m.baseStats.attack) || 1,
      defense: Number(m.baseStats.defense) || 1,
    };
  }

  // backward-compatible path for legacy data carrying concrete stats
  const legacyHp = Math.max(1, Number(m.maxHp) || 120);
  const legacyAttack = Math.max(1, Number(m.attack) || 16);
  const legacyDefense = Math.max(0, Number(m.defense) || 7);
  const baseline = getMapMonsterBaselineByLevel(1);

  return {
    hp: Number((legacyHp / baseline.hp).toFixed(2)),
    attack: Number((legacyAttack / baseline.attack).toFixed(2)),
    defense: Number((legacyDefense / baseline.defense).toFixed(2)),
  };
};

const normalizeScalingProfile = (m: RawMonsterData): MonsterScalingProfile => {
  if (m.scalingProfile) return m.scalingProfile as MonsterScalingProfile;
  return m.tier === 'boss' || m.isBoss ? 'boss' : 'normal';
};

const normalizeTags = (m: RawMonsterData): string[] => {
  const base = Array.isArray(m.tags) ? [...m.tags] : [];
  if (m.tier === 'boss' || m.isBoss) base.push('boss');
  if (Array.isArray(m.traits)) {
    m.traits.forEach((trait: MonsterTrait) => base.push(trait));
  }
  return Array.from(new Set(base));
};

const normalizeSkillSet = (m: RawMonsterData): string[] => {
  if (Array.isArray(m.skillSet)) return m.skillSet;
  const traits: MonsterTrait[] = Array.isArray(m.traits) ? m.traits : [];
  const skills = traits.map((trait) => TRAIT_TO_SKILL[trait]).filter(Boolean);
  return Array.from(new Set(skills));
};

// attach translated name lazily
const addTranslatedName = (m: RawMonsterData): Monster => {
  // ensure icons array exists, fall back to single icon
  const icons = [] as string[];
  if (Array.isArray(m.icons)) icons.push(...m.icons);
  else if (m.icon) icons.push(m.icon); // legacy support

  const baseStats = normalizeBaseStats(m);
  const scalingProfile = normalizeScalingProfile(m);
  const previewStats = resolveMonsterTemplateStats(
    { baseStats, scalingProfile },
    getMapMonsterBaselineByLevel(1),
  );

  return {
    ...(localizeAdditionalFields(m) as Monster),
    icons,
    等级: Math.max(1, Number(m.等级) || 1),
    baseStats,
    scalingProfile,
    tags: normalizeTags(m),
    skillSet: normalizeSkillSet(m),
    maxHp: previewStats.maxHp,
    attack: previewStats.attack,
    defense: previewStats.defense,
    name: t(`monster.${m.id}`, { defaultValue: m.id ?? 'unknown_monster' }),
  } as Monster;
};

export const NORMAL_MONSTERS_DATA: Monster[] = rawNormal.map(addTranslatedName);
export const BOSS_MONSTERS_DATA: Monster[] = rawBoss.map(addTranslatedName);

// combined lookup table
const ALL_MONSTERS_DATA: Monster[] = [...NORMAL_MONSTERS_DATA, ...BOSS_MONSTERS_DATA];

/**
 * Find monster by id across normal and boss pools.
 */
export const getMonsterById = (id: string): Monster | undefined => {
  return ALL_MONSTERS_DATA.find((m) => m.id === id);
};

