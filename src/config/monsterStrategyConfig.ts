import type { MonsterTrait } from '../types/game';

/**
 * 战术标签（策略推荐方向）
 * - 偏进攻: 以输出为核心，优先形成高伤害爆发
 * - 偏防守: 以防御/抗打为核心，注重承受和稳固节奏
 * - 偏续航: 以持续作战为核心，提升回复与抗控能力
 */
export type StrategyTag = 'offense' | 'defense' | 'sustain';

/**
 * 词条评分映射表
 * 用于根据怪物词条给不同策略标签加分，帮助推断最合适的应对方向。
 * 数值可调整以体现词条强度或游戏平衡需要。
 */
export const traitScoreMap: Record<MonsterTrait, Partial<Record<StrategyTag, number>>> = {
  thorns: { defense: 2, sustain: 1 }, // thorns: prefer defense and sustain
  lifesteal: { offense: 1, sustain: 2 }, // lifesteal: pressure + sustain
  double_attack: { defense: 1, offense: 2 }, // burst pressure requires offense and mitigation
  shield_on_start: { offense: 2, defense: 1 }, // opening shield favors early pressure
  rage_on_low_hp: { defense: 2, sustain: 1 }, // enrage on low hp favors defensive pacing
};

/**
 * 对抗目标计分表
 * 若怪物具有明确对抗目标(stat)，则直接为对应策略标签加分。
 * 当怪物 counterGoal.stat 与键匹配时，增加固定分值。
 */
export const counterGoalScoreMap: Record<string, StrategyTag> = {
  attack: 'offense',
  elemental: 'offense',
  attackSpeed: 'offense',
  defense: 'defense',
  hp: 'defense',
  lifesteal: 'sustain',
  thorns: 'sustain',
};

/**
 * 说明：
 * 以上配置都属于静态数据，可在后续版本中由策划调整。
 * 若需要可将本文件替换为服务器配置或通过 JSON 载入。
 */