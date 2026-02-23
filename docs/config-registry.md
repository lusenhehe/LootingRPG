# 配置台账（初版）

## 1. 文档用途

- 目标：把当前仓库配置资产登记清楚，作为后续迁移与治理依据。
- 范围：`src/config`、`src/constants`、根目录工程配置。
- 说明：本台账是“当前状态快照 + 目标归属建议”，不涉及代码修改。

---

## 2. 分层枚举

- `tooling`
- `runtime`
- `game-balance`
- `ui-tokens`
- `content`
- `mixed(待拆分)`

---

## 3. 当前资产登记

| 文件 | 当前角色 | 主要内容 | 当前问题 | 目标层 | 风险等级 |
|---|---|---|---|---|---|
| `package.json` | 工程配置 | scripts/deps | `clean` 跨平台风险 | tooling | 中 |
| `tsconfig.json` | 工程配置 | TS 编译选项、路径别名 | 别名未普遍使用 | tooling | 低 |
| `vite.config.ts` | 工程配置 | 插件、alias、server | 注释含环境约束，需文档化 | tooling | 低 |
| `metadata.json` | 平台元数据 | name/description | 与 README/项目名可能不一致 | runtime | 低 |
| `src/config/gameConfig.ts` | 初始状态配置 | `INITIAL_STATE`、玩家初值 | 依赖 `constants/settings`，层次不清 | mixed(待拆分) | 中 |
| `src/config/gameConstants.json` | 装备基础配置 | 品质、部位、词条池、品质表 | 被 `constants/game.ts` 包装，边界不清 | game-balance | 中 |
| `src/config/mapChapters.ts` | 地图内容配置 | 章节/节点/波次 | 内容与展示字段混在一起 | content | 中 |
| `src/config/monsters.json` | 怪物内容配置 | normal/boss 原始条目 | 字段历史兼容负担较重 | content | 高 |
| `src/config/monsterStrategyConfig.ts` | 策略映射配置 | trait/counterGoal 评分映射 | 中文 key 与策略值耦合 | game-balance | 中 |
| `src/constants/game.ts` | 运行时常量聚合 | quality/slot/stat map、storage key、monster list | 同时做数据读取、翻译、派生，职责过重 | mixed(待拆分) | 高 |
| `src/constants/settings.ts` | 数值 + UI token | 成长、奖励、尺寸、样式 | game 与 ui 混放 | mixed(待拆分) | 中 |
| `src/constants/monsterData.ts` | 内容适配层 | monsters.json 正规化、翻译注入 | 配置与运行逻辑耦合高 | mixed(待拆分) | 高 |
| `src/constants/monsterLore.ts` | 内容加工 | lore 附加 | 应明确是 content 还是 adapter | mixed(待拆分) | 中 |
| `src/constants/monsterScaling.ts` | 规则计算 | 怪物数值缩放计算 | 更像 logic，而非 constants | game-balance | 中 |

---

## 4. 关键耦合记录（首批）

1. `src/config/gameConfig.ts` -> `src/constants/settings.ts`
2. `src/constants/game.ts` -> `src/config/gameConstants.json`
3. `src/constants/monsterData.ts` -> `src/config/monsters.json`
4. 多处 `logic/*` 同时依赖 `config` 与 `constants`

结论：当前存在“配置定义层”和“运行时适配层”交织的现象，建议先切分“纯配置”与“适配逻辑”。

---

## 5. 迁移批次建议（执行清单）

### Batch A：冻结与对齐

- [ ] 建立新增配置登记规则
- [ ] 统一 key 命名策略（英文 key + i18n）
- [ ] 定义禁止新增的跨层依赖

### Batch B：content 归位

- [ ] `monsters`、`mapChapters` 迁入 `content`
- [ ] 维持向后兼容字段（通过 adapter）
- [ ] 文案与数据分离（`nameKey` 优先）

### Batch C：game/ui 拆分

- [ ] `settings.ts` 拆成 progression 与 ui tokens
- [ ] `gameConstants.json` 按装备/词条子域拆分
- [ ] 明确 storage/env 配置归 runtime

### Batch D：适配层收口

- [ ] 将翻译注入、数据正规化迁至 `logic/adapters`
- [ ] `constants/*` 仅保留真正“全局常量”
- [ ] 移除双向依赖路径

### Batch E：治理固化

- [ ] 引入 ESLint/Prettier/EditorConfig
- [ ] 在 README 增加配置变更流程
- [ ] 增加 PR checklist（配置变更项）

---

## 6. 负责人与流程模板（可直接用）

|    领域      | 默认负责人角色 | 变更前置检查 |
|---           |--------------|---|
| tooling      | 前端基础设施  | 是否影响构建/CI/开发环境 |
| runtime      | 客户端架构    | 是否涉及 env、存档 key 兼容 |
| game-balance | 数值策划/玩法 | 是否有版本平衡说明 |
| ui-tokens    | 前端 UI      | 是否新增硬编码样式风险 |
| content      | 策划/关卡     | 是否包含 i18n key 与内容校对 |

PR 描述建议附带：

1. 变更层级（tooling/runtime/game/ui/content）
2. 影响范围（模块、存档、i18n）
3. 回滚方式（字段回退/适配开关）

---

## 7. Definition of Done（台账阶段）

- [ ] 本文覆盖所有已存在配置文件
- [ ] 每个文件有“目标层 + 风险等级 + 迁移批次”
- [ ] 与 `docs/config-architecture.md` 规则一致
- [ ] 可直接用于拆分实际改造任务

> 备注：本文件为持续维护文档，后续每次新增配置文件都应追加登记。
