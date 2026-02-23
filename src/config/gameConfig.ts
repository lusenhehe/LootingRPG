import type { GameState, PlayerStats, Equipment } from '../types/game';
import { PLAYER_GROWTH } from '../constants/settings';

/**
 * 游戏全局配置对象
 * - INITIAL_STATE: 全部游戏状态的初始快照
 *   用于新存档创建、重置以及在计算中作为基准值。
 *   其他模块例如 "playerStats.ts" 会引用此对象获取基础数值。
 */

const basePlayerStats: PlayerStats = {
  等级: 1,
  经验: 0,
  攻击力: PLAYER_GROWTH.baseAttack,
  生命值: PLAYER_GROWTH.baseHp,
  防御力: PLAYER_GROWTH.baseDefense,
  暴击率: `${PLAYER_GROWTH.baseCritRate}`, // 百分数字符串形式
  伤害加成: 0,
  吸血: 0,
  反伤: 0,
  元素伤害: 0,
  攻击速度: 0,
  金币: 0,
};

export const INITIAL_STATE: GameState = {
  玩家状态: basePlayerStats,
  战斗结果: '',
  掉落装备: null,
  背包: [],
  系统消息: '',
  当前装备: {},
  保底计数: {
    传说: 0,
    神话: 0,
  },
};

// 后续可以在此添加其他与游戏核心有关的静态配置项，例如掉落率、经验表等。