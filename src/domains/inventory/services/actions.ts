import type { Equipment, GameState } from '../../../types/game';
import { QUALITY_CONFIG, LOCK_COST, REROLL_BASE_COST } from '../../../config/game/equipment';
import { attemptEnhancement } from './enhancement';
import { rerollAffixes } from './equipment';
import i18n from '../../../i18n';

export type InventoryAction =
  | { type: 'equip'; itemId: string }
  | { type: 'sell'; itemId: string }
  | { type: 'enchant'; itemId: string }
  | { type: 'unequip_slot'; slot: string }
  | { type: 'reroll'; itemId: string; lockTypes?: string[] };

export interface InventoryActionResult {
  nextState: GameState;
  logs: string[];
}

const findItemById = (state: GameState, itemId: string): Equipment | undefined => {
  return (
    state.backpack.find((item) => item.id === itemId) ??
    (Object.values(state.currentEquipment) as Array<Equipment | null>).find((item) => item?.id === itemId) ??
    undefined
  );
};

export const applyInventoryAction = (state: GameState, action: InventoryAction): InventoryActionResult => {
  const nextState = structuredClone(state);
  const logs: string[] = [];

  const logSystemMessage = (message: string) => {
    nextState.systemMessage = message;
    logs.push(message);
  };

  if (action.type === 'equip') {
    const item = nextState.backpack.find((entry) => entry.id === action.itemId);
    if (!item) return { nextState, logs };

    const slotKey = item.slot;
    const oldItem = nextState.currentEquipment[slotKey];

    item.equipped = true;
    nextState.currentEquipment[slotKey] = item;
    nextState.backpack = nextState.backpack.filter((entry) => entry.id !== item.id && !entry.equipped);

    if (oldItem) {
      oldItem.equipped = false;
      nextState.backpack = [...nextState.backpack, oldItem];
    }

    logSystemMessage(i18n.t('message.equipped', { name: item.name }));
    return { nextState, logs };
  }

  if (action.type === 'unequip_slot') {
    const item = nextState.currentEquipment[action.slot];
    if (!item) return { nextState, logs };

    item.equipped = false;
    nextState.currentEquipment[action.slot] = null;
    nextState.backpack = [...nextState.backpack.filter((entry) => entry.id !== item.id), item];

    logSystemMessage(i18n.t('message.unequipped', { name: item.name }));
    return { nextState, logs };
  }

  if (action.type === 'sell') {
    const itemIndex = nextState.backpack.findIndex((entry) => entry.id === action.itemId);
    if (itemIndex < 0) return { nextState, logs };

    const item = nextState.backpack[itemIndex];
    const price = QUALITY_CONFIG[item.quality]?.price ?? 0;
    nextState.playerStats.gold += price;
    nextState.backpack.splice(itemIndex, 1);

    logSystemMessage(i18n.t('message.sold_item', { name: item.name, price }));
    return { nextState, logs };
  }

  if (action.type === 'enchant') {
    logs.push(...attemptEnhancement(nextState, action.itemId));
    return { nextState, logs };
  }

  if (action.type === 'reroll') {
    const item = findItemById(nextState, action.itemId);
    if (!item) return { nextState, logs };

    const lockTypes = action.lockTypes ?? [];
    const cost = REROLL_BASE_COST * ((item.enhancementLevel || 0) + 1) + lockTypes.length * LOCK_COST;

    if (nextState.playerStats.gold < cost) {
      logs.push(i18n.t('message.not_enough_gold_reroll'));
      return { nextState, logs };
    }

    nextState.playerStats.gold -= cost;
    const previous = item.affixes.length;
    rerollAffixes(item, { lockTypes });
    const rerolledCount = Math.max(0, previous - lockTypes.length);

    logSystemMessage(
      i18n.t('message.reroll_complete', {
        name: item.name,
        count: rerolledCount,
      }),
    );

    return { nextState, logs };
  }

  return { nextState, logs };
};
