# UI 重构计划

> 文档状态：草稿  
> 创建日期：2026-03-06  
> 目标版本：完成后删除旧兼容层，所有 lint + arch 检查通过

---

## 一、现状诊断

### 1.1 当前组件树

```
main.tsx
└── App.tsx
    └── GameProvider (GameContext.tsx)
        └── AppShell.tsx               ← 解构 ~30 个 context 值，全量 prop relay
            ├── LoginScreen.tsx
            └── GameScreen.tsx         ← 接收 ~40 个 props，仅做渲染分发
                ├── BattleView.tsx     ← 524 行，职责混杂
                ├── GamePanel.tsx      ← 接收 ~20 个 props，Tab 路由
                │   ├── InventoryTab.tsx   (lazy)
                │   ├── MapTab.tsx         (lazy)
                │   ├── ForgeTab.tsx       (lazy)
                │   └── MonsterCodexTab.tsx(lazy)
                └── DebugPanel.tsx
```

### 1.2 Context 层现状

`GameContext.tsx` 同时创建了两套 Context：

| 层 | Context 数量 | 实际在叶子被消费？ |
|---|---|---|
| 分割 Context | 9 个（auth/log/autoSell/map/battle/inventory/debug/misc/state）| **否**，仅作 Provider 嵌套 |
| 合并 GameContext | 1 个，将 9 个分割值合并 | 是，`useGame()` 是唯一消费点 |

结果：分割 Context 的渲染隔离设计从未生效，所有组件等效于订阅了全量状态。

### 1.3 已识别问题清单

| 编号 | 类别 | 问题描述 | 严重程度 |
|------|------|----------|----------|
| P-01 | 架构 | AppShell/GameScreen 纯 prop relay，不产生任何逻辑价值 | 🔴 高 |
| P-02 | 架构 | 分割 Context 存在但从未被叶子消费，渲染隔离无效 | 🔴 高 |
| P-03 | 状态 | `forgeSelectedId`（Tab 级 UI 临时状态）放入全局 StateContext | 🟠 中 |
| P-04 | 组件 | `BattleView.tsx` 524 行，拖拽/Toast/波次/技能/日志全部耦合 | 🟠 中 |
| P-05 | 组件 | `StatusBadge` 在 PlayerCard 和 EnemyCard 中各自重复实现 | 🟡 低 |
| P-06 | 组件 | `shared/ui/` 只有 `TabButton.tsx`，大量 UI 原语内联在业务组件里 | 🟡 低 |
| P-07 | 状态 | Reducer 只有 `RESET`/`SET` 两个 action，无法追踪细粒度变更 | 🟡 低 |
| P-08 | Props | `GameScreen` 同时接收 `gameState` 和独立 `playerStats`，信息冗余 | 🟡 低 |
| P-09 | 组件 | `AppHeader` 接收 7 个 props 但从未使用 Context，无法自主获取 | 🟡 低 |

---

## 二、重构目标

1. **真正激活渲染隔离**：叶子组件直接消费所属分割 Context，而不是通过 prop 接收
2. **消除 prop drilling**：AppShell 和 GameScreen 不再充当 relay 层
3. **下沉临时 UI 状态**：Tab 内部状态归还给 Tab 本身
4. **拆解超长组件**：单文件不超过 200 行
5. **建立 shared/ui 基础库**：提取跨业务复用的 UI 原语

重构遵守现有架构约束（见 Orders.instructions.md）：
- 不引入新的跨层耦合
- 所有叶子 Context 消费都在 `components/` 层
- Domain 服务不引入 React

---

## 三、重构阶段

---

### 阶段 1：让叶子组件直接消费分割 Context（消除 prop relay）

**预计工作量**：3–4 天  
**收益**：渲染性能最大化提升，prop 数量减少 80%

#### 1.1 AppShell 瘦身

**改造前**（现状）：
```tsx
// AppShell.tsx
const { profiles, activeProfileId, isAuthenticated, gameState, loading,
        activeTab, autoSellQualities, forgeSelectedId, mapProgress, ...30个值 } = useGame();

return <GameScreen
  gameState={gameState}
  activeTab={activeTab}
  loading={loading}
  // ... 传递所有值
/>
```

