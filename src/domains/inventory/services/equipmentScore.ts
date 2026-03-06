import type { Equipment } from '../../../shared/types/game';

const PERCENT_AFFIX_KEYS = new Set<string>(['crit_chance', 'lifesteal', 'damage_bonus', 'thorns']);

const ATTRIBUTE_WEIGHT: Record<string, number> = {
  attack: 3,
  defense: 3,
  hp: 0.12,
  attackSpeed: 4,
  dodge: 2,
  block: 2,
  elemental: 2,
};

const AFFIX_WEIGHT: Record<string, number> = {
  crit_chance: 2.4,
  lifesteal: 2,
  damage_bonus: 2.2,
  thorns: 1.6,
  hp_bonus: 0.6,
};

export const getEquipmentScore = (item: Equipment): number => {
  const attributeScore = Object.entries(item.attributes).reduce((sum, [key, rawValue]) => {
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue) || 0;
    const weight = ATTRIBUTE_WEIGHT[key] ?? 1.2;
    return sum + value * weight;
  }, 0);

  const affixScore = item.affixes.reduce((sum, affix) => {
    const weight = AFFIX_WEIGHT[affix.type] ?? 1.3;
    const normalizedValue = PERCENT_AFFIX_KEYS.has(affix.type) ? affix.value : affix.value * 0.6;
    return sum + normalizedValue * weight;
  }, 0);

  const enhancementBonus = item.enhancementLevel * 8;
  return Math.max(1, Math.round(attributeScore + affixScore + enhancementBonus));
};
