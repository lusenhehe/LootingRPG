import type { BattleRisk, GameState, Monster, MonsterTrait } from '../types/game';
import { BOSS_MONSTERS_DATA, NORMAL_MONSTERS_DATA, REGION_MONSTER_IDS } from './monsterData';
import { attachMonsterLore } from './monsterLore';

export const QUALITIES = ['普通', '优秀', '稀有', '史诗', '传说', '神话'];
export const SLOTS = ['武器', '头盔', '护甲', '戒指', '项链', '鞋子'];
export const STAT_POOL = ['攻击力', '生命值', '防御力', '暴击率', '暴击伤害', '攻击速度', '吸血', '元素伤害'];

export const QUALITY_CONFIG: Record<string, { stats: number; price: number; color: string; iconName: string }> = {
  普通: { stats: 1, price: 50, color: 'quality-common', iconName: 'shield' },
  优秀: { stats: 2, price: 100, color: 'quality-uncommon', iconName: 'zap' },
  稀有: { stats: 3, price: 300, color: 'quality-rare', iconName: 'gem' },
  史诗: { stats: 4, price: 1000, color: 'quality-epic', iconName: 'hexagon' },
  传说: { stats: 5, price: 5000, color: 'quality-legendary', iconName: 'crown' },
  神话: { stats: 6, price: 20000, color: 'quality-mythic', iconName: 'star' },
};

export const getQualityColor = (quality: string): string => {
  return QUALITY_CONFIG[quality]?.color || 'text-gray-400';
};

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
  region: 'forest' | 'dungeon' | 'volcano';
  risk: BattleRisk;
  spawnMultiplier: number;
}

export const getRandomMonster = ({ isBoss, region, risk, spawnMultiplier }: MonsterSpawnOptions): Monster => {
  const basePool = isBoss ? BOSS_MONSTERS_DATA : NORMAL_MONSTERS_DATA;
  const scopedPool = isBoss ? basePool : basePool.filter((monster) => REGION_MONSTER_IDS[region].includes(monster.id));
  const pool = scopedPool.length ? scopedPool : basePool;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  const secondIcon = pool[Math.floor(Math.random() * pool.length)].icon;
  const affixIcons = ['🔥', '⚡', '❄️', '☠️', '🛡️', '🌪️', '🩸', '✨'];
  const affix = affixIcons[Math.floor(Math.random() * affixIcons.length)];

  let icon = picked.icon;
  if (Math.random() < 0.5) {
    icon = `${picked.icon}${secondIcon}`;
  } else if (Math.random() < 0.45) {
    icon = `${picked.icon}${affix}`;
  }

  const riskEliteBonus = risk === 'nightmare' ? 0.18 : risk === 'normal' ? 0.08 : 0.02;
  const spawnEliteBonus = Math.max(0, spawnMultiplier - 1) * 0.06;
  const eliteChance = isBoss ? 0 : Math.min(0.45, riskEliteBonus + spawnEliteBonus);
  const isElite = Math.random() < eliteChance;

  let monster: Monster = { ...picked, icon, elite: isElite };

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
  } else if (risk === 'nightmare' && isBoss) {
    monster = maybeAddTrait(
      {
        ...monster,
        maxHp: Math.floor(monster.maxHp * 1.12),
        attack: Math.floor(monster.attack * 1.12),
        defense: Math.floor(monster.defense * 1.08),
      },
      true,
    );
  }

  return attachMonsterLore(monster);
};

export const createAutoSellQualityMap = (): Record<string, boolean> => ({
  普通: false,
  优秀: false,
  稀有: false,
  史诗: false,
  传说: false,
  神话: false,
});

export const INITIAL_STATE: GameState = {
  玩家状态: {
    等级: 1,
    经验: 0,
    攻击力: 10,
    生命值: 100,
    防御力: 5,
    暴击率: '5%',
    伤害加成: 0,
    吸血: 0,
    反伤: 0,
    元素伤害: 0,
    攻击速度: 0,
    金币: 100,
  },
  战斗结果: '欢迎来到 AI 刷装备 RPG！(本地逻辑版)',
  掉落装备: null,
  背包: [],
  系统消息: '准备好开始你的冒险了吗？',
  当前装备: {
    武器: null,
    头盔: null,
    护甲: null,
    戒指: null,
    项链: null,
    鞋子: null,
  },
  保底计数: {
    传说: 0,
    神话: 0,
  },
};
