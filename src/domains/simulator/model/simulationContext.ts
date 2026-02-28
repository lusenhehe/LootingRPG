/**
 * simulationContext.ts
 *
 * 模拟器的唯一输入结构。
 * 所有 override、倍率、标记均在此集中定义。
 *
 * 架构原则：
 *   - UI 只操作 SimulationDraftState（表单层）
 *   - Engine 只接受 SimulationContext（输入层）
 *   - 两者通过 buildSimulationContext() 连接
 *
 * 覆盖优先级（见 docs/simulation-order.md）：
 *   1. Monster Base Stats
 *   2. Baseline Growth（baselineOverride）
 *   3. Map Scale（mapScale）
 *   4. Global Flags
 */
import type { BaselineOverride } from './types';
import type { PlayerStatsOverride } from '../../player/model/playerGrowth';
export interface SimulationPlayerConfig {
  level: number;
  /** 若提供，则该字段中的各属性优先于公式计算值 */
  statsOverride?: PlayerStatsOverride;
  /**
   * 扩展位（Phase 7 预留）：
   * equipment?: EquipmentConfig;
   */
}

// ─── 地图倍率 ──────────────────────────────────────────────────────────────────

export interface SimulationMapScale {
  hpMultiplier: number;
  attackMultiplier: number;
  defenseMultiplier: number;
}

// ─── 全局标记 ──────────────────────────────────────────────────────────────────

/**
 * 扩展标记（Phase 7 预留）
 * 所有可能影响模拟行为但不属于数值的开关应放在此处，而非散落于上层。
 */
export interface SimulationFlags {
  /** 忽略元素克制关系 */
  ignoreElement?: boolean;
  /** 固定随机种子（0 = 随机） */
  deterministicSeed?: number;
  /**
   * 扩展位（Phase 7 预留）：
   * aggressiveAI?: boolean;
   */
}

// ─── 地图修饰符（Phase 7 预留） ────────────────────────────────────────────────

/**
 * 目前为空，预留给元素抗性等地图级修饰。
 * elementalResist?: number;
 */
export interface SimulationMapModifiers {
  // reserved
}

// ─── 核心输入结构 ──────────────────────────────────────────────────────────────

/**
 * SimulationContext — 模拟器的唯一输入。
 *
 * 规则：
 *   ✔ Engine 只接受此类型，不接受任何裸对象或散参数
 *   ✔ 所有 override 集中于此
 *   ✔ UI 不得直接构造此类型，必须通过 buildSimulationContext() 生成
 */
export interface SimulationContext {
  // ── 基础选择 ────────────────────────────────────────────────────────────────
  chapterId: string;
  nodeId: string;

  // ── 玩家配置 ────────────────────────────────────────────────────────────────
  player: SimulationPlayerConfig;

  // ── 地图数值倍率 ─────────────────────────────────────────────────────────────
  mapScale: SimulationMapScale;

  // ── 怪物成长覆盖（可选） ──────────────────────────────────────────────────────
  /** 若存在，按此基线重新计算怪物成长曲线，替代配置文件中的默认基线 */
  baselineOverride?: BaselineOverride;

  // ── 模拟参数 ────────────────────────────────────────────────────────────────
  iterations: number;

  // ── 全局标记（扩展位） ────────────────────────────────────────────────────────
  flags?: SimulationFlags;

  // ── 地图修饰符（扩展位） ─────────────────────────────────────────────────────
  mapModifiers?: SimulationMapModifiers;
}
