import { QUALITY_CONFIG } from '../config/game/equipment';
import { getQualityLabel } from './i18n/labels';
import { PLAYER_GROWTH, BATTLE_REWARD } from '../config/game/progression';
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
  const { item, newPity } = generateEquipment(isBoss, nextState.pityCounts, nextState.playerStats.level);
  nextState.pityCounts = newPity;
  nextState.droppedEquipment = item;

  if (autoSellQualities[item.quality]) {
    const price = QUALITY_CONFIG[item.quality].price;
    nextState.playerStats.gold += price;
    nextState.systemMessage = t('message.auto_sold_drop', {
      quality: getQualityLabel(item.quality),
      name: item.name,
      gold: price,
    });
    logs.push(nextState.systemMessage);
  } else {
    nextState.backpack = [...nextState.backpack, item];
    nextState.systemMessage = t('message.dropped_item', {
      quality: getQualityLabel(item.quality),
      name: item.name,
    });
    logs.push(nextState.systemMessage);
  }

  const xpGain = isBoss ? BATTLE_REWARD.xpPerBoss : BATTLE_REWARD.xpPerMonster;
  nextState.playerStats.xp += xpGain;
  const xpNeeded = nextState.playerStats.level * PLAYER_GROWTH.xpPerLevel;

  let levelUpMsg = '';
  if (nextState.playerStats.xp >= xpNeeded) {
    nextState.playerStats.level += 1;
    nextState.playerStats.xp -= xpNeeded;
    nextState.playerStats.attack += 5;
    nextState.playerStats.hp += 20;
    nextState.playerStats.defense += 2;
    levelUpMsg = `Level up to ${nextState.playerStats.level}!`;
  }

  nextState.battleResult = t('message.defeat_result', {
      target: isBoss ? t('label.boss') : t('label.monster'),
      xp: xpGain,
      levelUp: levelUpMsg,
    });
  logs.push(nextState.battleResult);

  return { nextState, droppedName: item.name, logs };
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
    const { item, newPity } = generateEquipment(isElite, nextState.pityCounts, nextState.playerStats.level);

    nextState.pityCounts = newPity;
    nextState.droppedEquipment = item;

    if (autoSellQualities[item.quality]) {
      const price = QUALITY_CONFIG[item.quality].price;
      nextState.playerStats.gold += price;
      soldCount += 1;
      soldGold += price;
    } else {
      nextState.backpack = [...nextState.backpack, item];
      bagCount += 1;
    }

    totalXp += isElite ? 50 : 20;
    nextState.playerStats.xp += isElite ? 50 : 20;
  }

  let levelUpCount = 0;
  while (nextState.playerStats.xp >= nextState.playerStats.level * 100) {
    const needXp = nextState.playerStats.level * 100;
    nextState.playerStats.xp -= needXp;
    nextState.playerStats.level += 1;
    nextState.playerStats.attack += 5;
    nextState.playerStats.hp += 20;
    nextState.playerStats.defense += 2;
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

  nextState.systemMessage = summary;
  nextState.battleResult = t('message.wave_result', { wave: waveSize });

  return { nextState, summary };
};
