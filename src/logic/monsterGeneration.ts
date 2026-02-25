import { getMapMonsterBaselineByLevel, resolveMonsterTemplateStats } from './stats/monsterScaling';
import { NORMAL_MONSTERS_DATA, BOSS_MONSTERS_DATA } from './monsters/config';
import { Monster , ALL_MONSTER_TRAITS} from '../config/content/monsterSchema';
import { attachMonsterLore } from './monsters/lore';
import i18n from '../i18n';
const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
const maybeAddTrait = (base: Monster, force = false): Monster => {
  const current = [...(base.traits ?? [])];
  const remain = ALL_MONSTER_TRAITS.filter((t) => !current.includes(t));
  if (!remain.length) return base;
  if (!force && Math.random() > 0.4) return base;
  return { ...base, traits: [...current, pickRandom(remain)] };
};
interface MonsterSpawnOptions { isBoss: boolean; playerLevel: number; encounterCount: number}
export const getRandomMonster = ({ isBoss, playerLevel, encounterCount }: MonsterSpawnOptions): Monster => {
  const basePool = isBoss ? BOSS_MONSTERS_DATA : NORMAL_MONSTERS_DATA;
  const pool        = basePool;
  const picked      = pool[Math.floor(Math.random() * pool.length)];
  const eliteChance = isBoss ? 0 : 0.08;
  const isElite     = Math.random() < eliteChance;
  const levelFromEncounter = Math.floor(Math.max(0, encounterCount) / 8); 
  const bossLevelBonus = isBoss ? 3 : 0;
  const monsterLevel   = playerLevel + levelFromEncounter + bossLevelBonus;
  const levelScale     = 1 + (monsterLevel - 1) * 0.08;
  const templateStats = resolveMonsterTemplateStats(
    { baseStats: picked.baseStats, scalingProfile: picked.scalingProfile },
    getMapMonsterBaselineByLevel(monsterLevel),
  );
  let monster: Monster = {
    ...picked,
    icons: picked.icons,
    level: monsterLevel,
    monsterType: isElite ? 'elite' : picked.monsterType,
    maxHp:   Math.floor(templateStats.maxHp * levelScale),
    attack:  Math.floor(templateStats.attack * levelScale),
    defense: Math.floor(templateStats.defense * (1 + (monsterLevel - 1) * 0.06)),
  };

  if (isElite) {
    monster = maybeAddTrait(
      {
        ...monster,
        name: `${i18n.t('monster.elitePrefix')}${monster.name}`,
        maxHp: Math.floor(monster.maxHp * 1.35),
        attack: Math.floor(monster.attack * 1.28),
        defense: Math.floor(monster.defense * 1.22),
      },
      true,
    );
  }
  return attachMonsterLore(monster);
};