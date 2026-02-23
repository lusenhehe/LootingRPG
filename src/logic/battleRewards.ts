import { QUALITY_CONFIG, getQualityLabel } from '../constants/game';
import { generateEquipment } from './equipment';
import type { GameState } from '../types/game';
// initialization happens at app entry (main.tsx)
import { t } from 'i18next';

export const applySingleBattleReward = (
  state: GameState,
  isBoss: boolean,
  autoSellQualities: Record<string, boolean>,
): { nextState: GameState; droppedName: string; logs: string[] } => {
  const nextState = structuredClone(state);
  const logs: string[] = [];

  const { item, newPity } = generateEquipment(isBoss, nextState.保底计数, nextState.玩家状态.等级);
  nextState.保底计数 = newPity;
  nextState.掉落装备 = item;

  if (autoSellQualities[item.品质]) {
    const price = QUALITY_CONFIG[item.品质].price;
    nextState.玩家状态.金币 += price;
    nextState.系统消息 = t('message.auto_sold_drop', {
      quality: getQualityLabel(item.品质),
      name: item.名称,
      gold: price,
    });
    logs.push(nextState.系统消息);
  } else {
    nextState.背包 = [...nextState.背包, item];
    nextState.系统消息 = t('message.dropped_item', {
      quality: getQualityLabel(item.品质),
      name: item.名称,
    });
    logs.push(nextState.系统消息);
  }

  const xpGain = isBoss ? 50 : 20;
  nextState.玩家状态.经验 += xpGain;
  const xpNeeded = nextState.玩家状态.等级 * 100;

  let levelUpMsg = '';
  if (nextState.玩家状态.经验 >= xpNeeded) {
    nextState.玩家状态.等级 += 1;
    nextState.玩家状态.经验 -= xpNeeded;
    nextState.玩家状态.攻击力 += 5;
    nextState.玩家状态.生命值 += 20;
    nextState.玩家状态.防御力 += 2;
    levelUpMsg = ` 等级提升至 ${nextState.玩家状态.等级}！`;
  }

  nextState.战斗结果 = t('message.defeat_result', {
      target: isBoss ? t('label.boss') : t('label.monster'),
      xp: xpGain,
      levelUp: levelUpMsg,
    });
  logs.push(nextState.战斗结果);

  return { nextState, droppedName: item.名称, logs };
};

export const applyWaveBattleReward = (
  state: GameState,
  waveSize: number,
  autoSellQualities: Record<string, boolean>,
): { nextState: GameState; summary: string } => {
  const nextState = structuredClone(state);
  let soldCount = 0;
  let soldGold = 0;
  let bagCount = 0;
  let totalXp = 0;

  for (let i = 0; i < waveSize; i++) {
    const isElite = Math.random() < 0.18;
    const { item, newPity } = generateEquipment(isElite, nextState.保底计数, nextState.玩家状态.等级);

    nextState.保底计数 = newPity;
    nextState.掉落装备 = item;

    if (autoSellQualities[item.品质]) {
      const price = QUALITY_CONFIG[item.品质].price;
      nextState.玩家状态.金币 += price;
      soldCount += 1;
      soldGold += price;
    } else {
      nextState.背包 = [...nextState.背包, item];
      bagCount += 1;
    }

    totalXp += isElite ? 50 : 20;
    nextState.玩家状态.经验 += isElite ? 50 : 20;
  }

  let levelUpCount = 0;
  while (nextState.玩家状态.经验 >= nextState.玩家状态.等级 * 100) {
    const needXp = nextState.玩家状态.等级 * 100;
    nextState.玩家状态.经验 -= needXp;
    nextState.玩家状态.等级 += 1;
    nextState.玩家状态.攻击力 += 5;
    nextState.玩家状态.生命值 += 20;
    nextState.玩家状态.防御力 += 2;
    levelUpCount += 1;
  }

  const levelTip = levelUpCount > 0 ? `，升级 ${levelUpCount} 次` : '';
  const summary = t('message.wave_summary', {
      wave: waveSize,
      xp: totalXp,
      levelTip,
      bag: bagCount,
      soldCount,
      soldGold,
    });

  nextState.系统消息 = summary;
  nextState.战斗结果 = t('message.wave_result', { wave: waveSize });

  return { nextState, summary };
};
