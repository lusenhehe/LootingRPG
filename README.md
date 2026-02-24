**怎么游玩:** 
1. 安装Node.js
2. 终端运行 `npm install`
3. 终端运行 `npm run dev`

## 专属装备 CSV 配置

- 当前装备掉落已改为读取 `src/config/content/UniqueEquipments.csv`（不再走原随机词条拼装）。
- 可直接编辑 CSV 添加条目，核心列：
	- `id,slot,quality,icon`
	- `name_zh,name_en`
	- `special_zh,special_en`
	- `attributes`（JSON 对象字符串）
	- `affixes`（JSON 数组字符串）
	- `tags,chance,weight,bossOnly,mapNode,levelOffset,scalePerLevel`
- `chance` 取值范围建议 `0~1`，`bossOnly=true` 表示仅 Boss 战可掉落。
- `attributes` 示例：`{"attack":120,"attackSpeed":12}`
- `affixes` 示例：`[{"type":"damage_bonus","value":18}]`

## 地图系统开发

- 设计与实现文档见：`docs/map-system-dev.md`
- 当前已接入 MVP 地图节点推进（9 节点，首通奖励，失败记录，存档持久化）

📋 游戏开发建议
🔴 高优先级 - 核心玩法增强sd
| 功能 | 描述 | 复杂度 |
|------|------|--------|
| 技能系统 | 玩家可以学习和使用技能（如火球术、治疗术、护盾） | 中 |
| Buff系统 | 战斗中添加增益/减益效果 | 低 |
| 连击系统 | 连续击败怪物获得连击加成奖励 | 低 |
| 限时挑战 | 每日/每周限时BOSS挑战 | 中 |
🟡 中优先级 - 内容扩展
| 功能 | 描述 | 复杂度 |
|------|------|--------|
| 更多怪物 | 添加精英怪、世界BOSS、元素生物 | 低 |
| 装备套装 | 2件/4件套效果（如"深渊套装"） | 中 |
| 装备星级 | 替代强化系统的独立养成线 | 中 |
| 附魔系统 | 装备打孔、镶嵌宝石 | 中 |
| 宠物/坐骑 | 跟随玩家提供被动加成 | 中 |
🟢 低优先级 - 趣味功能
| 功能 | 描述 | 复杂度 |
|------|------|--------|
| 成就系统 | 击杀1000只怪、获得全套传说等 | 低 |
| 排行榜 | 展示玩家装备/等级排名 | 低 |
| 抽奖系统 | 消耗金币抽取装备 | 低 |
| 交易市场 | 玩家间交易装备 | 高 |
| 公会系统 | 加入公会，共同讨伐BOSS | 高 |
---