**改造后**：
```tsx
// AppShell.tsx —— 只保留登录态判断
export function AppShell() {
  const [showSimulator, setShowSimulator] = useState(false);
  const { isAuthenticated, profiles, activeProfileId,
          handleLogin, handleCreateProfile, handleDeleteProfile } = useAuthContext();

  if (!isAuthenticated) {
    return (
      <LoginScreen
        profiles={profiles}
        onLogin={handleLogin}
        onCreate={handleCreateProfile}
        onDelete={handleDeleteProfile}
      />
    );
  }

  return (
    <>
      <GameScreen onOpenSimulator={() => setShowSimulator(true)} />
      {showSimulator && <BattleSimulatorPage onClose={() => setShowSimulator(false)} />}
    </>
  );
}
```

#### 1.2 GameScreen 瘦身

**改造前**：接收 ~40 个 props  
**改造后**：接收 0~2 个 props，内部消费 Context

```tsx
// GameScreen.tsx
export function GameScreen({ onOpenSimulator }: { onOpenSimulator?: () => void }) {
  const { gameState } = useStateContext();
  const battleSession = gameState.battle.activeSession;

  return (
    <div className="flex flex-col h-screen ...">
      <main className="...">
        {battleSession ? <BattleView /> : <GamePanel />}
      </main>
      <DebugPanel onOpenSimulator={onOpenSimulator} />
    </div>
  );
}
```

#### 1.3 各 Tab 直接消费 Context

每个 Tab 自己拿所需数据，不接收 drilling props：

```tsx
// InventoryTab.tsx
export function InventoryTab() {
  const { gameState } = useStateContext();
  const { handleEquip, handleSell, handleForge,
          quickSellByQualityRange, handleUnequip } = useInventoryContext();
  const { autoSellQualities, handleToggleAutoSellQuality } = useAutoSellContext();
  const { loading } = useStateContext();
  // ...
}

// MapTab.tsx
export function MapTab() {
  const { mapProgress, focusMapNode, setMapProgress,
          setFocusMapNode, activeTab, setActiveTab } = useMapContext();
  const { handleEnterMapNode } = useBattleContext();
  // ...
}

// ForgeTab.tsx
export function ForgeTab() {
  const { gameState, loading } = useStateContext();
  const { handleForge, handleReroll } = useInventoryContext();
  const [selectedId, setSelectedId] = useState<string | null>(null); // ← 本地状态
  // ...
}
```

#### 1.4 BattleView 消费 Context

```tsx
// BattleView.tsx
export function BattleView() {
  const { gameState } = useStateContext();
  const { handleBattleAttack, handleBattleRetreat,
          handleBattleCloseResult, handleBattleUseSkill } = useBattleContext();
  const session = gameState.battle.activeSession!;
  // ...
}
```

#### 1.5 AppHeader 消费 Context

```tsx
// AppHeader.tsx
export function AppHeader() {
  const { gameState } = useStateContext();
  const { profiles, activeProfileId, handleLogoutAction,
          handleExportSave, handleImportSave } = useAuthContext();
  const { handleReset } = useMiscContext();
  const playerName = profiles.find(p => p.id === activeProfileId)?.name ?? 'Unknown';
  // ...
}
```

#### 1.6 GamePanel 消费 Context

```tsx
// GamePanel.tsx
export function GamePanel() {
  const { activeTab, setActiveTab } = useMapContext();
  // Tab 切换自主管理，无需上层传入
  // ...
}
```

#### 1.7 验收标准

- [ ] `AppShell.tsx` 中 `useGame()` 调用被删除，改用具体分割 Context hook
- [ ] `GameScreen.tsx` props interface 中业务相关字段全部清除
- [ ] `GamePanel.tsx` props 中 `onSetTab`/`activeTab` 等移除
- [ ] 各 Tab 组件 props 中不再有从父层 drilling 的业务数据
- [ ] `npm run check:arch` 通过
- [ ] `npm run lint` 通过

---

### 阶段 2：`forgeSelectedId` 本地化

**预计工作量**：0.5 天  
**收益**：选择锻造装备时不再触发全局重渲染

阶段 1 中 `ForgeTab` 已改为本地 `useState`，本阶段清理全局层面的残留。

#### 2.1 从 StateContext 删除

```typescript
// context/state.ts —— 删除以下字段
export interface StateContextValue {
  gameState: GameState;
  dispatchGameState: React.Dispatch<...>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  // 删除：forgeSelectedId: string | null;
  // 删除：setForgeSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
}
```

#### 2.2 从 GameContext.tsx 删除

