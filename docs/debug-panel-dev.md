Debug Panel (开发) 说明

目的
- 提供一个调试面板，便于开发者快速向背包注入指定品质/部位的测试装备。
- 面板可通过右下角 `Debug` 按钮打开，也可按快捷键 `Ctrl+D` 切换显示。

位置
- 组件文件: src/components/game/DebugPanel.tsx
- 游戏主屏幕集成: src/components/game/GameScreen.tsx
- App 层回调: src/App.tsx -> `onDebugAddItems`
- 生成装备逻辑: src/logic/equipment.ts -> `createCustomEquipment`

使用说明
1. 在运行的开发环境中，按 `Ctrl+D` 或点击界面右下角 `Debug` 按钮。
2. 在弹出的面板中选择：
   - 品质 (quality)：下拉选择 `QUALITIES` 列表项
   - 部位 (slot)：下拉选择 `SLOTS` 列表项
   - 数量 (count)：输入要添加的装备数量，1-100
   - 等级 (level)：指定生成装备的等级（>=1）
3. 点击 `添加`，所选装备将被生成并追加到当前存档的背包（`gameState.背包`）。

实现细节
- 键盘监听：`DebugPanel` 在挂载时监听 `keydown`，检测 `Ctrl+D` 以切换面板（阻止默认行为）。
- 装备创建：使用 `createCustomEquipment(quality, slot, playerLevel, isBoss=false)` 生成带随机属性/词缀的 `Equipment` 对象。
-- 将装备加入背包：`App.tsx` 提供 `onDebugAddItems` 回调，接收 (quality, slot, count, level?) 并通过 `setGameState` 将生成的装备追加到 `gameState.背包`。

扩展建议
- 支持选择是否为 Boss 掉落（影响稀有度/词缀数）。
- 支持直接装备到对应槽位（跳过背包）。
- 支持批量生成并打开背包或自动排序/降序显示。
- 将 Debug 面板权限受限，仅在开发模式（`process.env.NODE_ENV === 'development'`）下显示。

注意事项
- 此功能仅为开发/测试用途，不应在生产环境中暴露给最终玩家。
- 生成的装备 id 是随机字符串，若需要可改为固定前缀以便测试查找。

文件参考
- `src/components/game/DebugPanel.tsx`
- `src/components/game/GameScreen.tsx`
- `src/App.tsx`
- `src/logic/equipment.ts`

