import { QUALITY_CONFIG, STAT_POOL } from '../config/game/equipment';
import type { Equipment, GameState } from '../types/game';

export const applyPlayerCommand = (
  state: GameState,
  command: string,
): { nextState: GameState; logs: string[] } => {
  const nextState = structuredClone(state);
  const logs: string[] = [];

  const logSystemMessage = (message: string) => {
    nextState.系统消息 = message;
    logs.push(message);
  };

  const [action, target] = command.split(' ');

  if (action === '装备') {
    const item = nextState.背包.find((i) => i.名称 === target || i.id === target);
    if (item) {
      const slotKey = item.部位;
      const oldItem = nextState.当前装备[slotKey];
      item.已装备 = true;
      nextState.当前装备[slotKey] = item;
      nextState.背包 = nextState.背包.filter((i) => i.id !== item.id && !i.已装备);
      if (oldItem) {
        oldItem.已装备 = false;
        nextState.背包 = [...nextState.背包, oldItem];
      }
      logSystemMessage(`已装备 ${item.名称}`);
    }
  } else if (action === '卸下槽位') {
    const slotKey = target;
    const item = nextState.当前装备[slotKey];
    if (item) {
      item.已装备 = false;
      nextState.当前装备[slotKey] = null;
      nextState.背包 = [...nextState.背包.filter((i) => i.id !== item.id), item];
      logSystemMessage(`已卸下 ${item.名称}`);
    }
  } else if (action === '卸下') {
    const slot = Object.keys(nextState.当前装备).find((s) => nextState.当前装备[s]?.名称 === target);
    if (slot) {
      const item = nextState.当前装备[slot];
      if (item) {
        item.已装备 = false;
        nextState.当前装备[slot] = null;
        nextState.背包 = [...nextState.背包, item];
        logSystemMessage(`已卸下 ${item.名称}`);
      }
    }
  } else if (action === '出售') {
    const itemIndex = nextState.背包.findIndex((i) => i.名称 === target || i.id === target);
    if (itemIndex > -1) {
      const item = nextState.背包[itemIndex];
      const price = QUALITY_CONFIG[item.品质]?.price ?? 0;
      nextState.玩家状态.金币 += price;
      nextState.背包.splice(itemIndex, 1);
      logSystemMessage(`出售了 ${item.名称}，获得金币 ${price}`);
    }
  } else if (action === '强化') {
    const item =
      nextState.背包.find((i) => i.id === target) ||
      (Object.values(nextState.当前装备) as (Equipment | null)[]).find((i) => i?.id === target);

    if (item) {
      const cost = (item.强化等级 + 1) * 500;
      if (nextState.玩家状态.金币 >= cost) {
        nextState.玩家状态.金币 -= cost;
        let success = false;
        const lv = item.强化等级;
        if (lv < 5) success = true;
        else if (lv < 10) success = Math.random() < 0.6;
        else if (lv < 15) success = Math.random() < 0.3;

        if (success) {
          item.强化等级 += 1;
          item.属性[item.主属性] = Math.floor(item.属性[item.主属性] * 1.05);
          logSystemMessage(`强化成功！${item.名称} 变为 +${item.强化等级}`);
        } else {
          logSystemMessage('强化失败... 金币已消耗。');
        }
      } else {
        logs.push('金币不足，无法强化。');
      }
    }
  } else if (action === '洗练') {
    const item =
      nextState.背包.find((i) => i.id === target) ||
      (Object.values(nextState.当前装备) as (Equipment | null)[]).find((i) => i?.id === target);

    if (item) {
      const rerollCost = (item.强化等级 + 1) * 300;
      const secondaryStats = Object.keys(item.属性).filter((key) => key !== item.主属性);

      if (secondaryStats.length === 0) {
        logs.push('该装备无可洗练副词条。');
        return { nextState, logs };
      }

      if (nextState.玩家状态.金币 < rerollCost) {
        logs.push('金币不足，无法洗练。');
        return { nextState, logs };
      }

      nextState.玩家状态.金币 -= rerollCost;

      secondaryStats.forEach((key) => {
        delete item.属性[key];
      });

      const availableStats = STAT_POOL.filter((stat) => stat !== item.主属性);
      const mainValue = item.属性[item.主属性] ?? 1;

      for (let i = 0; i < secondaryStats.length; i++) {
        const statName = availableStats[Math.floor(Math.random() * availableStats.length)];
        const value = Math.max(1, Math.floor(mainValue * (0.45 + Math.random() * 0.3)));
        item.属性[statName] = value;
      }

      logSystemMessage(`洗练完成：${item.名称} 已重置 ${secondaryStats.length} 条副词条`);
    }
  }

  return { nextState, logs };
};
