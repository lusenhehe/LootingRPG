**怎么游玩:** 
1. 安装Node.js
2. 终端运行 `npm install`
3. 终端运行 `npm run dev`

继续拆分

把“调试命令”、“登录/存档”等逻辑分别放到更专门的 hook（或 domain service)。

- **调试命令** 移到 `src/hooks/game/useDebug.ts`。
- **存档/登录** 已经由 `useProfileSave` 管理。

项目现在使用了 `GameProvider`/`useGame` context（见 `src/app/GameContext.tsx`），
内部通过 `useReducer` 维护 `gameState` 并组合多个小 hook。组件只需调用
`useGame()` 获取所有状态和操作，彻底移除了原来的大钩子。

`useGameOrchestrator.ts` 目前仅保留一个 alias，最终可删。

这样不仅减少了 prop drilling，还让各个功能更易测试、复用和演进。

将几种状态（game、map、logger）组合成 <GameProvider>，通过 useGame() 访问；
让组件只关心自己需要的 slice。
从 Hook 向命令/事件

提供统一 dispatch({type:…,payload}) 接口，解耦 UI 和业务实现。
编写单元测试

每个小 hook 可单独 mock 依赖，轻松验证逻辑。