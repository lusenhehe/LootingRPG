# 地图系统开发文档（MVP v1）

## 1. 目标

构建一条“由易到难”的主线地图，让玩家从 0 开始有明确的成长路径：

- 新手林地（教学）
- 废弃地牢（机制理解）
- 熔岩深渊（构筑考验）

MVP 目标是“可玩可存档可推进”，先不做复杂分支和赛季化。

---

## 2. 设计原则

1. **每章只引入 1-2 个新决策**：避免信息过载。
2. **失败可解释**：玩家能看懂为何失败、如何提升。
3. **首次通关有明确奖励**：强化章节完成感。
4. **循环可刷**：最终节点可重复挑战，保留长期目标。

---

## 3. 数据结构

### 3.1 类型定义

文件：`src/types/map.ts`

- `MapNode`：节点配置（遭遇类型、区域、风险、推荐等级、奖励）
- `MapChapter`：章节定义（节点集合）
- `MapProgressState`：玩家地图进度（当前节点、解锁、通关、失败次数）

### 3.2 配置文件

文件：`src/config/mapProgression.ts`

- `MAP_CHAPTERS`：3章
- `MAP_NODES`：9节点（n1-n9）

---

## 4. 流程逻辑

文件：`src/logic/mapProgress.ts`

核心函数：

- `createInitialMapProgress()`：初始化进度（n1）
- `normalizeMapProgress()`：兼容旧存档
- `registerMapNodeVictory()`：胜利后推进与解锁
- `registerMapNodeFailure()`：记录失败次数

MVP 规则：

- 通关当前节点后解锁 `nextNodeIds`
- 首通发放 `firstClearRewardGold`
- 自动推进 `currentNodeId` 到下一节点
- 最终节点（n9）可循环挑战

---

## 5. 与现有战斗系统接入

接入点：`src/App.tsx`

1. 新增 `mapProgress` 状态并持久化到存档。
2. 新增 `startCurrentMapNodeBattle()`：读取当前节点配置并发起战斗。
3. 战斗胜利时：
   - 调用 `registerMapNodeVictory`
   - 首通奖励金币
   - 写入系统日志
4. 战斗失败时：
   - 调用 `registerMapNodeFailure`

---

## 6. UI 接入（MVP）

接入点：`BattleArena`

- 展示当前章节/节点信息、推荐等级、首通奖励
- 增加“挑战当前节点”按钮（按节点类型自动选普通/Boss/怪群）
- 保留原有自由挑战按钮，方便调试与过渡

---

## 7. 存档兼容策略

- `SavePayload` 新增可选字段 `mapProgress`。
- 旧存档没有该字段时，自动回退到 `createInitialMapProgress()`。
- 通过 `normalizeMapProgress()` 校验无效节点 ID，避免损坏存档导致白屏。

---

## 8. 后续迭代路线

1. 地图节点分支路线（A/B 路）。
2. 节点词缀系统（护盾强化、DoT 强化等）。
3. 章节评价（星级）与额外章节奖励。
4. 地图专属掉落池（按章节投放）。
5. 周目标地图（提高回流）。

---

## 9. 验收标准（MVP）

- 新账号进入后可从 n1 开始推进。
- 9 个节点可按顺序解锁并推进。
- 首通奖励只发一次。
- 失败次数正常累计。
- 存档导出/导入后地图进度一致。
- 旧存档可正常加载且默认进入 n1。