```typescript
// GameContext.tsx —— 删除
// const [forgeSelectedId, setForgeSelectedId] = useState<string | null>(null);

const stateValue: StateContextValue = {
  gameState,
  dispatchGameState,
  loading,
  setLoading,
  // 删除：forgeSelectedId,
  // 删除：setForgeSelectedId,
};
```

#### 2.3 验收标准

- [ ] `StateContextValue` 接口中 `forgeSelectedId`/`setForgeSelectedId` 已删除
- [ ] `GameContext.tsx` 中对应 useState 已删除
- [ ] `ForgeTab` 本地 `useState` 可正常工作
- [ ] `npm run lint` 通过

---

### 阶段 3：统一 `StatusBadge` 组件

**预计工作量**：0.5 天  
**收益**：消除 `PlayerCard` 与 `EnemyCard` 中的重复实现

#### 3.1 提取到共享位置

```
src/components/game/battle/StatusBadge.tsx   ← 新建
```

```tsx
// StatusBadge.tsx
import type { BattleStatusInstance } from '../../../types/battle/BattleUnit';

const STATUS_ICONS: Record<string, string> = {
  dot: '🔴', hot: '💚', buff: '✨', debuff: '💀', shield: '🛡',
};

interface StatusBadgeProps {
  status: BattleStatusInstance;
  /** 图标渲染模式：'emoji'（文字）| 'icon'（React 图标组件），默认 emoji */
  mode?: 'emoji' | 'icon';
}

export function StatusBadge({ status, mode = 'emoji' }: StatusBadgeProps) {
  const icon = STATUS_ICONS[status.kind] ?? '❓';
  return (
    <span
      title={`${status.id} ×${status.stacks} (${status.remainingTurns}t)`}
      className="inline-flex items-center gap-[1px] text-[7px] leading-none px-0.5 py-[1px] rounded bg-black/60 text-gray-200 shrink-0"
    >
      <span className="text-[8px] leading-none">{icon}</span>
      {status.stacks > 1 && <span>×{status.stacks}</span>}
      <span className="text-gray-500">{status.remainingTurns}</span>
    </span>
  );
}
```

注：`EnemyCard` 当前使用 React 图标组件版（lucide），`PlayerCard` 使用 emoji 版，通过 `mode` prop 统一。

#### 3.2 替换两处重复实现

- `PlayerCard.tsx`：删除本地 `StatusBadge`，改为 `import { StatusBadge }`
- `EnemyCard.tsx`：删除本地 `StatusBadge`，改为 `import { StatusBadge } mode="icon"`

#### 3.3 验收标准

- [ ] `src/components/game/battle/StatusBadge.tsx` 已创建
- [ ] 两个旧的内联 `StatusBadge` 函数已删除
- [ ] `npm run check:orphan` 无新孤立文件

---

### 阶段 4：拆解 `BattleView.tsx`（524 行）

**预计工作量**：2–3 天  
**收益**：单文件职责清晰，可维护性大幅提升

#### 4.1 目标文件结构

```
src/components/game/battle/
├── BattleView.tsx             ← 顶层协调器，~60 行
├── BattleDragEngine.ts        ← 拖拽状态机（纯 hook，无 JSX）
├── BattleEnemyZone.tsx        ← 敌方区域渲染
├── BattleSkillBar.tsx         ← 技能栏
├── BattleLog.tsx              ← 滚动战斗日志列表
├── BattleWaveHeader.tsx       ← 波次标题 + 切换动画
├── BattleResultOverlay.tsx    ← 结算覆盖层（已独立，移入此目录）
├── NoTargetToast.tsx          ← 无目标提示 Toast
├── StatusBadge.tsx            ← 单位状态徽章（见阶段 3）
└── index.ts                   ← barrel export
```

#### 4.2 拖拽 hook 提取

```typescript
// BattleDragEngine.ts
type AttackDrag = { type: 'attack'; x: number; y: number; hoveredEnemyId: string | null };
type SkillDrag  = { type: 'skill'; skillId: string; x: number; y: number; hoveredEnemyId: string | null };
export type DragState = AttackDrag | SkillDrag;

export interface UseBattleDragOptions {
  onAttack: (targetId?: string) => void;
  onSkill?: (skillId: string, targetId?: string) => void;
  onNoTarget: () => void;
}

export function useBattleDrag({ onAttack, onSkill, onNoTarget }: UseBattleDragOptions) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  // ... 整合现有的 pointer 事件监听逻辑
  // 返回：{ dragState, startAttackDrag, startSkillDrag }
}
```

