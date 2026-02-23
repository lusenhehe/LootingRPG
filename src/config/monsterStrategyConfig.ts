import type { MonsterTrait } from '../types/game';

/**
 * 战术标签（策略推荐方向）
 * - 偏进攻: 以输出为核心，优先形成高伤害爆发
 * - 偏防守: 以防御/抗打为核心，注重承受和稳固节奏
 * - 偏续航: 以持续作战为核心，提升回复与抗控能力
 */
export type StrategyTag = '偏进攻' | '偏防守' | '偏续航';

/**
 * 词条评分映射表
 * 用于根据怪物词条给不同策略标签加分，帮助推断最合适的应对方向。
 * 数值可调整以体现词条强度或游戏平衡需要。
 */
export const traitScoreMap: Record<MonsterTrait, Partial<Record<StrategyTag, number>>> = {
  thorns: { 偏防守: 2, 偏续航: 1 }, // 反伤：更适合防守、续航
  lifesteal: { 偏进攻: 1, 偏续航: 2 }, // 吸血：鼓励持续压力与续航
  double_attack: { 偏防守: 1, 偏进攻: 2 }, // 二连击：爆发输出与防守需要并存
  shield_on_start: { 偏进攻: 2, 偏防守: 1 }, // 开场护盾：前期攻势占优
  rage_on_low_hp: { 偏防守: 2, 偏续航: 1 }, // 残血狂怒：以防守拖时间为主
};

/**
 * 对抗目标计分表
 * 若怪物具有明确对抗目标(stat)，则直接为对应策略标签加分。
 * 当怪物 counterGoal.stat 与键匹配时，增加固定分值。
 */
export const counterGoalScoreMap: Record<string, StrategyTag> = {
  '攻击力': '偏进攻', // 压制高攻击力优先进攻
  '元素伤害': '偏进攻',
  '攻击速度': '偏进攻',
  '防御力': '偏防守',
  '生命值': '偏防守',
  '吸血': '偏续航',
  '反伤': '偏续航',
};

/**
 * 说明：
 * 以上配置都属于静态数据，可在后续版本中由策划调整。
 * 若需要可将本文件替换为服务器配置或通过 JSON 载入。
 */