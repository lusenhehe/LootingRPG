User: 查看目前项目的所有UI架构，给出重构优化方案
搜索与 `**/src/shared/types/*.ts` 匹配的文件，2 匹配项

现在我已掌握全貌，进行综合分析。

---

## 当前 UI 架构全貌

### 层次结构

```
src/app/
├── AppShell.tsx          ← 根 Shell，调用 useGame() 提取 ~30 个值，整体 prop relay
├── GameContext.tsx        ← 总 Provider：组装 9 个子 Context + 合并成 GameContext
└── context/              ← 9 个分割 Context（auth/log/autoSell/map/battle/inventory/debug/misc/state）

src/components/game/
├── GameScreen.tsx         ← ~40 个 props，中继层
├── GamePanel.tsx          ← ~20 个 props，Tab 路由 + lazy 加载
├── BattleView.tsx         ← 524 行，拖拽交互、Toast、波次切换耦合在一起
├── tabs/                  ← InventoryTab / ForgeTab / MapTab / MonsterCodexTab（懒加载）
├── map/                   ← 地图渲染子组件
└── *.tsx                  ← PlayerCard / EnemyCard / ItemCard 等卡片组件

src/components/ui/
└── TabButton.tsx          ← 仅一个共通 UI 基础组件

src/hooks/game/
└── useAutoSell / useBattleSession / useDebug / useGameLogger / useInventoryActions / useMapProgress
```

---

## 发现的问题

### 🔴 P0 - 架构问题

**1. AppShell 是纯 Prop Relay（反模式）**

AppShell.tsx 从 `useGame()` 解构 ~30 个值，再将它们全部透传给 `GameScreen`，`GameScreen` 再将 ~40 个 props 传给 `GamePanel` 和各 Tab 组件。整条链路不产生任何逻辑，纯属传参中继。

这完全抵消了"分割 Context"的意义：子 Context 存在却没有在叶子组件层消费，渲染隔离形同虚设。

```
GameContext(split) ─→ useGame(merged) ─→ AppShell(relay) ─→ GameScreen(relay) ─→ GamePanel(relay) ─→ Tab
```

**2. 双 Context 策略不一致**

GameContext.tsx 同时创建了 9 个分割 Context（为了渲染隔离）**和** 一个合并 `GameContext`（把所有分割 Context 再合并）。但所有组件都通过 `useGame()` 使用合并版本，分割 Context 只在 Provider 嵌套中存在，从未被叶子组件直接消费。

**3. `forgeSelectedId` 污染全局 StateContext**

Tab 级别的临时 UI 状态（当前选中的锻造物品）被提升到了 `StateContext`（全局），导致选择装备时会触发所有使用 `StateContext` 的组件重渲染。

---

### 🟠 P1 - 组件质量

**4. BattleView.tsx 524 行，职责混乱**

一个组件内混杂了：拖拽状态机（`DragState`）、无目标 Toast 逻辑、波次视觉切换动画、技能栏渲染、敌方卡片区渲染、战斗日志、结算覆盖层。

**5. `shared/ui/` 极度匮乏**

只有一个 `TabButton.tsx`。所有按钮、徽章、模态框、面板等 UI 原语都内联在各业务组件里，造成大量样式重复（Tailwind class string 硬编码散落全项目）。

**6. GameState Reducer 过于粗粒度**

Reducer 只有 `RESET` 和 `SET` 两个 action，所有状态变更都通过 `setGameState(prev => ...)` 实现，无法做到：

- 细粒度的 action 追踪（无法 DevTools 审计）
- 乐观更新/回滚
- 面向 domain 的 reducer 拆分

**7. PlayerStats 双重传递**

`GameScreen` 同时接收 `gameState`（包含 `gameState.playerStats`）和独立的 `playerStats` prop，存在信息冗余。

---

## 重构优化方案

### 阶段一：消除 Prop Relay（最高收益）

**目标**：让子组件直接消费所需的分割 Context，彻底删除 AppShell 和 GameScreen 中的 prop 中继链。