#### 4.3 波次切换 hook 提取

```typescript
// useWaveTransition.ts
export function useWaveTransition(waveIndex: number, delayMs: number) {
  const [displayWaveIndex, setDisplayWaveIndex] = useState(waveIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // ... 整合现有 useEffect 逻辑
  return { displayWaveIndex, isTransitioning };
}
```

#### 4.4 顶层协调器

```tsx
// BattleView.tsx（~60 行）
export function BattleView() {
  const { gameState } = useStateContext();
  const { handleBattleAttack, handleBattleRetreat,
          handleBattleCloseResult, handleBattleUseSkill } = useBattleContext();
  const session = gameState.battle.activeSession!;

  const [showNoTargetToast, setShowNoTargetToast] = useState(false);
  const fireToast = useCallback(() => setShowNoTargetToast(true), []);

  const { dragState, startAttackDrag, startSkillDrag } = useBattleDrag({
    onAttack: handleBattleAttack,
    onSkill: handleBattleUseSkill,
    onNoTarget: fireToast,
  });

  const { displayWaveIndex, isTransitioning } = useWaveTransition(
    session.currentWaveIndex, UI_CFG.battleView?.waveTransition?.delayMs ?? 600,
  );

  return (
    <div className="...">
      <NoTargetToast visible={showNoTargetToast} onHide={() => setShowNoTargetToast(false)} />
      <BattleWaveHeader session={session} displayWaveIndex={displayWaveIndex} />
      <div className="...">
        <PlayerCard session={session} />
        <BattleEnemyZone session={session} dragState={dragState}
          onStartAttackDrag={startAttackDrag} />
      </div>
      <BattleLog entries={session.log} />
      <BattleSkillBar session={session} onStartSkillDrag={startSkillDrag} />
      <BattleResultOverlay session={session} onClose={handleBattleCloseResult} />
    </div>
  );
}
```

#### 4.5 验收标准

- [ ] `BattleView.tsx` 行数 ≤ 80
- [ ] 各子文件行数各自 ≤ 200
- [ ] `useBattleDrag` hook 有单独测试用例（可选）
- [ ] 拖拽/攻击/技能功能与重构前一致（手动回归）
- [ ] `npm run lint` 通过

---

### 阶段 5：建立 `shared/ui` 基础组件库

**预计工作量**：2–3 天  
**收益**：消除全项目内联重复样式，统一设计语言

#### 5.1 目标目录

```
src/shared/ui/
├── index.ts            ← barrel export
├── Button.tsx
├── Badge.tsx
├── Panel.tsx
├── Modal.tsx
├── ProgressBar.tsx
└── Spinner.tsx
```

#### 5.2 各组件规格

**Button.tsx**

提取自：InventoryTab、ForgeTab、BattleView 中散落的 `<button className="...">` 链

```tsx
interface ButtonProps {
  variant?: 'primary' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
export function Button({ variant = 'primary', size = 'md', loading, ...props }: ButtonProps) { ... }
```

**Badge.tsx**

提取自：品质徽章（`QUALITY_STYLE_MAP_ENHANCED` 的渲染逻辑在多处重复）

```tsx
interface BadgeProps {
  quality?: string;   // 品质色彩
  label: string;
  glow?: boolean;
}
export function Badge({ quality, label, glow }: BadgeProps) { ... }
```

**Panel.tsx**

提取自：各 Tab 中反复出现的半透明暗色容器

```tsx
interface PanelProps {
  className?: string;
  children: React.ReactNode;
  /** 圆角方案，对应 clip-corner-* */
  clipCorner?: number;
}
export function Panel({ className, children, clipCorner }: PanelProps) { ... }
```

**ProgressBar.tsx**

提取自：`PlayerCard` 和 `EnemyCard` 中各自实现的 HP/能量进度条

```tsx
interface ProgressBarProps {
  value: number;
  max: number;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'custom';
  customColor?: string;
  showText?: boolean;
  height?: 'xs' | 'sm' | 'md';
}
export function ProgressBar({ value, max, color = 'green', ... }: ProgressBarProps) { ... }
```

**Modal.tsx**

提取自：`StageDetailModal` 和 `BattleResultOverlay` 的底层覆盖层结构

```tsx
interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}
export function Modal({ open, onClose, children, className }: ModalProps) { ... }
```

#### 5.3 替换优先级

