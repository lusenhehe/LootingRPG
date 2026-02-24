import { QUALITIES, QUALITY_CONFIG, SLOTS, STAT_POOL, AFFIX_SCALING, AFFIX_COUNT_BY_QUALITY, BASE_MULTIPLIER_BY_QUALITY, SLOT_BASE_NAMES, SLOT_ICON_POOL, NAME_PREFIXES, NAME_SUFFIXES, ENCHANT_BASE_COST, ENCHANT_SCALE_BY_QUALITY, ENCHANT_COST_MULTIPLIER_BY_QUALITY, REROLL_BASE_COST, LOCK_COST } from '../config/game/equipment';
import { getQualityLabel, getSlotLabel } from './i18n/labels';
import type { Equipment, EquipmentAffix, EquipmentAffixValue } from '../types/game';
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const AFFIX_POOL: EquipmentAffix[] = ['crit_chance', 'lifesteal', 'damage_bonus', 'thorns', 'hp_bonus'];

const createAffix = (type: EquipmentAffix, qualityIndex: number): EquipmentAffixValue => {
  const idx = Math.min(Math.max(0, qualityIndex), QUALITIES.length - 1);
  const scaling = (AFFIX_SCALING as Record<string, number[]>)[type] ?? [];
  const value = scaling[idx] ?? 0;
  return { type, value };
};

const createAffixes = (quality: string, isBoss: boolean): EquipmentAffixValue[] => {
  const qualityIndex = Math.max(0, QUALITIES.indexOf(quality));
  const countBase = (AFFIX_COUNT_BY_QUALITY && AFFIX_COUNT_BY_QUALITY[qualityIndex]) ?? 0;
  const count = Math.max(0, countBase + (isBoss && qualityIndex >= 2 ? 1 : 0));

  const pool = [...AFFIX_POOL];
  const affixes: EquipmentAffixValue[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const index = Math.floor(Math.random() * pool.length);
    const affixType = pool.splice(index, 1)[0];
    affixes.push(createAffix(affixType, qualityIndex));
  }

  return affixes;
};

const buildEquipmentName = (quality: string, slot: string): string => {
  const prefix = pick(NAME_PREFIXES);
  const base = pick(SLOT_BASE_NAMES[slot] ?? ['装备']);
  const suffix = pick(NAME_SUFFIXES);
  const qLabel = getQualityLabel(quality);
  return `${qLabel}·${prefix}${base}${suffix}`;
};

export const getDefaultEquipmentIcon = (slot: string): string => {
  return pick(SLOT_ICON_POOL[slot] ?? ['🧰']);
};

// ----- Enchant / Reroll helpers -----

export const calculateEnchantCost = (item: Equipment): number => {
  const qIdx = Math.max(0, QUALITIES.indexOf(item.品质));
  const base = ENCHANT_BASE_COST;
  const mult = ENCHANT_COST_MULTIPLIER_BY_QUALITY[qIdx] ?? 1;
  return Math.max(0, Math.floor(base * (item.强化等级 + 1) * mult));
};

export const previewEnchant = (item: Equipment, times = 1): Equipment => {
  const copy: Equipment = JSON.parse(JSON.stringify(item));
  const qIdx = Math.max(0, QUALITIES.indexOf(copy.品质));
  const scale = ENCHANT_SCALE_BY_QUALITY[qIdx] ?? 0.05;
  for (let i = 0; i < times; i++) {
    copy.强化等级 = (copy.强化等级 || 0) + 1;
    Object.entries(copy.属性).forEach(([k, v]) => {
      copy.属性[k] = Math.max(0, Math.round((v as number) * (1 + scale)));
    });
  }
  return copy;
};

export const applyEnchant = (item: Equipment): Equipment => {
  const qIdx = Math.max(0, QUALITIES.indexOf(item.品质));
  const scale = ENCHANT_SCALE_BY_QUALITY[qIdx] ?? 0.05;
  item.强化等级 = (item.强化等级 || 0) + 1;
  Object.entries(item.属性).forEach(([k, v]) => {
    item.属性[k] = Math.max(0, Math.round((v as number) * (1 + scale)));
  });
  return item;
};

