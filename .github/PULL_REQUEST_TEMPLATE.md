## 变更摘要

- 变更层级：tooling / runtime / game-balance / ui-tokens / content
- 变更类型：迁移 / 拆分 / 规范 / 文档
- 关联任务：#issue-id

## 影响范围

- 涉及文件：
- 涉及模块：
- 是否影响存档兼容：是 / 否
- 是否影响 i18n 键：是 / 否
- 是否影响构建流程：是 / 否

## 架构规则自检（必勾）

- 本次变更涉及的域（battle/inventory/map/player/app/infra等）：
- 是否新增跨层耦合（如 domain 引入 UI、域依赖 app 等）：是/否
- 是否删除了旧代码或兼容导出？请列出文件路径

- [ ] 未新增 `runtime -> game-balance/content` 逆向依赖
- [ ] 未新增 `game-balance <-> content` 双向循环
- [ ] 配置文件未混入 UI 组件逻辑
- [ ] 配置文件未直接执行翻译/复杂派生逻辑

## 验证记录

- [ ] 已执行 `npm run lint`
- [ ] 已执行必要的运行验证（说明：）
- [ ] 行为与迁移前一致（或已在下方说明差异）

## 回滚方案

- 回滚方式：
- 风险提示：

## 备注

- 兼容策略（如 legacy key map）：
- 后续任务（可选）：
