import { QUALITY_CONFIG } from '../config/game/equipment';
import type { Equipment, GameState } from '../types/game';    
import { attemptEnhancement } from './enhancement.ts';
import i18n from '../i18n';
export const applyPlayerCommand = (state: GameState,command: string):
 { nextState: GameState; logs: string[] } => {
  const nextState = structuredClone(state);
  const logs: string[] = [];
  const logSystemMessage = (message: string) => { nextState.systemMessage = message; logs.push(message)};
  const [action, target] = command.split(' ');
  if (action === '装备') equipItem();
  else if (action === '卸下槽位')  unequipItem();
  else if (action === '卸下')  unequipItemFromSlot();
  else if (action === '出售')  sellItem();
  else if (action === '强化')  logs.push(...attemptEnhancement(nextState, target));
  return { nextState, logs };
  function sellItem() {
    const itemIndex = nextState.backpack.findIndex((i) => i.name === target || i.id === target);
    if (itemIndex > -1) {
      const item = nextState.backpack[itemIndex];
      const price = QUALITY_CONFIG[item.quality]?.price ?? 0;
      nextState.playerStats.gold += price;
      nextState.backpack.splice(itemIndex, 1);
      logSystemMessage(i18n.t('message.sold_item', { name: item.name, price }));
    }
  }
  function unequipItemFromSlot() {
    const slot : Equipment['slot'] = Object.keys(nextState.currentEquipment).find((s) => nextState.currentEquipment[s]?.name === target) as Equipment['slot'] ;
    const item : Equipment = nextState.currentEquipment[slot] as Equipment;
    item.equipped = false;
    nextState.currentEquipment[slot] = null;
    nextState.backpack = [...nextState.backpack, item];
    logSystemMessage(i18n.t('message.unequipped', { name: item.name }));
  }
  function unequipItem() {
    const slotKey = target;
    const item = nextState.currentEquipment[slotKey] as Equipment;
    item.equipped = false;
    nextState.currentEquipment[slotKey] = null;
    nextState.backpack = [...nextState.backpack.filter((i) => i.id !== item.id), item];
    logSystemMessage(i18n.t('message.unequipped', { name: item.name }));
  }
  function equipItem() {
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
  }
};
