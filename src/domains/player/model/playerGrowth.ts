/**
 * playerGrowth.ts
 *
 * 玩家基础属性成长公式——唯一授权定义。
 *
 * 架构原则（见 docs/simulation-order.md）：
 *   ✔ 成长公式只存在此处一处
 *   ✔ UI 不得直接写公式，必须调用此文件的函数
 *   ✔ 模拟器和战斗均共用此基础
 *
 * 使用方式：
 *   import { calcPlayerBaseStats, calcDisplayStats } from '../model/playerGrowth';
 *   const base = calcPlayerBaseStats(10);    // Engine 使用
 *   const display = calcDisplayStats(level, override); // UI 展示使用
 */
// ─── 玩家属性覆盖类型（全局唯一定义处）─────────────────────────────────────────

/**
 * 玩家属性覆盖。
 * 定义在 player 域内，避免对 simulator 域的循环依赖。
 * SimulationContext 从此处导入此类型。
 */
export interface PlayerStatsOverride {
  hp?: number;
  attack?: number;
  defense?: number;
  critRate?: number;
  lifesteal?: number;
  thorns?: number;
  elemental?: number;
  attackSpeed?: number;
}
// ─── 成长常数（修改此处即全局生效） ────────────────────────────────────────────

const GROWTH = {
  hp: { base: 300, perLevel: 20 },
  attack: { base: 50, perLevel: 5 },
  defense: { base: 5, perLevel: 2 },
  critRate: { base: 5 },
  lifesteal: { base: 0 },
  thorns: { base: 0 },
  elemental: { base: 0 },
  attackSpeed: { base: 0 },
} as const;

// ─── 公共工具 ───────────────────────────────────────────────────────────────────

/** 根据等级计算玩家基础 HP（不含 override） */
export const calcBaseHp = (level: number): number =>
  GROWTH.hp.base + (level - 1) * GROWTH.hp.perLevel;

/** 根据等级计算玩家基础攻击（不含 override） */
export const calcBaseAttack = (level: number): number =>
  GROWTH.attack.base + (level - 1) * GROWTH.attack.perLevel;

/** 根据等级计算玩家基础防御（不含 override） */
export const calcBaseDefense = (level: number): number =>
  GROWTH.defense.base + (level - 1) * GROWTH.defense.perLevel;

// ─── 核心接口 ───────────────────────────────────────────────────────────────────

/** 不含 override 的纯公式基础属性 */
export interface PlayerBaseStats {
  hp: number;
  attack: number;
  defense: number;
  critRate: number;
  lifesteal: number;
  thorns: number;
  elemental: number;
  attackSpeed: number;
}

/**
 * 根据等级计算玩家纯公式基础属性。
 * 不应用任何 override，仅包含成长公式结果。
 */
export const calcPlayerBaseStats = (level: number): PlayerBaseStats => ({
  hp: calcBaseHp(level),
  attack: calcBaseAttack(level),
  defense: calcBaseDefense(level),
  critRate: GROWTH.critRate.base,
  lifesteal: GROWTH.lifesteal.base,
  thorns: GROWTH.thorns.base,
  elemental: GROWTH.elemental.base,
  attackSpeed: GROWTH.attackSpeed.base,
});

/**
 * 将成长公式基础属性与 override 合并，产出最终属性。
 *
 * override 中的字段优先级高于公式计算值。
 * 此函数是模拟器 Engine 和 UI 展示的共同数据源。
 */
export const applyPlayerOverride = (
  base: PlayerBaseStats,
  override: PlayerStatsOverride | undefined,
): PlayerBaseStats => {
  if (!override) return base;
  return {
    hp: override.hp ?? base.hp,
    attack: override.attack ?? base.attack,
    defense: override.defense ?? base.defense,
    critRate: override.critRate ?? base.critRate,
    lifesteal: override.lifesteal ?? base.lifesteal,
    thorns: override.thorns ?? base.thorns,
    elemental: override.elemental ?? base.elemental,
    attackSpeed: override.attackSpeed ?? base.attackSpeed,
  };
};

/**
 * 一步计算最终展示/使用属性（公式 + override）。
 * 供 UI 展示和 Engine 使用，确保两者数值完全一致。
 */
export const calcDisplayStats = (
  level: number,
  statsOverride?: PlayerStatsOverride,
): PlayerBaseStats => {
  const base = calcPlayerBaseStats(level);
  return applyPlayerOverride(base, statsOverride);
};
