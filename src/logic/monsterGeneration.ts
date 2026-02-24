import { getMapMonsterBaselineByLevel, resolveMonsterTemplateStats } from './stats/monsterScaling';
import { NORMAL_MONSTERS_DATA, BOSS_MONSTERS_DATA } from './monsters/config';
import type { Monster, MonsterTrait } from '../types/game';
import { attachMonsterLore } from './monsters/lore';
const TRAIT_POOL: MonsterTrait[] = ['thorns', 'lifesteal', 'double_attack', 'shield_on_start', 'rage_on_low_hp'];
const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const maybeAddTrait = (base: Monster, force = false): Monster => {
  const current = [...(base.traits ?? [])];
  const remain = TRAIT_POOL.filter((trait) => !current.includes(trait));
  if (!remain.length) return base;
  if (!force && Math.random() > 0.4) return base;
  return { ...base, traits: [...current, pickRandom(remain)] };
};

interface MonsterSpawnOptions {
  isBoss: boolean;
  playerLevel: number;
  encounterCount: number;
}

export const getRandomMonster = ({ isBoss, playerLevel, encounterCount }: MonsterSpawnOptions): Monster => {
  const basePool = isBoss ? BOSS_MONSTERS_DATA : NORMAL_MONSTERS_DATA;
  const pool = basePool;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  const secondIcon = pool[Math.floor(Math.random() * pool.length)].icons[0] || '';
  const affixIcons = ['🔥', '⚡', '❄️', '☠️', '🛡️', '🌪️', '🩸', '✨'];
  const affix = affixIcons[Math.floor(Math.random() * affixIcons.length)];

  // build display icon string from available icons
  let displayIcon = picked.icons[0] || '';
  // 50% chance to add second icon, 45% chance to add an affix icon (if not adding second icon)
  displayIcon += Math.random() < 0.5 ? secondIcon : '' + (Math.random() < 0.45 ? affix : '');

  const eliteChance = isBoss ? 0 : 0.08;                   // boss cannot become elite, normal monsters have small chance
  const isElite     = Math.random() < eliteChance;         // whether to become elite monster
  const levelFromEncounter = Math.floor(Math.max(0, encounterCount) / 8); // monster level increases with encounter count, +1 every 8 encounters
  // const levelVariance = Math.floor(Math.random() * 3) - 1; // level variance: -1, 0, +1, adds some randomness
  const bossLevelBonus = isBoss ? 3 : 0;                   // boss monsters are stronger than same-level normal monsters, +3 level bonus
  const monsterLevel = Math.max(1, playerLevel + levelFromEncounter + bossLevelBonus);
  const levelScale = 1 + (monsterLevel - 1) * 0.08;
  const templateStats = resolveMonsterTemplateStats(
    { baseStats: picked.baseStats, scalingProfile: picked.scalingProfile },
    getMapMonsterBaselineByLevel(monsterLevel),
  );

  let monster: Monster = {
    ...picked,
    icons: [displayIcon],
    level: monsterLevel,
    elite: isElite,
    maxHp: Math.max(1, Math.floor(templateStats.maxHp * levelScale)),
    attack: Math.max(1, Math.floor(templateStats.attack * levelScale)),
    defense: Math.max(0, Math.floor(templateStats.defense * (1 + (monsterLevel - 1) * 0.06))),
  };

  if (isElite) {
    monster = maybeAddTrait(
      {
        ...monster,
        name: `精英·${monster.name}`,
        maxHp: Math.floor(monster.maxHp * 1.35),
        attack: Math.floor(monster.attack * 1.28),
        defense: Math.floor(monster.defense * 1.22),
      },
      true,
    );
  }

  return attachMonsterLore(monster);
};