/**
 * buildSimulationContext.ts
 *
 * UI → Engine 的唯一转换入口。
 *
 * 使用规则：
 *   ✔ UI 只能通过此函数生成 SimulationContext，不得手动构造
 *   ✔ Engine 函数不接受 SimulationDraftState，只接受 SimulationContext
 *   ✔ 所有字段映射集中在此处（Draft 字段名 → Context 语义字段名）
 */
import type { SimulationDraftState } from './simulationDraftState';
import type { SimulationContext } from './simulationContext';

/**
 * 将 UI 表单状态（SimulationDraftState）转换为 Engine 输入（SimulationContext）。
 *
 * @param draft - SetupPanel 等 UI 组件维护的表单状态
 * @returns 可直接传入 runSimulation() 的唯一输入对象
 */
export function buildSimulationContext(draft: SimulationDraftState): SimulationContext {
  return {
    // 关卡选择
    chapterId: draft.chapterId,
    nodeId: draft.nodeId,

    // 玩家配置：等级 + 可选的属性覆盖
    player: {
      level: draft.level,
      statsOverride: draft.statsOverride,
    },

    // 地图数值倍率：字段名由 Draft 的简写（hpMult）映射到 Context 的语义名（hpMultiplier）
    mapScale: {
      hpMultiplier: draft.hpMult,
      attackMultiplier: draft.attackMult,
      defenseMultiplier: draft.defenseMult,
    },

    // 基线覆盖：仅在 useBaselineOverride 为 true 时传入，否则不携带
    baselineOverride: draft.useBaselineOverride ? draft.baselineOverride : undefined,

    // 模拟迭代次数
    iterations: draft.iterations,

    // flags / mapModifiers 默认不填（保留扩展位）
  };
}
