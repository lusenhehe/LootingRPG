import { QUALITIES, QUALITY_CONFIG } from '../../../config/game/equipment';
import type { Equipment, GameState } from '../../../shared/types/game';
import { t } from 'i18next';

const getQualityLabel = (qualityKey: string): string => t(`quality.${qualityKey}`);

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

  nextState.backpack.forEach((item) => {
    const qualityIndex = QUALITIES.indexOf(item.quality);
    const inRange = qualityIndex >= lower && qualityIndex <= upper;

    if (inRange) {
      soldCount += 1;
      earnedGold += QUALITY_CONFIG[item.quality].price;
    } else {
      keep.push(item);
    }
  });

  if (soldCount === 0) {
    const message = t('message.no_items_in_range', {
      min: getQualityLabel(QUALITIES[lower]),
      max: getQualityLabel(QUALITIES[upper]),
    });
    nextState.systemMessage = message;
    return { nextState, message };
  }

  nextState.backpack = keep;
  nextState.playerStats.gold += earnedGold;
  const message = t('message.quick_sell_result', {
    min: getQualityLabel(QUALITIES[lower]),
    max: getQualityLabel(QUALITIES[upper]),
    count: soldCount,
    gold: earnedGold,
  });
  nextState.systemMessage = message;
  return { nextState, message };
};
