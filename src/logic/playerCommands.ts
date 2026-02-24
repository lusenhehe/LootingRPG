import { QUALITY_CONFIG, STAT_POOL } from '../config/game/equipment';
import { applyEnchant } from './equipment';
import i18n from '../i18n';
import type { Equipment, GameState } from '../types/game';

export const applyPlayerCommand = (
  state: GameState,
  command: string,
): { nextState: GameState; logs: string[] } => {
  const nextState = structuredClone(state);
  const logs: string[] = [];

  const logSystemMessage = (message: string) => {
    nextState.systemMessage = message;
    logs.push(message);
  };

  const [action, target] = command.split(' ');

  if (action === '装备') {
    const item = nextState.backpack.find((i) => i.name === target || i.id === target);
    if (item) {
      const slotKey = item.slot;
      const oldItem = nextState.currentEquipment[slotKey];
      item.equipped = true;
      nextState.currentEquipment[slotKey] = item;
      nextState.backpack = nextState.backpack.filter((i) => i.id !== item.id && !i.equipped);
      if (oldItem) {
        oldItem.equipped = false;
        nextState.backpack = [...nextState.backpack, oldItem];
      }
      logSystemMessage(i18n.t('message.equipped', { name: item.name }));
    }
  } else if (action === '卸下槽位') {
    const slotKey = target;
    const item = nextState.currentEquipment[slotKey];
    if (item) {
      item.equipped = false;
      nextState.currentEquipment[slotKey] = null;
      nextState.backpack = [...nextState.backpack.filter((i) => i.id !== item.id), item];
      logSystemMessage(i18n.t('message.unequipped', { name: item.name }));
    }
  } else if (action === '卸下') {
    const slot = Object.keys(nextState.currentEquipment).find((s) => nextState.currentEquipment[s]?.name === target);
    if (slot) {
      const item = nextState.currentEquipment[slot];
      if (item) {
        item.equipped = false;
        nextState.currentEquipment[slot] = null;
        nextState.backpack = [...nextState.backpack, item];
        logSystemMessage(i18n.t('message.unequipped', { name: item.name }));
      }
    }
  } else if (action === '出售') {
    const itemIndex = nextState.backpack.findIndex((i) => i.name === target || i.id === target);
    if (itemIndex > -1) {
      const item = nextState.backpack[itemIndex];
      const price = QUALITY_CONFIG[item.quality]?.price ?? 0;
      nextState.playerStats.gold += price;
      nextState.backpack.splice(itemIndex, 1);
      logSystemMessage(i18n.t('message.sold_item', { name: item.name, price }));
    }
  } else if (action === '强化') {
    const item =
      nextState.backpack.find((i) => i.id === target) ||
      (Object.values(nextState.currentEquipment) as (Equipment | null)[]).find((i) => i?.id === target);

    if (item) {
      // Max enchant cap
      if ((item.enhancementLevel || 0) >= 20) {
        logs.push(i18n.t('message.enchant_maxed'));
        return { nextState, logs };
      }

      const cost = (item.enhancementLevel + 1) * 500;
      if (nextState.playerStats.gold >= cost) {
        nextState.playerStats.gold -= cost;
        let success = false;
        const lv = item.enhancementLevel || 0;

        // Probability tiers with minimum floor at 10%
        if (lv < 5) success = true;
        else if (lv < 10) success = Math.random() < 0.6;
        else if (lv < 15) success = Math.random() < 0.3;
        else if (lv < 20) success = Math.random() < 0.1; // 10% floor for high levels

        if (success) {
          applyEnchant(item);
          logSystemMessage(i18n.t('message.enchant_success', { name: item.name, level: item.enhancementLevel }));
        } else {
          logSystemMessage(i18n.t('message.enchant_fail'));
        }
      } else {
        logs.push(i18n.t('message.not_enough_gold_enchant'));
      }
    }
  }

  return { nextState, logs };
};
