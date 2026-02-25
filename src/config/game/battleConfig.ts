export const FRAME_START_DELAY = 760;
export const FRAME_STEP = 260;

// 战斗相关的常量和辅助函数
export const BONUS_TURN_THRESHOLDS = {
  two: 40,
  one: 20,
} as const;

/**
 * 根据玩家的攻击速度计算额外攻击回合数
 */
export function calculateBonusTurns(attackSpeed: number): number {
  if (attackSpeed >= BONUS_TURN_THRESHOLDS.two) return 2;
  if (attackSpeed >= BONUS_TURN_THRESHOLDS.one) return 1;
  return 0;
}
