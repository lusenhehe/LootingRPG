import type { GameState, Monster, MonsterTrait } from '../types/game';
import { BOSS_MONSTERS_DATA, NORMAL_MONSTERS_DATA } from './monsterData';
import { attachMonsterLore } from './monsterLore';
import { getMapMonsterBaselineByLevel, resolveMonsterTemplateStats } from './monsterScaling';

// configuration loaded from JSON, names/labels are translated at render time
// i18n initialization is handled in main.tsx; avoid re-importing side effects here
import { t } from 'i18next';
import gameConstants from '../config/gameConstants.json';

export const QUALITIES: string[] = gameConstants.qualities as string[];
export const SLOTS: string[] = gameConstants.slots as string[];
export const STAT_POOL: string[] = gameConstants.statPool as string[];

// legacy Chinese-to-English maps to migrate old saves
export const QUALITY_KEY_MAP: Record<string, string> = {
  普通: 'common',
  优秀: 'uncommon',
  稀有: 'rare',
  史诗: 'epic',
  传说: 'legendary',
  神话: 'mythic',
};

export const SLOT_KEY_MAP: Record<string, string> = {
  武器: 'weapon',
  头盔: 'helmet',
  护甲: 'armor',
  戒指: 'ring',
  项链: 'necklace',
  鞋子: 'boots',
};

// maps legacy Chinese stat keys to english; english values map to themselves for idempotence
export const STAT_KEY_MAP: Record<string, string> = {
  attack: 'attack',
  hp: 'hp',
  defense: 'defense',
  crit: 'crit',
  critDamage: 'critDamage',
  attackSpeed: 'attackSpeed',
  lifesteal: 'lifesteal',
  elemental: 'elemental',
};

export const QUALITY_CONFIG: Record<string, { stats: number; price: number; color: string; iconName: string }> =
  gameConstants.qualityConfig as any;

export const getQualityColor = (quality: string): string => {
  return QUALITY_CONFIG[quality]?.color || 'text-gray-400';
};

// helper to get translated label
export const getQualityLabel = (qualityKey: string): string => t(`quality.${qualityKey}`);
export const getSlotLabel = (slotKey: string): string => t(`slot.${slotKey}`);
export const getStatLabel = (statKey: string): string => t(`stat.${statKey}`);
export const STORAGE_KEY = 'ai_rpg_save_local';
export const PROFILE_INDEX_KEY = 'ai_rpg_profiles';
export const ACTIVE_PROFILE_KEY = 'ai_rpg_active_profile';

export const NORMAL_MONSTERS: Monster[] = NORMAL_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));
export const BOSS_MONSTERS: Monster[] = BOSS_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));

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
  // 50可能性性添加第二个图标，45%可能性添加一个属性图标（如果没有添加第二个图标）
  displayIcon += Math.random() < 0.5 ? secondIcon : '' + (Math.random() < 0.45 ? affix : '');

  const eliteChance = isBoss ? 0 : 0.08;                   // boss 不能成为精英，普通怪有小概率成为精英
  const isElite     = Math.random() < eliteChance;         // 是否成为精英怪
  const levelFromEncounter = Math.floor(Math.max(0, encounterCount) / 8); // 随着遭遇次数增加，怪物等级会逐渐提升，每8次增加1级
  // const levelVariance = Math.floor(Math.random() * 3) - 1; // 等级波动范围：-1, 0, +1，增加一些随机性
  const bossLevelBonus = isBoss ? 3 : 0;                   // boss 怪物比同等级的普通怪物更强，额外增加3级的属性加成
  const monsterLevel = Math.max(1, playerLevel + levelFromEncounter + bossLevelBonus);
  const levelScale = 1 + (monsterLevel - 1) * 0.08;
  const templateStats = resolveMonsterTemplateStats(
    { baseStats: picked.baseStats, scalingProfile: picked.scalingProfile },
    getMapMonsterBaselineByLevel(monsterLevel),
  );

  let monster: Monster = {
    ...picked,
    icons: [displayIcon],
    等级: monsterLevel,
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

export const createAutoSellQualityMap = (): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  QUALITIES.forEach((q) => {map[q] = false;});
  return map;
};

export const INITIAL_STATE: GameState = {
  玩家状态: {
    等级: 1,
    经验: 0,
    攻击力: 50,
    生命值: 300,
    防御力: 5,
    暴击率: '5%',
    伤害加成: 0,
    吸血: 0,
    反伤: 0,
    元素伤害: 0,
    攻击速度: 100,
    金币: 100,
  },
  战斗结果: '欢迎来到 AI 刷装备 RPG！(本地逻辑版)',
  掉落装备: null,
  背包: [],
  系统消息: '准备好开始你的冒险了吗？',
  当前装备: {
    weapon: null,
    helmet: null,
    armor: null,
    ring: null,
    necklace: null,
    boots: null,
  },
  保底计数: { 传说: 0, 神话: 0, },
};
