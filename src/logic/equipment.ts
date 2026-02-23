import { QUALITIES, QUALITY_CONFIG, SLOTS, STAT_POOL } from '../config/game/equipment';
import { getQualityLabel, getSlotLabel } from './i18n/labels';
import type { Equipment, EquipmentAffix, EquipmentAffixValue } from '../types/game';

const NAME_PREFIX = ['裂空', '霜烬', '黯影', '炽焰', '星辉', '雷鸣', '荒骨', '苍穹', '逐日', '深渊', '银月', '余烬'];
const NAME_SUFFIX = ['之誓', '遗物', '战歌', '祷言', '守望', '审判', '回响', '魂印', '锋芒', '刻痕', '秘契', '冠冕'];

// slot-based Chinese base names for flavour; keyed by english slot keys
const SLOT_BASE_NAME: Record<string, string[]> = {
  weapon: ['战刃', '长枪', '巨剑', '法杖', '短匕', '猎弓'],
  helmet: ['王冠', '战盔', '兜帽', '羽冠', '铁盔', '秘帽'],
  armor: ['胸甲', '战袍', '鳞甲', '重甲', '皮衣', '法衣'],
  ring: ['魂戒', '秘戒', '誓戒', '曜环', '辉戒', '指环'],
  necklace: ['护符', '坠饰', '链坠', '圣印', '符链', '灵坠'],
  boots: ['战靴', '疾靴', '秘履', '重靴', '影足', '踏风靴'],
};

const SLOT_ICON_POOL: Record<string, string[]> = {
  weapon: ['⚔️', '🗡️', '🏹', '🪓', '🔨', '🪄'],
  helmet: ['⛑️', '🪖', '👑', '🧢', '🎭', '🧠'],
  armor: ['🛡️', '🥋', '🦺', '🧥', '🦾', '🦴'],
  ring: ['💍', '💠', '🔷', '🌀', '✨', '🧿'],
  necklace: ['📿', '🔮', '🪬', '💎', '🌙', '☀️'],
  boots: ['👢', '🥾', '🩰', '🛼', '💨', '🪽'],
};

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const AFFIX_POOL: EquipmentAffix[] = ['crit_chance', 'lifesteal', 'damage_bonus', 'thorns', 'hp_bonus'];

const createAffix = (type: EquipmentAffix, qualityIndex: number): EquipmentAffixValue => {
  const tier = qualityIndex + 1;

  if (type === 'crit_chance') return { type, value: 1 + tier };
  if (type === 'lifesteal') return { type, value: 1 + Math.floor(tier * 0.8) };
  if (type === 'damage_bonus') return { type, value: 2 + tier * 2 };
  if (type === 'thorns') return { type, value: 2 + tier * 2 };
  return { type, value: 8 + tier * 12 };
};

const createAffixes = (quality: string, isBoss: boolean): EquipmentAffixValue[] => {
  const qualityIndex = Math.max(0, QUALITIES.indexOf(quality));
  const countByQuality = [0, 1, 1, 2, 3, 4];
  const count = Math.max(0, countByQuality[qualityIndex] + (isBoss && qualityIndex >= 2 ? 1 : 0));

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
  const prefix = pick(NAME_PREFIX);
  const base = pick(SLOT_BASE_NAME[slot] ?? ['装备']);
  const suffix = pick(NAME_SUFFIX);
  // quality may be english key; display label
  const qLabel = getQualityLabel(quality);
  return `${qLabel}·${prefix}${base}${suffix}`;
};

export const getDefaultEquipmentIcon = (slot: string): string => {
  return pick(SLOT_ICON_POOL[slot] ?? ['🧰']);
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
  const baseValue = Math.floor((qualityIndex + 1) * 5 * equipmentLevel);
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
