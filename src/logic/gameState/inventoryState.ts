import { getDefaultEquipmentIcon } from '../equipment';
import type { Equipment } from '../../types/game';

/**
 * Normalizes equipment data and ensures structural consistency
 */
const normalizeEquipment = (item: Equipment): Equipment => {
  const quality = item.quality;
  const slot = item.slot;

  const attrs: Record<string, number> = {};
  Object.entries(item.attributes).forEach(([k, v]) => {
    attrs[k] = v;
  });

  const main = item.mainStat;

  return {
    ...item,
    level: Math.max(1, Number((item as any).level) || 1),
    quality,
    slot,
    icon: item.icon || getDefaultEquipmentIcon(slot),
    attributes: attrs,
    mainStat: main,
    affixes: Array.isArray(item.affixes) ? item.affixes : [],
  };
};

/**
 * Normalizes the inventory and equipped items in the game state
 */
export const normalizeInventory = (backpack: Equipment[], currentEquipment: Record<string, Equipment | null>) => {
  const normalizedBackpack = backpack.map((item) => ({ ...normalizeEquipment(item), equipped: false }));
  const normalizedCurrent = Object.fromEntries(
    Object.entries(currentEquipment).map(([slot, item]) => {
      const key = slot;
      return [key, item ? { ...normalizeEquipment(item), equipped: true } : null];
    }),
  ) as Record<string, Equipment | null>;

  return {
    normalizedBackpack,
    normalizedCurrent,
  };
};