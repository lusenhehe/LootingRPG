import type { Monster, MonsterScalingProfile, MonsterTrait } from '../../shared/types/game';
import { type RawMonsterData, type RawBossData } from '../../config/game/monsterSchema';
import { getMapMonsterBaselineByLevel, resolveMonsterTemplateStats } from '../battle/services/monsterScaling';
import monsterConfig from '@data/config/game/monsters.json';
import { t } from 'i18next';

const { normal: rawNormal, boss: rawBoss } = monsterConfig;
const isBossData = (m: RawMonsterData | RawBossData): m is RawBossData => {
  return 'counterGoal' in m || 'bossIdentity' in m;
};

const localizeAdditionalFields = (
  monster: RawMonsterData | RawBossData,
): RawMonsterData | RawBossData => {
  const result = { ...monster } as typeof monster;
  if (isBossData(monster) && monster.counterGoal) {
    (result as RawBossData).counterGoal = {
      ...monster.counterGoal,
      title: monster.counterGoal.titleKey ? t(monster.counterGoal.titleKey) : monster.counterGoal.title,
      successText: monster.counterGoal.successTextKey
        ? t(monster.counterGoal.successTextKey)
        : t(monster.counterGoal.successText || ''),
      failText: monster.counterGoal.failTextKey
        ? t(monster.counterGoal.failTextKey)
        : t(monster.counterGoal.failText || ''),
    } as RawBossData['counterGoal'];
  }

  if (isBossData(monster) && monster.bossIdentity) {
    (result as RawBossData).bossIdentity = {
      ...monster.bossIdentity,
      introLine: monster.bossIdentity.introLineKey
        ? t(monster.bossIdentity.introLineKey)
        : monster.bossIdentity.introLine,
      battleLogLine: monster.bossIdentity.battleLogLineKey
        ? t(monster.bossIdentity.battleLogLineKey)
        : monster.bossIdentity.battleLogLine,
    } as RawBossData['bossIdentity'];
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

const normalizeSkillSet = (
  monster: RawMonsterData | RawBossData,
): string[] => {
  if (Array.isArray(monster.skillSet)) return monster.skillSet;
  const traits: MonsterTrait[] = Array.isArray(monster.traits) ? monster.traits : [];
  const skills = traits.map((trait) => TRAIT_TO_SKILL[trait]).filter(Boolean);
  return Array.from(new Set(skills));
};

const toMonster = (monster: RawMonsterData | RawBossData): Monster => {
  const icons = [monster.icon as string];
  const monsterType = monster.monsterType;
  const baseStats = {
    hp:      Number(monster.baseStats?.hp),
    attack:  Number(monster.baseStats?.attack),
    defense: Number(monster.baseStats?.defense),
  };
  const scalingProfile = monster.scalingProfile as MonsterScalingProfile;
  const previewStats = resolveMonsterTemplateStats(
    { baseStats, scalingProfile },
    getMapMonsterBaselineByLevel(1),
  );
  return {
    ...(localizeAdditionalFields(monster) as Monster),
    icons,
    level: 1,
    monsterType,
    baseStats,
    scalingProfile,
    skillSet: normalizeSkillSet(monster),
    maxHp:   previewStats.maxHp,
    attack:  previewStats.attack,
    defense: previewStats.defense,
    name: t(`monster.${monster.id}`, { defaultValue: monster.id ?? 'unknown_monster' }),
    dropdict: Object.fromEntries( Object.entries(monster.dropdict ?? {})
      .map(([id, chance]) => [id, chance]))
  } as Monster;
};

export const NORMAL_MONSTERS_DATA: Monster[] = rawNormal.map(toMonster);
export const BOSS_MONSTERS_DATA:   Monster[] = rawBoss.map(toMonster);
const ALL_MONSTERS_DATA: Monster[] = [...NORMAL_MONSTERS_DATA, ...BOSS_MONSTERS_DATA];

export const getMonsterById = (id: string): Monster | undefined => {
  return ALL_MONSTERS_DATA.find((monster) => monster.id === id);
};