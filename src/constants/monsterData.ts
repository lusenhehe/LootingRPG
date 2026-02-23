import type { Monster } from '../types/game';
import type { MonsterBaseStats, MonsterScalingProfile } from '../types/game';
import { getMapMonsterBaselineByLevel, resolveMonsterTemplateStats } from './monsterScaling';

// main.tsx already initializes i18n; keep this file pure and only import `t`
import { t } from 'i18next';

// load static configuration from JSON; names are handled via i18n keys
import monsterConfig from '../config/monsters.json';

// cast to any because JSON shape may include i18n keys that don't match Monster exactly
const { normal: rawNormal, boss: rawBoss } = monsterConfig as any;

// helper that converts optional key fields (labelKey, titleKey, etc) using t()
const localizeAdditionalFields = (m: any): any => {
  if (m.phases) {
    m.phases = m.phases.map((p: any) => ({
      ...p,
      label: p.labelKey ? t(p.labelKey) : p.label || '',
    }));
  }
  if (m.counterGoal) {
    m.counterGoal = {
      ...m.counterGoal,
      title: m.counterGoal.titleKey ? t(m.counterGoal.titleKey) : m.counterGoal.title,
      successText: m.counterGoal.successText ? t(m.counterGoal.successText) : m.counterGoal.successText,
      failText: m.counterGoal.failText ? t(m.counterGoal.failText) : m.counterGoal.failText,
    };
  }
  return m;
};

const TRAIT_TO_SKILL: Record<string, string> = {
  lifesteal: 'lifeSteal',
  double_attack: 'doubleStrike',
  thorns: 'thornAura',
  shield_on_start: 'shieldStart',
  rage_on_low_hp: 'rageMode',
};

const normalizeBaseStats = (m: any): MonsterBaseStats => {
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

const normalizeScalingProfile = (m: any): MonsterScalingProfile => {
  if (m.scalingProfile) return m.scalingProfile as MonsterScalingProfile;
  return m.tier === 'boss' ? 'boss' : 'normal';
};

const normalizeTags = (m: any): string[] => {
  const base = Array.isArray(m.tags) ? [...m.tags] : [];
  if (m.tier === 'boss' || m.isBoss) base.push('boss');
  if (Array.isArray(m.traits)) {
    m.traits.forEach((trait: string) => base.push(trait));
  }
  return Array.from(new Set(base));
};

const normalizeSkillSet = (m: any): string[] => {
  if (Array.isArray(m.skillSet)) return m.skillSet;
  const traits: string[] = Array.isArray(m.traits) ? m.traits : [];
  const skills = traits.map((trait) => TRAIT_TO_SKILL[trait]).filter(Boolean);
  return Array.from(new Set(skills));
};

// attach translated name lazily
const addTranslatedName = (m: any): Monster => {
  // ensure icons array exists, fall back to single icon
  const icons = [] as string[];
  if (Array.isArray(m.icons)) icons.push(...m.icons);
  else if (m.icon) icons.push(m.icon);
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

