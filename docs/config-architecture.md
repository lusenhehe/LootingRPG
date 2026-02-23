# 配置架构规范（仅规划，不改代码）

## 1. 文档状态

- 状态：可评审（Review Ready）
- 生效范围：全仓库配置文件（tooling/runtime/game/ui/content）
- 目标：解决配置分散、交叉依赖、命名不统一、可维护性下降的问题
- 边界：本文件只定义规范与迁移顺序，不包含任何代码修改

---

## 2. 当前问题摘要

1. `src/config` 与 `src/constants` 职责重叠：都有“静态配置 + 常量 + 业务参数”。
2. 配置层出现交叉依赖（例如 `config -> constants`，同时 `constants` 又读取 `config`）。
3. 部分配置包含运行逻辑（如翻译函数 `t`、数据组装），难以作为纯数据资产维护。
4. 工程规范缺口：缺少统一 lint/format/editor 规范文件。
5. `package.json` 脚本存在跨平台风险（Windows 下 `rm -rf` 不稳定）。

---

## 3. 目标状态（Target State）

### 3.1 配置分层

统一采用 5 层：

1. `tooling`：构建与开发工具配置（Vite/TS/脚本规范）
2. `runtime`：运行时环境配置（`.env`、存档 key、开关项）
3. `game-balance`：数值平衡与规则（成长、掉落、奖励、概率）
4. `ui-tokens`：UI 尺寸/样式 token（不含组件逻辑）
5. `content`：内容资产（怪物、地图、文本键、章节定义）

### 3.2 单向依赖规则

允许依赖：

- `content -> game-balance`
- `game-balance -> runtime`
- `ui-tokens -> runtime`（可选，仅当需要开关）

禁止依赖：

- `runtime -> game-balance/content`
- `game-balance <-> content` 双向循环
- 在纯配置层中引入 UI 组件或业务逻辑函数

### 3.3 数据纯度原则

1. JSON/TS 配置文件尽量保持“可序列化数据”。
2. 翻译、映射、数据派生放在 `logic/` 或 `adapters/`，不放配置源文件。
3. 所有配置键名统一英文（展示文案统一走 i18n）。

---

## 4. 目录建议（规划）

> 以下为目标目录蓝图，供后续迁移时使用。

```txt
src/
  config/
    tooling/
    runtime/
    game/
    ui/
    content/
```

示例映射（概念级）：

- `src/config/gameConstants.json` -> `src/config/game/equipment.json`
- `src/constants/settings.ts` -> `src/config/game/progression.ts` + `src/config/ui/tokens.ts`
- `src/config/mapChapters.ts` -> `src/config/content/mapChapters.ts`
- `src/config/monsters.json` -> `src/config/content/monsters.json`

---

## 5. 命名与格式规范

### 5.1 文件命名

- 纯数据：`*.json`
- 类型定义：`*.schema.ts` 或 `types/*.ts`
- 可执行配置（需要计算/导出常量）：`*.config.ts`

### 5.2 导出约定

1. 优先 `const XXX = ... as const`。
2. 避免 `any`，配置读取后必须有显式类型收口。
3. 禁止在配置文件内直接调用 i18n 翻译函数。

### 5.3 键名约定

1. key 使用英文小写驼峰或 snake_case（二选一，仓库统一）。
2. 业务显示字段不直接写中文，使用 `xxxKey` 对应 locale。

---

## 6. 迁移策略（分批，不改逻辑）

### 批次 1：台账与边界冻结

- 产出配置台账（文件、归属层、负责人、风险等级）
- 明确“新增配置必须登记”流程
- 冻结新增跨层依赖

### 批次 2：内容资产归位

- 先迁移 monster/map 等 content 文件
- 保持原字段兼容，必要时加适配层，不一次性改调用方

### 批次 3：数值规则归位

- 将成长、奖励、概率等拆到 game-balance
- UI 尺寸 token 分离到 ui-tokens

### 批次 4：运行时与存储键收口

- 统一 storage key/env key 管理入口
- 去除重复定义和隐式常量

### 批次 5：规范固化

- 引入 lint/format/editor 约束
- 增加配置变更 checklist 与 PR 模板检查项

---

## 7. 验收标准

1. 新增配置文件都能映射到 5 层之一。
2. 无新增跨层循环依赖。
3. 配置文件中不出现 UI 组件逻辑、翻译执行逻辑。
4. 台账覆盖率达到 100%（以 `src/config`、`src/constants` 为范围）。
5. README 或 docs 中有统一“配置修改流程”。

---

## 8. 风险与回滚预案（规划）

1. 风险：迁移过程中引用路径变更导致运行错误。
   - 预案：分批迁移 + 适配层过渡 + 每批次独立验证。
2. 风险：字段重命名影响旧存档兼容。
   - 预案：保留 key map（legacy -> new）至少 1 个版本周期。
3. 风险：配置纯化后某些动态逻辑无处放置。
   - 预案：新增 `logic/adapters` 作为配置到运行时对象的转换层。

---

## 9. 执行建议（两周样例）

- Week 1：完成台账、分层归属、第一批 content 迁移设计。
- Week 2：完成 game/ui/runtime 归位方案与规范固化，准备实际改造任务拆分。

> 备注：本文件为“优化计划基线文档”，用于指导后续改造任务，不直接触发代码变更。
