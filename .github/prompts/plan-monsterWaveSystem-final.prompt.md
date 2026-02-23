# 多波怪物系统开发计划

## 0. 范围与非目标
本期仅扩展地图节点战斗为多波怪物模式，不改动经济系统、账号与存档架构。
受影响的核心文件:
- `src/types/game.ts`
- `src/config/mapChapters.ts`
- `src/logic/battle/battleEngine.ts`

非目标: 不新增独立副本页面、不重构装备/掉落逻辑、不删除元素系统底层，只在节点展示层移除元素图标。

---

## 1. 数据模型

### 1.1 类型修改
```ts
export interface Monster {
  id: string;
  name: string;
  icons: string[]; // 改为数组
  等级: number;
  tier: MonsterTier;
  // …其余字段保持不变
}

export interface NodeWave {
  id: string;
  label?: string;
  monsters: { monsterId: string; count?: number }[];
}

export interface MapNodeDef {
  id: string;
  name: string;
  // 兼容旧数据
  waveSize?: number;
  waves?: NodeWave[];
  // …其他字段保持
}

export interface BattleState {
  phase: BattlePhase;
  currentMonster: Monster | null;
  waveContext?: {
    currentWave: number;
    totalWaves: number;
    remainingInWave: number;
    remainingTotal: number;
  };
  // …其余字段
}
```

### 1.2 向后兼容
- 如果仅存在 `waveSize`，运行时默认生成 `waves` 数组（随机怪或同一怪重复）。
- BattleState 的 `waveContext` 为可选，新存档才填充。

---

## 2. 流程设计

### 2.1 统一状态机
```
idle → entering → fighting → (波次完成? next-wave→entering : dropping) → idle
```
- 通过 `battleEngine.ts` 的 `simulateBattle` 实现单怪战斗。
- `onEnterNode` 接受 node.waves，将所有怪物展开成队列。
- 结束一波后若还有怪，更新 `waveContext` 并再次调用 simulate。
- 全部波结束后调用 `resolveMapChallengeResult(true)`。

### 2.2 旧 wave 快捷路径移除
- `App.startMonsterWaveBattle` 旧逻辑为 `applyWaveBattleReward`，需重写。
- 新逻辑复用 `startBattleSequence` 并传递波次队列。

---

## 3. UI 设计

### 3.1 节点预览
- `MapNode.tsx` 悬停显示 `waves.length` 与每波怪物图标（可循环显示 icons 数组）。

### 3.2 战斗顶部
- `BattleArena.tsx` 新增波次横条：显示 "第 X/Y 波" 和当前波剩余怪物数。
- 可选展示下一波怪物图标列表。

### 3.3 元素图标移除
- Node 相关组件移除 `ElementIcon`；战斗中若存在元素图示统一保留在 monster.icons。

---

## 4. 存档迁移与兼容
- `SavePayload` 新增可选 `battleSession` 字段，用于中断恢复；其下包含 `waveContext` 与当前队列id。
- `useProfileSave` 在 `loadProfile` 中检查字段存在性，缺省时填默认空对象。
- 导入时忽略未知字段，导出时仅在运行中有会话时写入。
- 旧存档读取后，所有新字段均为空；节点挑战按普通路径处理。

---

## 5. 分期实施路径

### MVP
- 允许节点配置 `waves` 或 `waveSize` 回退。
- 战斗流程按波数循环 simulateBattle，更新 `waveContext` 并展示文本提示。
- MapNode 仅显示波次数与当前剩余数量。
- 无会话恢复，SavePayload 不改写。
- 指标：波节点成功率、战斗时长、金币产出无异常。
### Phase1
- 强制使用 `waves` 并停用 `waveSize`。
- MapNode 悬浮列表可查看各波怪物图标。
- 奖励逻辑移入单怪战斗函数，统一掉落计算。
### Phase2
- 添加波次进度条、下一波预览图标。
- 支持战斗日志波次边界。
- 支持玩家中断保存失败/继续（不恢复）。
### Phase3
- 实现 `battleSession` 存档恢复。
- 兼容导入/版本升级，加入一致性校验。
- 回收 `waveSize` 字段完全，移除旧行为。
指标：失败率、产出、时长对比、存档恢复成功率。
---
## 6. 测试与 DoD
### 单元
- mapConfig 波数解析。
- battleState waveContext 推进。
- reward 计算。
- 存档迁移函数行为。

### 集成
- 地图→战斗全链路一次通过多波。
- 失败/重载/退出测试。

### 手工
- 检查所有 wave 节点显示信息。
- 导入旧存档后操作无异常。

DoD: 所有 wave 节点能战斗；旧存档可用；无 TS 错误；相关 UI 可见；回滚策略可切换。

---

## 7. 验证与回滚策略
- 风险：经济通胀、逻辑分叉、兼容失败
- 回滚：开关控制、新/旧并写、灰度发布
- 监控：战斗成功率、平均奖励

---

## 8. 决策记录
1. 并行兼容 waveSize
2. 本期不破坏元素底层，仅移除展示
3. 先统一战斗路径后优化 UI

---

以上为完成开发的最终计划文档，可作为实施或 AI 提示使用。
