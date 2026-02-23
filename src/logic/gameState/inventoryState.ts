import { getDefaultEquipmentIcon } from '../equipment';
import type { Equipment } from '../../types/game';

/**
 * Normalizes equipment data and ensures structural consistency
 */
const normalizeEquipment = (item: Equipment): Equipment => {
  const quality = item.品质;
  const slot = item.部位;

  const attrs: Record<string, number> = {};
  Object.entries(item.属性).forEach(([k, v]) => {
    attrs[k] = v;
  });

  const main = item.主属性;

  return {
    ...item,
    等级: Math.max(1, Number((item as any).等级) || 1),
    品质: quality,
    部位: slot,
    icon: item.icon || getDefaultEquipmentIcon(slot),
    属性: attrs,
    主属性: main,
    affixes: Array.isArray(item.affixes) ? item.affixes : [],
  };
};

/**
 * Normalizes the inventory and equipped items in the game state
 */
export const normalizeInventory = (backpack: Equipment[], currentEquipment: Record<string, Equipment | null>) => {
  const normalizedBackpack = backpack.map((item) => ({ ...normalizeEquipment(item), 已装备: false }));
  const normalizedCurrent = Object.fromEntries(
    Object.entries(currentEquipment).map(([slot, item]) => {
      const key = slot;
      return [key, item ? { ...normalizeEquipment(item), 已装备: true } : null];
    }),
  ) as Record<string, Equipment | null>;

  return {
    normalizedBackpack,
    normalizedCurrent,
  };
};