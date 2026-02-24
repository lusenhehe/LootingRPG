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
    localeNames: item.localeNames || undefined,
  };
};

/**
 * Normalizes the inventory and equipped items in the game state
 */
import { SLOTS } from '../../config/game/equipment';

export const normalizeInventory = (backpack: Equipment[], currentEquipment: Record<string, Equipment | null>) => {
  const normalizedBackpack = backpack.map((item) => ({ ...normalizeEquipment(item), equipped: false }));

  // ensure every configured slot exists in the normalized output
  const normalizedCurrent = Object.fromEntries(
    SLOTS.map((slot) => {
      const item = currentEquipment[slot] || null;
      return [slot, item ? { ...normalizeEquipment(item), equipped: true } : null];
    }),
  ) as Record<string, Equipment | null>;

  return {
    normalizedBackpack,
    normalizedCurrent,
  };
};