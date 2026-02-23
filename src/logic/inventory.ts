import { QUALITIES, QUALITY_CONFIG } from '../constants/game';
import type { Equipment, GameState } from '../types/game';

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
      message: '一键售卖失败：品质范围无效。',
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
    const message = `所选范围（${QUALITIES[lower]}-${QUALITIES[upper]}）没有可售卖装备。`;
    nextState.系统消息 = message;
    return { nextState, message };
  }

  nextState.背包 = keep;
  nextState.玩家状态.金币 += earnedGold;
  const message = `一键售卖完成：${QUALITIES[lower]}-${QUALITIES[upper]}，共出售 ${soldCount} 件，获得 ${earnedGold} 金币。`;
  nextState.系统消息 = message;
  return { nextState, message };
};
