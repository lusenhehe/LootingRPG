import type { Monster } from '../types/game';
import { BOSS_MONSTERS_DATA, NORMAL_MONSTERS_DATA } from './monsterData';
import { attachMonsterLore } from './monsterLore';

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

export const STAT_KEY_MAP: Record<string, string> = {
  attack: 'attack',
  hp: 'hp',
  defense: 'defense',
  crit: 'crit',
  critDamage: 'critDamage',
  attackSpeed: 'attackSpeed',
  lifesteal: 'lifesteal',
  elemental: 'elemental',
  攻击力: 'attack',
  生命值: 'hp',
  防御力: 'defense',
  暴击率: 'crit',
  暴击伤害: 'critDamage',
  攻击速度: 'attackSpeed',
  吸血: 'lifesteal',
  元素伤害: 'elemental',
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

// Storage keys for local persistence
export const STORAGE_KEY = 'ai_rpg_save_local';
export const PROFILE_INDEX_KEY = 'ai_rpg_profiles';
export const ACTIVE_PROFILE_KEY = 'ai_rpg_active_profile';

// Processed monster data with lore attached
export const NORMAL_MONSTERS: Monster[] = NORMAL_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));
export const BOSS_MONSTERS: Monster[] = BOSS_MONSTERS_DATA.map((monster) => attachMonsterLore(monster));

// Helper to create auto-sell quality map with all qualities disabled by default
export const createAutoSellQualityMap = (): Record<string, boolean> => {
  return QUALITIES.reduce((acc, quality) => {
    acc[quality] = false;
    return acc;
  }, {} as Record<string, boolean>);
};