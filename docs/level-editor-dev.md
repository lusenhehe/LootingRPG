# 关卡编辑器（独立程序）

这是一个独立于主游戏 UI 的小型关卡编辑器，可自动导入当前项目中的怪物与关卡配置，并支持编辑后写回配置文件。

## 功能

- 自动导入怪物配置：`asset/data/config/content/monsters.json`
- 自动导入关卡配置：`asset/data/config/map/mapdata.json` 中的 `MAP_CHAPTERS` 数组
- 编辑章节与节点（ID、名称、推荐等级、遭遇类型、奖励、坐标）
- 编辑节点波次（`waves`）JSON
- 一键保存回 `mapChapterAdapter.ts`

## 启动

在项目根目录执行：

```bash
npm run level-editor
```

默认地址：

- http://127.0.0.1:4310

## 使用说明

1. 左侧选择章节。
2. 中间选择节点。
3. 右侧编辑区修改章节/节点字段。
4. 若需要编辑波次，修改 `Waves(JSON)` 文本框（必须是合法 JSON 数组）。
5. 点击“保存到 asset/data/config/map/mapdata.json”。

## 文件结构

- `tools/level-editor/server.mjs`：独立 HTTP 服务，负责读写配置
- `tools/level-editor/public/index.html`：编辑器界面
- `package.json`：新增 `level-editor` 脚本

## 注意事项

- 保存会直接改写 `asset/data/config/map/mapdata.json` 中的 `MAP_CHAPTERS` 数组内容。
- 建议在使用前先提交一次 Git，便于回滚。
- `Waves(JSON)` 输入格式错误时不会应用到数据。
