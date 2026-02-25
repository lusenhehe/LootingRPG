**ForgeTab 开发规范与实现计划**

- **目标**: 逐步实现 `ForgeTab` 的完整 UI 控件，包含条目锁定、强化预览（成本/结果）、应用与重铸（含锁定选项）、成本提示与本地化支持，且不改动现有逻辑函数签名。
- **范围**: 仅前端 UI 层实现与与已有逻辑函数对接（`src/logic/equipment.ts` 中的 `previewEnchant`、`applyEnchant`、`calculateEnchantCost`、`rerollAffixes` 等）。不在本任务中修改核心逻辑实现。

**UX 概览**
- 左侧：当前选中物品与基础信息（名称、图标、品质、强化等级）。
- 中间：`AffixList`，逐条显示词条、当前数值、锁定开关（toggle）、预览后新数值的临时展示样式。
- 右侧：操作控制区，包括：`预览次数` 控件（1/5/10）、`查看预览` 按钮、`显示/隐藏 预估成本` 文本、`应用强化`（确认）按钮、`重铸` 按钮以及 `已锁定词条数 / 最大可锁` 指示。
- 顶部/底部：消耗提示（金币/材料）、成功率/变化说明、轻量帮助文本（i18n）。

**组件职责划分**
- **ForgeTab** (容器)
  - 管理当前选中物品（来自 Inventory）、总成本显示、与逻辑函数的交互。
  - 聚合子组件：`AffixList`、`EnchantControls`、`ConfirmModal`。
- **AffixList**
  - Props: `item`, `lockedIndexes: number[]`, `onToggleLock(index)`, `previewAffixes?`。
  - 显示每条词条的名称（i18n）、当前值、若存在 `previewAffixes` 则显示预览后的值（样式区分）。
- **EnchantControls**
  - Props: `onPreview(times)`, `onApply()`, `onReroll(lockedIndexes)`, `costInfo`。
  - 显示预览次数选择、预览/应用/重铸按钮，以及成本/材料摘要。
- **ConfirmModal**
  - 展示最终确认信息（成本、变化预览），支持 `确认` / `取消`。

**状态与数据流**
- 本地状态（`ForgeTab`）:
  - `selectedItem`：装备对象（由 Inventory 提供）
  - `lockedIndexes: number[]`：被锁定词条索引数组
  - `previewResult?`：来自 `previewEnchant(item, times, lockedIndexes)` 的预览对象（含预计词条/数值/概率）
  - `costInfo`：由 `calculateEnchantCost(item, options)` 返回的成本结构
  - `isConfirmOpen`, `isLoading` 等 UI 状态
- 交互流程:
  1. 用户在 `AffixList` 中切换锁定状态 → 更新 `lockedIndexes`。
  2. 点击 `查看预览(times)` → 调用 `previewEnchant(selectedItem, times, lockedIndexes)`，展示 `previewResult`（并显示 `costInfo`）。
  3. 若满意，点击 `应用强化` → 弹出 `ConfirmModal`（显示最终成本）→ 确认后调用 `applyEnchant(selectedItem, lockedIndexes)`，更新库存/物品。
  4. `重铸` 功能调用 `rerollAffixes(selectedItem, { lockedIndexes })`，并同步返回结果。

**对接逻辑函数（现有）**
- `calculateEnchantCost(item, options?)` — 用于显示与确认成本。
- `previewEnchant(item, times, lockedIndexes)` — 产生预览结果（示例数据结构需在代码中确认）。
- `applyEnchant(item, lockedIndexes)` — 执行并返回变更后的 item。
- `rerollAffixes(item, { lockedIndexes, seed? })` — 执行重铸并返回结果。

（实现时请在顶部 import 并保持对函数返回值的空值/错误处理）

**i18n Keys 建议**
- `ui.forge.title`
- `ui.forge.affixes`
- `ui.forge.lock`
- `ui.forge.unlock`
- `ui.forge.preview`
- `ui.forge.apply`
- `ui.forge.reroll`
- `ui.forge.cost`
- `ui.forge.confirm_title`
- `ui.forge.confirm_body`
- `message.enchant_success`
- `message.enchant_fail`

（请在 `asset/data/locales/zh/translation.json` 与 `asset/data/locales/en/translation.json` 中增加对应翻译。）

**可访问性与交互细节**
- 锁定开关应为键盘可聚焦的按钮（`button`），并提供 `aria-pressed`。
- 预览/应用操作需要明确的 loading 状态和防止重复提交机制。

**验收标准**
- 用户能在 `ForgeTab` 中：查看词条、切换锁定、运行预览（1/5/10）、查看成本并弹出确认、确认后物品发生正确变更（逻辑函数返回结果已应用）。
- 所有新文案均走 i18n，且中/英两套翻译均存在。
- UI 在常见分辨率下无遮挡、z-index 正确（下拉/模态覆盖）且可键盘操作。

**任务分解（匹配 TODO）**
- 设计 ForgeTab UI 组件与状态管理（低风险，0.5d）
- 实现 `AffixList` 并接入 `previewEnchant`（1d）
- 实现锁定/解锁控件（0.5d）
- 实现预览成本显示与批量预览（1d）
- 实现确认/应用/撤销 流程（含 ConfirmModal）（1d）
- 添加/更新 i18n key 并同步 locales（0.5d）
- 编写单元/集成测试（1d）
- 手动 QA 与修复（0.5d）

**测试建议**
- 单元测试：mock `previewEnchant` 与 `applyEnchant`，断言 UI 在不同返回值下展示正确的预览/成本。
- 集成测试：在 dev 环境中手动走一遍预览→确认→应用流程，验证 inventory 与 item state 更新。

**发布 / 回滚策略**
- 先在开发分支合入 UI（不改变逻辑），进行本地验证与 CI 类型检查。若发现逻辑兼容性问题，可回滚 UI 变更，保留逻辑代码不变。

---

文档作者: 开发者
日期: 2026-02-24
