/**
 * simulationDraftState.ts
 *
 * UI 表单层状态类型。
 *
 * SimulationDraftState 是 SetupPanel 等 UI 组件持有的表单状态。
 * 它不能直接传入 Engine，必须通过 buildSimulationContext() 转换为 SimulationContext。
 *
 * 架构原则：
 *   Draft  = 用户操作的原始输入（字段名贴近 UI 控件）
 *   Context = Engine 的最终输入（字段名贴近领域语义）
 */
import type { BaselineOverride } from './types';
import type { PlayerStatsOverride } from '../../player/model/playerGrowth';

/**
 * SimulationDraftState —— UI 表单状态。
 *
 * 对应 SetupPanel 中的所有表单控件。
 * 可持久化至 localStorage，不可直接传入 Engine。
 */
export interface SimulationDraftState {
  // ── 选关 ─────────────────────────────────────────────────────────────────────
  chapterId: string;
  nodeId: string;

  // ── 玩家配置 ─────────────────────────────────────────────────────────────────
  /** 玩家等级 */
  level: number;
  /**
   * 属性覆盖。
   * 若 useManual 为 false 且预设没有 statsOverride，则此字段为 undefined，
   * Engine 将使用 playerGrowth 公式计算基础属性。
   */
  statsOverride?: PlayerStatsOverride;

  // ── 地图倍率（UI 字段名，对应 MapScaleConfig.hpMult 等） ─────────────────────
  hpMult: number;
  attackMult: number;
  defenseMult: number;

  // ── 基线覆盖 ─────────────────────────────────────────────────────────────────
  useBaselineOverride: boolean;
  /** 仅在 useBaselineOverride 为 true 时有效 */
  baselineOverride?: BaselineOverride;

  // ── 模拟参数 ─────────────────────────────────────────────────────────────────
  iterations: number;
}

/**
 * 默认草稿状态，可用于初始化 useState。
 */
export const DEFAULT_DRAFT_STATE: SimulationDraftState = {
  chapterId: '',
  nodeId: '',
  level: 10,
  statsOverride: undefined,
  hpMult: 1.0,
  attackMult: 1.0,
  defenseMult: 1.0,
  useBaselineOverride: false,
  baselineOverride: undefined,
  iterations: 100,
};
