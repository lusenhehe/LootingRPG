// constants and helper functions related to battles

// animation timing (milliseconds)
export const FRAME_START_DELAY = 760;
export const FRAME_STEP = 260;

// some parts of code (e.g. useBattleFlow) use shorter timing for in-battle
// frame progression; we expose separate constants for clarity.
export const FLOW_FRAME_START_DELAY = 120;
export const FLOW_FRAME_STEP = 120;

// bonus turn calculation thresholds based on player attack speed
export const BONUS_TURN_THRESHOLDS = {
  two: 40,
  one: 20,
} as const;

/**
 * Returns the number of bonus turns a player receives based on their
 * attack speed.  The values are kept in a config so they can be tweaked
 * without digging through logic files.
 */
export function calculateBonusTurns(attackSpeed: number): number {
  if (attackSpeed >= BONUS_TURN_THRESHOLDS.two) return 2;
  if (attackSpeed >= BONUS_TURN_THRESHOLDS.one) return 1;
  return 0;
}
