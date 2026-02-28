# 模拟器架构与覆盖优先级规则

> 本文档是模拟器系统的权威参考。任何修改成长逻辑的 PR 必须先阅读此文档。

## 总体数据流

```
UI (SetupPanel / PlayerPanel / MapScalePanel / ...)
   ↓ 维护表单状态
SimulationDraftState          ← 只负责 UI 表单
   ↓ buildSimulationContext()
SimulationContext              ← 唯一模拟输入
   ↓ runSimulation(context)
SimulationEngine（runSimulation.ts）
   ↓ buildPlayerUnit / buildEnemyUnit
BattleEngine（无感 override）
```

## 关键规则

| 规则 | 正确 | 禁止 |
|------|------|------|
| 成长公式 | 只在 `playerGrowth.ts` 一处定义 | UI 中硬写 `300 + (lv-1)*20` |
| Engine 输入 | 只接受 `SimulationContext` | 接受 `SimulatorConfig`、裸对象、散参数 |
| 配置构建 | 只通过 `buildSimulationContext(draft)` | UI 手动 `Object.assign`、`as any` |
| UI 展示数值 | 调用 `calcDisplayStats(level, override)` | UI 内联计算属性值 |
| Override 传递 | Engine 中显式参数传递 | `Object.assign({}, scale, { baseline })` 偷塞 |

## 覆盖优先级（怪物数值）

每次模拟中，怪物的最终数值按以下顺序叠加计算，**后者覆盖/乘算前者**：

### 1. Monster Base Stats（最低优先级）
- 来源：`getMonsterById(id)` → 怪物配置文件
- 包含：怪物的基础类型（Boss/Regular）属性

### 2. Baseline Growth（成长函数）
- 来源：`getMapMonsterBaselineByLevel(recommendedLevel)`
- 通过 `getFinalMonsterStats()` 将怪物按推荐等级缩放

### 3. baselineOverride（可选覆盖）
- 来源：`SimulationContext.baselineOverride`
- 若存在，按原始基线与目标基线的比率重新缩放三维（HP / 攻击 / 防御）
- 公式：`finalStat = baseStat × (desiredBaseline / origBaseline)`
- 用途：测试不同成长曲线对胜率的影响，不修改数据文件

### 4. Map Scale（最高优先级，最终乘算）
- 来源：`SimulationContext.mapScale.{hp|attack|defense}Multiplier`
- 对已经过 baseline 处理的数值进行最终倍乘
- 1.0 = 原始值

```
finalHp = baselineHp × (baselineOverrideRatio ?? 1) × mapScale.hpMultiplier
```

### 5. Global Flags（行为开关，不影响数值）
- 来源：`SimulationContext.flags`
- 目前预留，不参与数值计算

## 玩家属性优先级

```
calcPlayerBaseStats(level)        ← 公式基线（playerGrowth.ts）
     ↓ applyPlayerOverride(base, statsOverride)
最终属性                           ← statsOverride 字段覆盖对应维度
```

- `statsOverride` 中设置的字段**完全替换**公式值（不是叠加）
- 未设置的字段**使用公式值**
- 公式只在 `src/domains/player/model/playerGrowth.ts` 中定义

## 文件职责对照

| 文件 | 职责 |
|------|------|
| `domains/player/model/playerGrowth.ts` | **唯一**的玩家成长公式定义 |
| `domains/simulator/model/simulationContext.ts` | Engine 输入类型（带所有 override） |
| `domains/simulator/model/simulationDraftState.ts` | UI 表单状态类型 |
| `domains/simulator/model/buildSimulationContext.ts` | UI → Engine 的唯一转换函数 |
| `domains/simulator/services/runSimulation.ts` | Engine 核心（构建单元 + 调用 BattleEngine） |
| `tools/BattleSimulator/components/SetupPanel.tsx` | 只维护 Draft 状态，启动时调用 buildSimulationContext |

## 扩展指南（Phase 7 预留）

### 添加装备模拟
```typescript
// SimulationContext.player 中扩展
player: {
  level: number;
  statsOverride?: PlayerStatsOverride;
  equipment?: EquipmentConfig;  // ← 在此添加
}
```

### 添加元素抗性
```typescript
// SimulationContext.mapModifiers 中扩展
mapModifiers?: {
  elementalResist?: number;  // ← 在此添加
}
```

### 添加 AI 行为开关
```typescript
// SimulationContext.flags 中扩展
flags?: {
  ignoreElement?: boolean;
  deterministicSeed?: number;
  aggressiveAI?: boolean;  // ← 在此添加
}
```

> **原则**：任何新的模拟器参数必须加在 `SimulationContext` 上，不得散落在 Engine 内部或 UI 层。
