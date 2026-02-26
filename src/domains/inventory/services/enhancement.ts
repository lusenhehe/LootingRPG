import { calculateEnchantCost, applyEnchant } from './equipment';
import i18n from '../../../i18n';
import type { Equipment, GameState } from '../../../shared/types/game';

/**
 * 强化函数: 尝试强化指定的装备，返回日志信息
 */
export function attemptEnhancement(state: GameState, target: string): string[] {
  const logs: string[] = [];
  const logSystemMessage = (message: string) => {
    state.systemMessage = message;
    logs.push(message);
  };

  const item =
    state.backpack.find((i) => i.id === target) ||
    (Object.values(state.currentEquipment) as (Equipment | null)[]).find((i) => i?.id === target);

  if (item) {
    if ((item.enhancementLevel || 0) >= 20) {
      logs.push(i18n.t('message.enchant_maxed'));
      return logs;
    }

    const cost = calculateEnchantCost(item);
    if (state.playerStats.gold >= cost) {
      state.playerStats.gold -= cost;
      const lv = item.enhancementLevel || 0;
      const success = calculateEnhancementSuccess(lv);
      if (success) {
        applyEnchant(item);
        logSystemMessage(
          i18n.t('message.enchant_success', {
            name: item.name,
            level: item.enhancementLevel,
          }),
        );
      } else {
        logSystemMessage(i18n.t('message.enchant_fail'));
      }
    } else {
      logs.push(i18n.t('message.not_enough_gold_enchant'));
    }
  }

  return logs;
}

export function calculateEnhancementSuccess(lv: number): boolean {
  if (lv < 5) return true;
  if (lv < 10) return Math.random() < 0.6;
  if (lv < 15) return Math.random() < 0.3;
  if (lv < 20) return Math.random() < 0.1;
  return false;
}
