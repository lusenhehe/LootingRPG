开发提示词与文档：

项目需求：将原先地图节点单怪物设计改为多波怪物模式。
1. 扩展 types/game.ts 中 Monster 类型，icon->icons:string[]。
2. 在地图配置中为 MapNodeDef 添加 waves:NodeWave[]，每波包含多个怪物引用。
3. 删除所有 “元素图标” 相关字段和组件。
4. 修改 MapViewport/MapNode 让节点显示波次与各怪物图标。
5. 修改战斗逻辑，使 onEnterNode 载入一个怪物队列并按波次推进。
6. 改变 GameState、battleEngine、profile 保存格式来记录波次进度。
7. 提供 UI 控件查看当前波与剩余怪物，例如类似植物大战僵尸的横条。

请给出代码片段、类型定义、配置示例和必要的组件设计。
