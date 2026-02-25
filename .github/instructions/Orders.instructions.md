# 开发提示与流程

## 架构概览

仓库已严格按照以下层次组织：
```
src/
  app/      # 组装层（路由、Provider、页面装配）
  domains/  # 业务域，每个域包含 model/services/reducers/ports/ui
  shared/   # 公共类型、工具、UI 组件
  infra/    # 外部能力（存储、i18n、遥测等）
```

依赖方向强约束：
- ui -> domain services/reducers
- domain -> ports
- infra -> ports 实现
- 不允许 domain 依赖 app/components/hooks/infra
- 不允许任何层依赖 `domains/*/ui`（UI 只能在组件/页面层）

## 开发流程提示

1. **新功能进入 domains**：所有纯业务逻辑写在 `src/domains/<domain>/services` 或 `reducers`。
2. **类型统一**：使用 `src/shared/types` 或各域的 `model`，并通过 `src/types` barrel 提供全局访问。
3. **依赖检查**：每次提交前运行：
   ```bash
   npm run lint         # 包含类型检查、ESLint、架构检查
   npm run check:orphan # 查找孤立文件
   ```
   CI 会自动执行同样的命令，任何违规都会阻塞合并。
4. **移除旧代码**：修改完成后，按照迁移台账删除旧路径与兼容导出。
5. **PR 模板必填**：
   - 改动涉及的域
   - 是否新增跨层耦合
   - 是否删除了旧模块/导出
6. **代码规范**：
   - 不要在域服务里 `import 'react'`
   - UI 组件只能从 `components` 或 `shared/ui` 导入
   - 参数均需注明类型，避免 `any` 或隐式 `any`
7. **CI 流程**：
   - `npm ci`
   - `npm run lint`
   - `npm run check:arch`
   - `npm run check:orphan`
   - `npm run build`

## 常用命令

```bash
npm run dev            # 本地开发
npm run build          # 打包
npm run lint           # 类型 + ESLint + 架构检查
npm run check:arch     # 仅架构依赖检查
npm run check:orphan   # 查找未被引用的文件
npm run clean          # 清理输出
``` 

## 提示词（开发时可参考）

- "我正在改哪个域？"（确认 domain 名称）
- "这个依赖符合依赖方向吗？"（避免违规导入）
- "是否有对应旧路径需要删除？"（保持一进一出）
- "有没有孤立文件可清理？"（运行 orphan 脚本）
- "构建 & lint 是否通过？"（本地通过才能发 PR）

## 额外注意

- 新增配置/类型时，尽量放在 `shared` 或目标域的 `model`，避免散落。
- 各域间交互通过 `domains/<other>/ports` 或共享 service 实现，不要直接拉取具体实现。
- 遇架构违规，考虑先在 `domains/*/ports` 定接口，再在 caller 中实现调用。

---

该文档作为团队日常参考，任何变更请同步更新。