优先替换使用频率最高的：
1. `ProgressBar` —— PlayerCard、EnemyCard（2 处，逻辑完全相同）
2. `Button` —— ForgeTab、InventoryTab（使用最密集）
3. `Panel` —— 各 Tab 的外层容器

#### 5.4 验收标准

- [ ] `src/shared/ui/index.ts` barrel 完整
- [ ] PlayerCard / EnemyCard 的 HP 条改用 `ProgressBar`
- [ ] `npm run check:orphan` 无孤立文件
- [ ] 视觉效果与重构前一致

---

### 阶段 6：Reducer action 细化（可选，中期规划）

**预计工作量**：3–5 天  
**收益**：DevTools 可审计、domain 内聚、为未来 undo/redo 打基础  
**风险**：接口变更较大，建议在前 5 个阶段稳定后再启动

#### 6.1 目标 Action 类型

```typescript
// app/state/actions.ts
export type GameStateAction =
  // 系统
  | { type: 'RESET' }
  | { type: 'LOAD_SAVE'; payload: GameState }
  // 背包
  | { type: 'INVENTORY/EQUIP'; itemId: string }
  | { type: 'INVENTORY/UNEQUIP'; slot: string }
  | { type: 'INVENTORY/SELL'; itemId: string }
  | { type: 'INVENTORY/SELL_BATCH'; itemIds: string[] }
  | { type: 'INVENTORY/ADD_ITEMS'; items: Equipment[] }
  // 锻造
  | { type: 'FORGE/ENCHANT'; itemId: string; result: Equipment }
  | { type: 'FORGE/REROLL'; itemId: string; result: Equipment; goldCost: number }
  // 战斗
  | { type: 'BATTLE/START'; session: BattleSession }
  | { type: 'BATTLE/UPDATE'; session: BattleSession }
  | { type: 'BATTLE/END' }
  // 玩家
  | { type: 'PLAYER/GRANT_XP'; amount: number }
  | { type: 'PLAYER/GRANT_GOLD'; amount: number };
```

#### 6.2 分 slice 实现

```
src/app/state/
├── index.ts
├── actions.ts          ← 全局 action 类型定义
├── stateManager.ts
├── slices/
│   ├── inventorySlice.ts
│   ├── battleSlice.ts
│   └── playerSlice.ts
└── rootReducer.ts      ← compose 各 slice
```

#### 6.3 验收标准

- [ ] 所有 `setGameState(prev => ...)` 调用替换为 `dispatchGameState({ type: ... })`
- [ ] Redux DevTools（或自定义 logger）可追踪每条 action
- [ ] `npm run lint` 通过

---

## 四、执行顺序与依赖关系

```
阶段 1（消除 prop relay）
    │
    ├─→ 阶段 2（forgeSelectedId 本地化）  ← 可与阶段 1 最后并行
    │
阶段 3（StatusBadge 统一）               ← 可随时独立执行
    │
阶段 4（BattleView 拆解）               ← 依赖阶段 1（BattleView 先消费 Context）且 阶段 3 已完成
    │
阶段 5（shared/ui 基础库）              ← 可在阶段 3 后随时执行，与阶段 4 并行
    │
阶段 6（Reducer 细化）                  ← 最后执行，依赖前置稳定
```

---

## 五、不变更原则（红线）

以下内容在本次重构中**不触碰**：

1. `src/domains/` 内部逻辑 —— 本次只动 UI 层
2. 现有的 9 个分割 Context 的**接口定义**和**数据结构**
3. `assets/data/` 配置文件
4. Android 构建相关文件
5. `src/tools/BattleSimulator/` —— 独立工具，不纳入本次重构

---

## 六、每阶段完成检查

完成每阶段后必须执行：

```bash
npm run lint           # 类型 + ESLint + 架构
npm run check:arch     # 依赖方向检查
npm run check:orphan   # 孤立文件
npm run build          # 确保产物可打包
```

全部通过后方可进入下一阶段。

---

## 七、里程碑

| 里程碑 | 完成条件 | 预计完成 |
|--------|----------|----------|
| M1 | 阶段 1+2 完成，prop relay 彻底消除 | 阶段 1–2 结束 |
| M2 | 阶段 3+4 完成，BattleView 拆解完毕 | 阶段 3–4 结束 |
| M3 | 阶段 5 完成，shared/ui 基础库可用 | 阶段 5 结束 |
| M4（可选）| 阶段 6 完成，action 可审计 | 阶段 6 结束 |
