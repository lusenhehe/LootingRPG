import type { GameState, PlayerStats, Equipment } from '../types/game';
import { PLAYER_GROWTH } from './game/progression';
/**
 * 游戏全局配置对象
 * - INITIAL_STATE: 全部游戏状态的初始快照
 *   用于新存档创建、重置以及在计算中作为基准值。
 *   其他模块例如 "playerStats.ts" 会引用此对象获取基础数值。
 */
const basePlayerStats: PlayerStats = {
  level: 1, xp: 0, attack: PLAYER_GROWTH.baseAttack,
  hp: PLAYER_GROWTH.baseHp,
  defense: PLAYER_GROWTH.baseDefense,
  critRate: `${PLAYER_GROWTH.baseCritRate}`, // 百分数字符串形式
  damageBonus: 0, lifesteal: 0,
  thorns: 0, elemental: 0, attackSpeed: 0, gold: 0,
};

import { SLOTS } from './game/equipment';

export const INITIAL_STATE: GameState = {
  playerStats: basePlayerStats,
  battleResult: '',
  droppedEquipment: null,
  backpack: [] as Equipment[],
  systemMessage: '',
  currentEquipment: Object.fromEntries(SLOTS.map((s) => [s, null])) as Record<string, Equipment | null>,
  pityCounts: {
    legendary: 0,
    mythic: 0,
  },
};

// 后续可以在此添加其他与游戏核心有关的静态配置项，例如掉落率、经验表等。