```
Before: GameContext → useGame() → AppShell(30 props) → GameScreen(40 props) → Tab
After:  Tab → useBattleContext() / useInventoryContext() / useMapContext() 直接消费
```

具体步骤：
1. AppShell.tsx 只保留登录态判断逻辑，不再解构任何 context 值传给 `GameScreen`
2. GameScreen.tsx 不再接收任何 game 业务 props，内部直接消费 `useStateContext()` 判断是否有 `battleSession`
3. `BattleView` 消费 `useBattleContext()` 获取回调
4. `GamePanel` 内部消费 `useMapContext()` 获取 tab 状态
5. 各 Tab 组件消费对应 Context（`useInventoryContext`, `useMapContext` 等）

改造后 props 接口大幅缩减，渲染隔离开始真正生效。

---

### 阶段二：将 `forgeSelectedId` 下沉到 ForgeTab

```typescript
// Before (StateContext 全局)
const { forgeSelectedId, setForgeSelectedId } = useStateContext();

// After (ForgeTab 本地)
const [forgeSelectedId, setForgeSelectedId] = useState<string | null>(null);
```

从 `StateContext` 接口中删除这两个字段，减少全局状态体积。

---

### 阶段三：拆解 BattleView.tsx

按职责拆分为：

```
BattleView.tsx              ← 顶层协调器（~80行）
├── BattleDragEngine.tsx    ← 拖拽状态机 hook（useBattleDrag）
├── BattleEnemyZone.tsx     ← 敌方区域渲染
├── BattleSkillBar.tsx      ← 技能栏
├── BattleLog.tsx           ← 战斗日志列表
├── BattleWaveHeader.tsx    ← 波次标题 + 过渡动画
└── NoTargetToast.tsx       ← 提示 Toast（已是独立函数，提取为文件）
```

拖拽逻辑提取为自定义 hook `useBattleDrag(onAttack, onSkill)` 返回 `{ dragState, handlers }`。

---

### 阶段四：建立 `shared/ui` 基础组件库

补充以下原语（从现有组件中提取，统一样式标记）：

| 组件 | 用途 |
|------|------|
| `Button` | 替代分散的 `<button className="...">` |
| `Badge` | 品质/等级徽章（目前各处内联） |
| `Panel` | 半透明暗色容器（现在每处都写相同 Tailwind class） |
| `Modal` | 覆盖层模态框（StageDetailModal / BattleResultOverlay 共用底层） |
| `ProgressBar` | HP/能量条（PlayerCard / EnemyCard 都有实现） |

---

### 阶段五：Reducer action 细化（可选，中期）

```typescript
type GameStateAction =
  | { type: 'RESET' }
  | { type: 'INVENTORY/EQUIP'; itemId: string }
  | { type: 'INVENTORY/SELL'; itemId: string }
  | { type: 'BATTLE/SET_SESSION'; session: BattleSession | null }
  | { type: 'PLAYER/LEVEL_UP' }
  // ...
```

每个 domain 提供自己的 `xxReducer` slice，在根 `gameReducer` 中 compose。好处：DevTools 可审计、action 可序列化、domain 内聚。

---

## 优先级总结

| 优先级 | 改动 | 收益 | 风险 |
|--------|------|------|------|
| P0 | 叶子组件直接消费分割 Context，消除 AppShell/GameScreen prop relay | 渲染性能大幅提升、代码可读性 | 中（接口改动多） |
| P0 | `forgeSelectedId` 下沉到 ForgeTab 本地 | 减少不必要重渲染 | 低 |
| P1 | 拆解 BattleView 524 行 | 可维护性 | 低（逻辑不变，只是拆文件） |
| P1 | 补充 `shared/ui` 基础组件 | 减少重复、统一风格 | 低 |
| P2 | Reducer action 细化 | DevTools 可调试性、domain 内聚 | 中 |

最高优先度是**阶段一**：消除 prop relay 链，让分割 Context 真正发挥渲染隔离作用，目前 `GameContext` 的分割设计是正确方向，只是"最后一公里"（叶子消费）没有落地。