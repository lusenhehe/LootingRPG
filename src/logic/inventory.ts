import { QUALITIES, QUALITY_CONFIG, getQualityLabel } from '../constants/game';
import type { Equipment, GameState } from '../types/game';
// i18n is initialized once in `main.tsx`; business modules should not import it for side effects
import { t } from 'i18next';

export const quickSellByQualityRange = (
  state: GameState,
  minQuality: string,
  maxQuality: string,
): { nextState: GameState; message: string } => {
  const minIndex = QUALITIES.indexOf(minQuality);
  const maxIndex = QUALITIES.indexOf(maxQuality);

  if (minIndex < 0 || maxIndex < 0) {
    return {
      nextState: state,
      message: t('message.invalid_quality_range'),
    };
  }

  const lower = Math.min(minIndex, maxIndex);
  const upper = Math.max(minIndex, maxIndex);

  const nextState = structuredClone(state);
  const keep: Equipment[] = [];
  let soldCount = 0;
  let earnedGold = 0;

  nextState.背包.forEach((item) => {
    const qualityIndex = QUALITIES.indexOf(item.品质);
    const inRange = qualityIndex >= lower && qualityIndex <= upper;

    if (inRange) {
      soldCount += 1;
      earnedGold += QUALITY_CONFIG[item.品质].price;
    } else {
      keep.push(item);
    }
  });

  if (soldCount === 0) {
    const message = t('message.no_items_in_range', {
      min: getQualityLabel(QUALITIES[lower]),
      max: getQualityLabel(QUALITIES[upper]),
    });
    nextState.系统消息 = message;
    return { nextState, message };
  }

  nextState.背包 = keep;
  nextState.玩家状态.金币 += earnedGold;
  const message = t('message.quick_sell_result', {
    min: getQualityLabel(QUALITIES[lower]),
    max: getQualityLabel(QUALITIES[upper]),
    count: soldCount,
    gold: earnedGold,
  });
  nextState.系统消息 = message;
  return { nextState, message };
};
