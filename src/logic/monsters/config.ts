import type { Monster, MonsterBaseStats, MonsterScalingProfile, MonsterTrait } from '../../types/game';
import { getMapMonsterBaselineByLevel, resolveMonsterTemplateStats } from '../stats/monsterScaling';
import { t } from 'i18next';
import monsterConfig from '../../config/content/monsters.json';
import {
  type RawMonsterData,
  type RawMonsterPhase,
  validateMonsterConfigData,
} from '../../config/content/monsterSchema';

const { normal: rawNormal, boss: rawBoss } = validateMonsterConfigData(monsterConfig);

const localizeAdditionalFields = (monster: RawMonsterData): RawMonsterData => {
  const result = { ...monster };

  if (monster.phases) {
    result.phases = monster.phases.map((phase: RawMonsterPhase) => ({
      ...phase,
      label: phase.labelKey ? t(phase.labelKey) : phase.label || '',
    })) as RawMonsterPhase[];
  }

  if (monster.counterGoal) {
    result.counterGoal = {
      ...monster.counterGoal,
      title: monster.counterGoal.titleKey ? t(monster.counterGoal.titleKey) : monster.counterGoal.title,
      successText: monster.counterGoal.successTextKey ? t(monster.counterGoal.successTextKey) : t(monster.counterGoal.successText || ''),
      failText: monster.counterGoal.failTextKey ? t(monster.counterGoal.failTextKey) : t(monster.counterGoal.failText || ''),
    };
  }

  if (monster.bossIdentity) {
    result.bossIdentity = {
      ...monster.bossIdentity,
      introLine: monster.bossIdentity.introLineKey ? t(monster.bossIdentity.introLineKey) : monster.bossIdentity.introLine,
      battleLogLine: monster.bossIdentity.battleLogLineKey ? t(monster.bossIdentity.battleLogLineKey) : monster.bossIdentity.battleLogLine,
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

const normalizeBaseStats = (monster: RawMonsterData): MonsterBaseStats => {
  return {
    hp: Number(monster.baseStats?.hp) || 1,
    attack: Number(monster.baseStats?.attack) || 1,
    defense: Number(monster.baseStats?.defense) || 1,
  };
};

const normalizeScalingProfile = (monster: RawMonsterData): MonsterScalingProfile => {
  if (monster.scalingProfile) return monster.scalingProfile as MonsterScalingProfile;
  return monster.tier === 'boss' || monster.isBoss ? 'boss' : 'normal';
};

const normalizeTags = (monster: RawMonsterData): string[] => {
  const tags = Array.isArray(monster.tags) ? [...monster.tags] : [];
  if (monster.tier === 'boss' || monster.isBoss) tags.push('boss');
  if (Array.isArray(monster.traits)) {
    monster.traits.forEach((trait: MonsterTrait) => tags.push(trait));
  }
  return Array.from(new Set(tags));
};

const normalizeSkillSet = (monster: RawMonsterData): string[] => {
  if (Array.isArray(monster.skillSet)) return monster.skillSet;
  const traits: MonsterTrait[] = Array.isArray(monster.traits) ? monster.traits : [];
  const skills = traits.map((trait) => TRAIT_TO_SKILL[trait]).filter(Boolean);
  return Array.from(new Set(skills));
};

const toMonster = (monster: RawMonsterData): Monster => {
  const icons = [monster.icon as string];

  const baseStats = normalizeBaseStats(monster);
  const scalingProfile = normalizeScalingProfile(monster);
  const previewStats = resolveMonsterTemplateStats(
    { baseStats, scalingProfile },
    getMapMonsterBaselineByLevel(1),
  );

  return {
    ...(localizeAdditionalFields(monster) as Monster),
    icons,
    level: Math.max(1, Number(monster.level) || 1),
    baseStats,
    scalingProfile,
    tags: normalizeTags(monster),
    skillSet: normalizeSkillSet(monster),
    maxHp: previewStats.maxHp,
    attack: previewStats.attack,
    defense: previewStats.defense,
    name: t(`monster.${monster.id}`, { defaultValue: monster.id ?? 'unknown_monster' }),
  } as Monster;
};

export const NORMAL_MONSTERS_DATA: Monster[] = rawNormal.map(toMonster);
export const BOSS_MONSTERS_DATA: Monster[] = rawBoss.map(toMonster);

const ALL_MONSTERS_DATA: Monster[] = [...NORMAL_MONSTERS_DATA, ...BOSS_MONSTERS_DATA];

export const getMonsterById = (id: string): Monster | undefined => {
  return ALL_MONSTERS_DATA.find((monster) => monster.id === id);
};