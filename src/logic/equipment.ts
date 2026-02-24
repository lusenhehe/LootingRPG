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

const buildEquipmentStats = (
  quality: string,
  slot: string,
  equipmentLevel: number,
): { stats: Record<string, number>; mainStat: string; baseValue: number } => {
  const config = QUALITY_CONFIG[quality];
  const stats: Record<string, number> = {};
  const qualityIndex = Math.max(0, QUALITIES.indexOf(quality));

  const mainStat = slot === 'weapon' ? 'attack' : slot === 'armor' || slot === 'helmet' ? 'hp' : 'defense';
  const multiplier = (BASE_MULTIPLIER_BY_QUALITY && BASE_MULTIPLIER_BY_QUALITY[qualityIndex]) ?? (qualityIndex + 1);
  const baseValue = Math.floor(multiplier * 5 * equipmentLevel);
  stats[mainStat] = baseValue;

  const availableStats = STAT_POOL.filter((s) => s !== mainStat);
  for (let i = 0; i < (config.stats || 1) - 1; i++) {
    const statName = availableStats[Math.floor(Math.random() * availableStats.length)];
    stats[statName] = Math.floor(baseValue * 0.6);
  }

  return { stats, mainStat, baseValue };
};

const createEquipmentObject = (
  quality: string, slot: string, equipmentLevel: number, isBoss: boolean,
): Equipment => {
  const { stats, mainStat } = buildEquipmentStats(quality, slot, equipmentLevel);
  return {
    id: Math.random().toString(36).slice(2, 11),
    icon: getDefaultEquipmentIcon(slot),
    level: equipmentLevel,
    name: buildEquipmentName(quality, slot),
    quality: quality,
    slot: slot,
    attributes: stats,
    affixes: createAffixes(quality, isBoss),
    enhancementLevel: 0,
    mainStat: mainStat,
    equipped: false,
    special: quality === 'mythic' ? '全属性提升 10%' : undefined,
  };
};

// ----- Enchant / Reroll helpers -----

export const calculateEnchantCost = (item: Equipment): number => {
  const qIdx = Math.max(0, QUALITIES.indexOf(item.quality));
  const base = ENCHANT_BASE_COST;
  const mult = ENCHANT_COST_MULTIPLIER_BY_QUALITY[qIdx] ?? 1;
  return Math.max(0, Math.floor(base * (item.enhancementLevel + 1) * mult));
};

export const previewEnchant = (item: Equipment, times = 1): Equipment => {
  const copy: Equipment = structuredClone(item);
  const qIdx = Math.max(0, QUALITIES.indexOf(copy.quality));
  const scale = ENCHANT_SCALE_BY_QUALITY[qIdx] ?? 0.05;
  for (let i = 0; i < times; i++) {
    copy.enhancementLevel = (copy.enhancementLevel || 0) + 1;
    Object.entries(copy.attributes).forEach(([k, v]) => {
      copy.attributes[k] = Math.max(0, Math.round((v as number) * (1 + scale)));
    });
    // scale affix values as well
    if (Array.isArray(copy.affixes)) {
      copy.affixes = copy.affixes.map((a) => ({
        type: a.type,
        value: Math.max(0, Math.round(a.value * (1 + scale))),
      }));
    }
  }
  return copy;
};

export const applyEnchant = (item: Equipment): Equipment => {
  const qIdx = Math.max(0, QUALITIES.indexOf(item.quality));
  const scale = ENCHANT_SCALE_BY_QUALITY[qIdx] ?? 0.05;
  item.enhancementLevel = (item.enhancementLevel || 0) + 1;
  Object.entries(item.attributes).forEach(([k, v]) => {
    item.attributes[k] = Math.max(0, Math.round((v as number) * (1 + scale)));
  });
  // scale affix values as well
  if (Array.isArray(item.affixes)) {
    item.affixes = item.affixes.map((a) => ({
      type: a.type,
      value: Math.max(0, Math.round(a.value * (1 + scale))),
    }));
  }
  return item;
};

export const rerollAffixes = (item: Equipment, options?: { lockTypes?: string[] }): Equipment => {
  const qIdx = Math.max(0, QUALITIES.indexOf(item.quality));
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
  pity: { legendary: number; mythic: number },
  playerLevel: number,
): { item: Equipment; newPity: { legendary: number; mythic: number } } => {
  // english keys used internally
  let quality = 'common';
  const rand = Math.random() * 100;
  const newPity = { ...pity };

  newPity.legendary++;
  newPity.mythic++;

  // pity counters still stored with Chinese keys for legacy persistence
  if ((newPity as any).神话 !== undefined || (newPity as any).传说 !== undefined) {
    const n: any = newPity;
    if (n.神话 !== undefined) {
      n.mythic = n.神话;
      delete n.神话;
    }
    if (n.传说 !== undefined) {
      n.legendary = n.传说;
      delete n.传说;
    }
  }

  if (newPity.mythic >= 201) {
    quality = 'mythic';
    newPity.mythic = 0;
    newPity.legendary = 0;
  } else if (newPity.legendary >= 51) {
    quality = Math.random() > 0.1 ? 'legendary' : 'mythic';
    if (quality === 'mythic') newPity.mythic = 0;
    newPity.legendary = 0;
  } else {
    if (isBoss) {
      if (rand < 3) quality = 'mythic';
      else if (rand < 10) quality = 'legendary';
      else if (rand < 25) quality = 'epic';
      else if (rand < 50) quality = 'rare';
      else if (rand < 80) quality = 'uncommon';
      else quality = 'common';
    } else {
      if      (rand < 0) quality = 'mythic';
      else if (rand < 1) quality = 'legendary';
      else if (rand < 5) quality = 'epic';
      else if (rand < 15) quality = 'rare';
      else if (rand < 40) quality = 'uncommon';
      else quality = 'common';
    }
    if (quality === 'legendary') newPity.legendary = 0;
    if (quality === 'mythic') {
      newPity.mythic = 0;
      newPity.legendary = 0;
    }
  }

  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const levelVariance = Math.floor(Math.random() * 3) - 1;
  const bossLevelBonus = isBoss ? 2 : 0;
  const equipmentLevel = Math.max(1, playerLevel + levelVariance + bossLevelBonus);

  const item = createEquipmentObject(quality, slot, equipmentLevel, isBoss);

  return { item, newPity };
};

export const createCustomEquipment = (
  quality: string,
  slot: string,
  playerLevel = 1,
  isBoss = false,
): Equipment => {
  const bossLevelBonus = isBoss ? 2 : 0;
  const equipmentLevel = Math.max(1, playerLevel + bossLevelBonus);

  return createEquipmentObject(quality, slot, equipmentLevel, isBoss);
};
