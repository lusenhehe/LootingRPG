# Phase 0.5：首批 10 个可执行迁移 Issue（建议）

> 目的：把 Phase 0 文档转成可执行任务，避免“有计划无落地”。

## 使用方式
- 每条 Issue 对应 `迁移台账` 的一条或多条记录。
- 完成后必须回写：台账状态、验证方式、实际删除时间。

## Issue 列表（按优先级）

| 优先级 | Issue 标题 | 范围 | 预估工时 | 验收标准 |
|---|---|---|---|---|
| P0 | 合并 `playerStats` 双实现 | `logic/playerStats.ts` + `logic/stats/playerStats.ts` | 1.5d | 仅保留 1 个运行时口径；旧导出弃用或删除；关键流程不回归。 |
| P0 | 收敛装备服务 | `equipment.ts` + `equipmentUtils.ts` + `enhancement.ts` | 2d | 装备/强化/重铸统一出口；调用方不再跨文件拼装逻辑。 |
| P0 | 建立 battle 纯函数边界 | `logic/battle/index.ts`（先抽 services） | 2d | 至少 3 个核心结算函数变纯函数并可单测。 |
| P1 | 拆分 App 编排职责 | `App.tsx` -> `app/AppShell.tsx` + orchestration hook | 1.5d | App 仅保留装配；跨域流程逻辑下沉。 |
| P1 | map 配置单一来源化 | `config/map/*` | 1.5d | 统一 TS/JSON 来源，消除重复字段定义。 |
| P1 | map 进度服务域化 | `logic/mapProgress.ts` -> `domains/map/services/progress.ts` | 1d | 迁移不改语义；调用路径可追踪。 |
| P1 | UI helper 去跨层 | `logic/uiHelpers.ts` | 1d | UI 只消费域层输出，不直接拼业务规则。 |
| P2 | 新增 orphan-import 检查脚本 | scripts/CI | 0.5d | 能报告无引用文件，作为清理依据。 |
| P2 | PR 模板增加冻结检查项 | `.github/pull_request_template.md` | 0.5d | 包含“是否登记迁移台账”等必答项。 |
| P2 | 建立周度巡检模板 | docs/优化 | 0.5d | 记录旧目录新增/净删除代码量与异常项。 |

## 里程碑建议

- **Milestone A（1 周）**：完成 P0（前三条）
- **Milestone B（2 周）**：完成 P1（中四条）
- **Milestone C（0.5 周）**：完成 P2（后三条）

## Definition of Done（统一）

1. 迁移台账状态从 `规划中` -> `迁移中` -> `已切换/已删除`。
2. 每条至少一项验证：`typecheck/build/smoke`。
3. 若引入临时兼容，必须登记删除期限。