export const rerollAffixes = (item: Equipment, options?: { lockTypes?: string[] }): Equipment => {
  const qIdx = Math.max(0, QUALITIES.indexOf(item.品质));
  const lockTypes = options?.lockTypes ?? [];
  const existing = Array.isArray(item.affixes) ? item.affixes.slice() : [];
  const kept = existing.filter(a => lockTypes.includes(a.type));
  const needed = Math.max(0, (AFFIX_COUNT_BY_QUALITY[qIdx] ?? 0) - kept.length);
  const pool = AFFIX_POOL.filter(p => !lockTypes.includes(p));
  const newAffixes: EquipmentAffixValue[] = [];
  for (let i = 0; i < needed && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const type = pool.splice(idx, 1)[0];
    newAffixes.push(createAffix(type as EquipmentAffix, qIdx));
  }
  item.affixes = [...kept, ...newAffixes];
  return item;
};

export const generateEquipment = (
  isBoss: boolean,
  pity: { 传说: number; 神话: number },
  playerLevel: number,
): { item: Equipment; newPity: { 传说: number; 神话: number } } => {
  // english keys used internally
  let quality = 'common';
  const rand = Math.random() * 100;
  const newPity = { ...pity };

  newPity.传说++;
  newPity.神话++;

  // pity counters still stored with Chinese keys for legacy persistence
  if (newPity.神话 >= 201) {
    quality = 'mythic';
    newPity.神话 = 0;
    newPity.传说 = 0;
  } else if (newPity.传说 >= 51) {
    quality = Math.random() > 0.1 ? 'legendary' : 'mythic';
    if (quality === 'mythic') newPity.神话 = 0;
    newPity.传说 = 0;
  } else {
    if (isBoss) {
      if (rand < 3) quality = 'mythic';
      else if (rand < 10) quality = 'legendary';
      else if (rand < 25) quality = 'epic';
      else if (rand < 50) quality = 'rare';
      else if (rand < 80) quality = 'uncommon';
      else quality = 'common';
    } else {
      if (rand < 0) quality = 'mythic';
      else if (rand < 1) quality = 'legendary';
      else if (rand < 5) quality = 'epic';
      else if (rand < 15) quality = 'rare';
      else if (rand < 40) quality = 'uncommon';
      else quality = 'common';
    }

    if (quality === 'legendary') newPity.传说 = 0;
    if (quality === 'mythic') {
      newPity.神话 = 0;
      newPity.传说 = 0;
    }
  }

  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const config = QUALITY_CONFIG[quality];
  const stats: Record<string, number> = {};
  const qualityIndex = Math.max(0, QUALITIES.indexOf(quality));
  const levelVariance = Math.floor(Math.random() * 3) - 1;
  const bossLevelBonus = isBoss ? 2 : 0;
  const equipmentLevel = Math.max(1, playerLevel + levelVariance + bossLevelBonus);

  // use english keys internally; keep STAT_POOL in sync
  const mainStat = slot === 'weapon' ? 'attack' : slot === 'armor' || slot === 'helmet' ? 'hp' : 'defense';
  const multiplier = (BASE_MULTIPLIER_BY_QUALITY && BASE_MULTIPLIER_BY_QUALITY[qualityIndex]) ?? (qualityIndex + 1);
  const baseValue = Math.floor(multiplier * 5 * equipmentLevel);
  stats[mainStat] = baseValue;

  // when rerolling or adding secondary stats we rely on english STAT_POOL values
  const availableStats = STAT_POOL.filter((s) => s !== mainStat);
  for (let i = 0; i < config.stats - 1; i++) {
    const statName = availableStats[Math.floor(Math.random() * availableStats.length)];
    stats[statName] = Math.floor(baseValue * 0.6);
  }

  const item: Equipment = {
    id: Math.random().toString(36).slice(2, 11),
    icon: getDefaultEquipmentIcon(slot),
    等级: equipmentLevel,
    名称: buildEquipmentName(quality, slot),
    品质: quality,
    部位: slot,
    属性: stats, // english keys
    affixes: createAffixes(quality, isBoss),
    强化等级: 0,
    主属性: mainStat, // now an english key like 'attack'|'hp'|'defense'
    已装备: false,
    特殊效果: quality === 'mythic' ? '全属性提升 10%' : undefined,
  };

  return { item, newPity };
};
