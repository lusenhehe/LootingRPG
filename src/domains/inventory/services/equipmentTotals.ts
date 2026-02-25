import type { Equipment, EquipmentAffixValue } from '../../../types/game';

export interface EquipmentTotals {
  attributes: Record<string, number>;
  affixes: Record<string, number>;
}

export function getEquipmentTotals(equips: Record<string, Equipment | null>): EquipmentTotals {
  const attributes: Record<string, number> = {};
  const affixes: Record<string, number> = {};

  Object.values(equips).forEach((item) => {
    if (!item) return;
    Object.entries(item.attributes).forEach(([key, value]) => {
      const num = typeof value === 'number' ? value : Number(value) || 0;
      attributes[key] = (attributes[key] || 0) + num;
    });

    item.affixes.forEach((a: EquipmentAffixValue) => {
      affixes[a.type] = (affixes[a.type] || 0) + a.value;
    });
  });

  return { attributes, affixes };
}
