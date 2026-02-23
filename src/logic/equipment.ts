import { QUALITIES, QUALITY_CONFIG, SLOTS, STAT_POOL } from '../constants/game';
import type { Equipment, EquipmentAffix, EquipmentAffixValue } from '../types/game';

const NAME_PREFIX = ['裂空', '霜烬', '黯影', '炽焰', '星辉', '雷鸣', '荒骨', '苍穹', '逐日', '深渊', '银月', '余烬'];
const NAME_SUFFIX = ['之誓', '遗物', '战歌', '祷言', '守望', '审判', '回响', '魂印', '锋芒', '刻痕', '秘契', '冠冕'];

const SLOT_BASE_NAME: Record<string, string[]> = {
  武器: ['战刃', '长枪', '巨剑', '法杖', '短匕', '猎弓'],
  头盔: ['王冠', '战盔', '兜帽', '羽冠', '铁盔', '秘帽'],
  护甲: ['胸甲', '战袍', '鳞甲', '重铠', '皮衣', '法衣'],
  戒指: ['魂戒', '秘戒', '誓戒', '曜环', '辉戒', '指环'],
  项链: ['护符', '坠饰', '链坠', '圣印', '符链', '灵坠'],
  鞋子: ['战靴', '疾靴', '秘履', '重靴', '影足', '踏风靴'],
};

const SLOT_ICON_POOL: Record<string, string[]> = {
  武器: ['⚔️', '🗡️', '🏹', '🪓', '🔨', '🪄'],
  头盔: ['⛑️', '🪖', '👑', '🧢', '🎭', '🧠'],
  护甲: ['🛡️', '🥋', '🦺', '🧥', '🦾', '🦴'],
  戒指: ['💍', '💠', '🔷', '🌀', '✨', '🧿'],
  项链: ['📿', '🔮', '🪬', '💎', '🌙', '☀️'],
  鞋子: ['👢', '🥾', '🩰', '🛼', '💨', '🪽'],
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
  return `${quality}·${prefix}${base}${suffix}`;
};

export const getDefaultEquipmentIcon = (slot: string): string => {
  return pick(SLOT_ICON_POOL[slot] ?? ['🧰']);
};

export const generateEquipment = (
  isBoss: boolean,
  pity: { 传说: number; 神话: number },
  level: number,
): { item: Equipment; newPity: { 传说: number; 神话: number } } => {
  let quality = '普通';
  const rand = Math.random() * 100;
  const newPity = { ...pity };

  newPity.传说++;
  newPity.神话++;

  if (newPity.神话 >= 201) {
    quality = '神话';
    newPity.神话 = 0;
    newPity.传说 = 0;
  } else if (newPity.传说 >= 51) {
    quality = Math.random() > 0.1 ? '传说' : '神话';
    if (quality === '神话') newPity.神话 = 0;
    newPity.传说 = 0;
  } else {
    if (isBoss) {
      if (rand < 3) quality = '神话';
      else if (rand < 10) quality = '传说';
      else if (rand < 25) quality = '史诗';
      else if (rand < 50) quality = '稀有';
      else if (rand < 80) quality = '优秀';
      else quality = '普通';
    } else {
      if (rand < 0) quality = '神话';
      else if (rand < 1) quality = '传说';
      else if (rand < 5) quality = '史诗';
      else if (rand < 15) quality = '稀有';
      else if (rand < 40) quality = '优秀';
      else quality = '普通';
    }

    if (quality === '传说') newPity.传说 = 0;
    if (quality === '神话') {
      newPity.神话 = 0;
      newPity.传说 = 0;
    }
  }

  const slot = SLOTS[Math.floor(Math.random() * SLOTS.length)];
  const config = QUALITY_CONFIG[quality];
  const stats: Record<string, number> = {};

  const mainStat = slot === '武器' ? '攻击力' : slot === '护甲' || slot === '头盔' ? '生命值' : '防御力';
  const baseValue = (QUALITIES.indexOf(quality) + 1) * 5 * level;
  stats[mainStat] = baseValue;

  const availableStats = STAT_POOL.filter((s) => s !== mainStat);
  for (let i = 0; i < config.stats - 1; i++) {
    const statName = availableStats[Math.floor(Math.random() * availableStats.length)];
    stats[statName] = Math.floor(baseValue * 0.6);
  }

  const item: Equipment = {
    id: Math.random().toString(36).substr(2, 9),
    icon: getDefaultEquipmentIcon(slot),
    名称: buildEquipmentName(quality, slot),
    品质: quality,
    部位: slot,
    属性: stats,
    affixes: createAffixes(quality, isBoss),
    强化等级: 0,
    主属性: mainStat,
    已装备: false,
    特殊效果: quality === '神话' ? '全属性提升 10%' : undefined,
  };

  return { item, newPity };
};
